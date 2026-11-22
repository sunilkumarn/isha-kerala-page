"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type VolunteeringInterest = {
  id: string;
  full_name: string;
  mobile_number: string;
  whatsapp_number: string | null;
  email: string | null;
  city_id: string | number | null;
  local_center: string;
  areas_of_interest: string[];
  availability: string | null;
  notes: string | null;
  status: "New" | "Contacted" | "Active" | "Archived";
  created_at: string;
};

type CityOption = {
  id: string | number;
  name: string;
};

const STATUS_OPTIONS = ["All", "New", "Contacted", "Active", "Archived"] as const;

const STATUS_BADGE_STYLES: Record<VolunteeringInterest["status"], string> = {
  New: "bg-amber-100 text-amber-900 border-amber-200",
  Contacted: "bg-blue-100 text-blue-900 border-blue-200",
  Active: "bg-emerald-100 text-emerald-900 border-emerald-200",
  Archived: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminVolunteeringPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [records, setRecords] = useState<VolunteeringInterest[]>([]);
  const [centers, setCenters] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState("All");
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);

    const [submissionsRes, citiesRes] = await Promise.all([
      supabase
        .from("volunteering_interests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("cities").select("id, name").order("name", { ascending: true }),
    ]);

    if (submissionsRes.error) {
      setErrorMsg(submissionsRes.error.message);
    } else {
      setRecords((submissionsRes.data as VolunteeringInterest[]) || []);
    }

    if (!citiesRes.error && citiesRes.data) {
      setCenters(citiesRes.data as CityOption[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (
    id: string,
    nextStatus: VolunteeringInterest["status"]
  ) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("volunteering_interests")
      .update({ status: nextStatus })
      .eq("id", id);

    if (!error) {
      setRecords((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: nextStatus } : row))
      );
    } else {
      setErrorMsg(error.message);
    }
    setUpdatingId(null);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesCenter =
        selectedCenter === "All" || item.local_center === selectedCenter;
      const matchesStatus =
        selectedStatus === "All" || item.status === selectedStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.full_name.toLowerCase().includes(q) ||
        item.mobile_number.includes(q) ||
        (item.local_center && item.local_center.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q));

      return matchesCenter && matchesStatus && matchesSearch;
    });
  }, [records, selectedCenter, selectedStatus, searchQuery]);

  const exportCsv = () => {
    const headers = [
      "Full Name",
      "Mobile Number",
      "WhatsApp Number",
      "Email",
      "Local Center",
      "Areas of Interest",
      "Availability",
      "Status",
      "Submitted At",
    ];

    const rows = filteredRecords.map((r) => [
      r.full_name,
      r.mobile_number,
      r.whatsapp_number ?? "",
      r.email ?? "",
      r.local_center ?? "",
      (r.areas_of_interest || []).join("; "),
      r.availability ?? "",
      r.status,
      new Date(r.created_at).toLocaleString("en-IN"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kerala-volunteering-interests-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
          <div>
            <span className="inline-block rounded-full bg-[#1F2A63]/10 px-3.5 py-1 text-xs font-semibold text-[#1F2A63]">
              Kerala Volunteering
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Volunteering Interest Submissions
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Showing {filteredRecords.length} of {records.length} submissions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredRecords.length === 0}
              className="rounded-full bg-[#F28C18] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:brightness-95 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, 10-digit mobile, center..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none focus:ring-2 focus:ring-[#1F2A63]/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Local Center
            </label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none focus:ring-2 focus:ring-[#1F2A63]/15"
            >
              <option value="All">All Centers</option>
              {centers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value as (typeof STATUS_OPTIONS)[number]
                )
              }
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-[#1F2A63] focus:outline-none focus:ring-2 focus:ring-[#1F2A63]/15"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Volunteer</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Local Center</th>
                  <th className="px-4 py-3.5">Areas &amp; Availability</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Loading submissions...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No volunteering submissions match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {item.full_name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="font-medium text-slate-800">
                          {item.mobile_number}
                        </div>
                        {item.whatsapp_number &&
                          item.whatsapp_number !== item.mobile_number && (
                            <div className="text-xs text-slate-500">
                              WA: {item.whatsapp_number}
                            </div>
                          )}
                        {item.email && (
                          <div className="text-xs text-slate-500">
                            {item.email}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center rounded-full bg-[#1F2A63]/10 px-3 py-1 text-xs font-semibold text-[#1F2A63]">
                          {item.local_center}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        {item.areas_of_interest?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.areas_of_interest.map((area) => (
                              <span
                                key={area}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not specified
                          </span>
                        )}
                        {item.availability && (
                          <div className="mt-1.5 text-xs text-slate-600">
                            Availability: {item.availability}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <select
                          aria-label={`Status for ${item.full_name}`}
                          disabled={updatingId === item.id}
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id,
                              e.target.value as VolunteeringInterest["status"]
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-semibold focus:outline-none ${
                            STATUS_BADGE_STYLES[item.status]
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Active">Active</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}