"use client";

import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  InternalScheduleItem,
  formatDateRange,
  formatWhatsappText,
} from "./schedule-formatter";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; badgeClass: string }
> = {
  confirmed: {
    label: "Confirmed",
    icon: "✅",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  new_or_changed: {
    label: "Newly Added/Changed",
    icon: "🌦️",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  ishanga_pending: {
    label: "Ishanga Pending",
    icon: "❓",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  center_unconfirmed: {
    label: "Center Unconfirmed",
    icon: "‼️",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  hall_unfinalized: {
    label: "Hall Unfinalized",
    icon: "❕",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: "❌",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const INITIAL_FORM: Partial<InternalScheduleItem> = {
  location_name: "",
  program_name: "IEP Malayalam in-person",
  start_date: "",
  end_date: "",
  link_url: "",
  status: "confirmed",
  emoji_prefix: "🌊",
};

export default function SchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<InternalScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InternalScheduleItem>>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userEmail = session?.user?.email?.trim().toLowerCase() || "";
      console.log("Logged in user email:", userEmail);

      if (userEmail === "kavitha@ishakerala.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      await fetchSchedules();
    };

    checkAuthAndFetch();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email?.trim().toLowerCase() || "";
      if (userEmail === "kavitha@ishakerala.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("internal_schedules")
      .select("*")
      .order("start_date", { ascending: true })
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setSchedules(data as InternalScheduleItem[]);
    }
    setLoading(false);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InternalScheduleItem) => {
    setEditingId(item.id);
    setFormData({
      location_name: item.location_name,
      program_name: item.program_name,
      start_date: item.start_date,
      end_date: item.end_date || "",
      link_url: item.link_url || "",
      status: item.status,
      emoji_prefix: item.emoji_prefix || "🌊",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location_name || !formData.program_name || !formData.start_date) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);

    const payload = {
      location_name: formData.location_name,
      program_name: formData.program_name,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      link_url: formData.link_url || null,
      status: formData.status || "confirmed",
      emoji_prefix: formData.emoji_prefix || "🌊",
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("internal_schedules")
        .update(payload)
        .eq("id", editingId);
      if (error) alert("Failed to update schedule item.");
    } else {
      const { error } = await supabase.from("internal_schedules").insert([payload]);
      if (error) alert("Failed to create schedule item.");
    }

    setIsSaving(false);
    setIsModalOpen(false);
    fetchSchedules();
  };

  const handleDelete = async (id: string, location: string) => {
    if (!confirm(`Are you sure you want to delete the schedule item for "${location}"?`)) return;

    const { error } = await supabase.from("internal_schedules").delete().eq("id", id);
    if (error) {
      alert("Failed to delete schedule item.");
    } else {
      fetchSchedules();
    }
  };

  const handleCopyWhatsapp = () => {
    const messageText = formatWhatsappText(schedules);
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPDF = async () => {
    if (!pdfContainerRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = pdfContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#F7F6F2",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save("isha_kerala_program_schedule.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not export PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-black/10 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A63]">Program Schedule Master</h1>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin ? "Admin Mode Active (kavitha@ishakerala.com)" : "Public View Schedule"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-full bg-[#1F2A63] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#161e47]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Entry
              </button>
            )}

            <button
              onClick={handleCopyWhatsapp}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              {copied ? "Copied!" : "WhatsApp Text"}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 rounded-full bg-[#F28C18] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {isGeneratingPdf ? "Exporting..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Schedule Table Container */}
        <div ref={pdfContainerRef} className="bg-[#F7F6F2] p-6 rounded-3xl">
          <div className="text-center pb-6 border-b-2 border-[#F28C18] mb-6">
            <h1 className="text-2xl font-bold text-[#1F2A63]">ISHA KERALA PROGRAMS</h1>
            <p className="text-xs font-semibold text-[#F28C18] uppercase tracking-wider mt-1">
              Upcoming Program Schedule
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading schedule...</div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white shadow-md overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm text-slate-800 table-fixed">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                  <col className={isAdmin ? "w-[28%]" : "w-[34%]" } />
                  <col className="w-[18%]" />
                  {isAdmin && <col className="w-[16%]" />}
                </colgroup>
                <thead className="bg-slate-100 text-slate-900 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Program</th>
                    <th className="px-5 py-3.5">Status</th>
                    {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {schedules.map((item) => {
                    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.confirmed;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-900 text-xs">
                          {item.emoji_prefix} {formatDateRange(item.start_date, item.end_date)}
                        </td>
                        <td className="px-5 py-4 font-bold text-[#1F2A63] text-sm truncate">
                          {item.location_name}
                        </td>
                        <td className="px-5 py-4 font-normal text-slate-800 text-sm">
                          {item.program_name}
                          {item.link_url && (
                            <a
                              href={item.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-[#F28C18] hover:underline inline-block"
                            >
                              [Link]
                            </a>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                            <span>{statusConfig.icon}</span>
                            <span>{statusConfig.label}</span>
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-xs font-semibold text-slate-600 hover:text-[#1F2A63] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.location_name)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL (Admin Only) */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold text-[#1F2A63]">
                {editingId ? "Edit Schedule Entry" : "Add New Schedule Entry"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WAYANAD or ???"
                  value={formData.location_name || ""}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IEP Malayalam in-person"
                  value={formData.program_name || ""}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || "confirmed"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as InternalScheduleItem["status"],
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                  >
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="new_or_changed">🌦️ Newly added/changed</option>
                    <option value="ishanga_pending">❓ Ishanga pending</option>
                    <option value="center_unconfirmed">‼️ Center unconfirmed</option>
                    <option value="hall_unfinalized">❕ Hall unfinalized</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emoji Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.emoji_prefix || "🌊"}
                    onChange={(e) => setFormData({ ...formData, emoji_prefix: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registration / Info Link
                </label>
                <input
                  type="url"
                  placeholder="https://isha.co/Wayanad"
                  value={formData.link_url || ""}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full bg-[#1F2A63] text-xs font-semibold text-white hover:bg-[#161e47] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}