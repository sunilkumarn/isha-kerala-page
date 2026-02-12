"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { adminDeleteById } from "@/lib/admin-delete";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import SessionModal from "@/components/admin/SessionModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Program = {
  id: string | number;
  name: string;
  colour?: string | null;
};

type Venue = {
  id: string | number;
  name: string;
  google_maps_url: string | null;
  city_id?: string | number | null;
  cities?: { name: string } | null;
};

type Contact = {
  id: string | number;
  name: string;
};

type City = {
  id: string | number;
  name: string;
};

type Session = {
  id: string | number;
  program_id: string | number | null;
  venue_id: string | number | null;
  contact_id: string | number | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  language: string | null;
  is_published: boolean | null;
  programs?: { name: string; colour?: string | null } | null;
  venues?: Venue | null;
  contacts?: { name: string } | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

const formatSessionDates = (session: Session) => {
  const startDate = formatDate(session.start_date);
  const endDate = formatDate(session.end_date);

  if (session.end_date && session.end_date !== session.start_date) {
    return `${startDate} \u2013 ${endDate || startDate}`;
  }

  const startTime = formatTime(session.start_time);
  const endTime = formatTime(session.end_time);

  if (startTime || endTime) {
    const timeRange = endTime ? `${startTime || "\u2014"} \u2013 ${endTime}` : startTime;
    return `${startDate} (${timeRange})`;
  }

  return startDate;
};

const PAGE_SIZE = 20;

function SessionsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Math.floor(Number(pageParam ?? "1") || 1));

  const [sessions, setSessions] = useState<Session[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"date" | "program" | "city">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Session | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setPage = (nextPage: number) => {
    const safeNextPage = Math.max(1, Math.floor(nextPage));
    const params = new URLSearchParams(searchParams.toString());
    if (safeNextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(safeNextPage));
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const sortedSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      if (sortKey === "program") {
        const aName = a.programs?.name ?? "";
        const bName = b.programs?.name ?? "";
        return aName.localeCompare(bName);
      }

      if (sortKey === "city") {
        const aCity = a.venues?.cities?.name ?? "";
        const bCity = b.venues?.cities?.name ?? "";
        return aCity.localeCompare(bCity);
      }

      return a.start_date.localeCompare(b.start_date);
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [sessions, sortKey, sortDirection]);

  const fetchSessions = async () => {
    setIsLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("sessions")
      .select(
        `
        *,
        programs(name, colour),
        venues(name, google_maps_url, cities(name)),
        contacts(name)
      `
        ,
        { count: "exact" }
      )
      .order("start_date", { ascending: true })
      .range(from, to);
    setTotalCount(count ?? 0);
    const nextTotalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
    if (page > nextTotalPages) {
      setPage(nextTotalPages);
    }

    if (error) {
      setErrorMessage(error.message);
      setSessions([]);
    } else {
      setErrorMessage(null);
      setSessions(data ?? []);
    }

    setIsLoading(false);
  };

  const fetchLookups = async () => {
    const [programResponse, venueResponse, contactResponse, cityResponse] =
      await Promise.all([
      supabase.from("programs").select("*").order("name"),
      supabase.from("venues").select("*, cities(name)").order("name"),
      supabase.from("contacts").select("*").order("name"),
      supabase.from("cities").select("*").order("name"),
    ]);

    if (
      programResponse.error ||
      venueResponse.error ||
      contactResponse.error ||
      cityResponse.error
    ) {
      setErrorMessage(
        programResponse.error?.message ||
          venueResponse.error?.message ||
          contactResponse.error?.message ||
          cityResponse.error?.message ||
          "Unable to load dropdown data."
      );
      setPrograms([]);
      setVenues([]);
      setContacts([]);
      setCities([]);
      return;
    }

    setPrograms(programResponse.data ?? []);
    setVenues(venueResponse.data ?? []);
    setContacts(contactResponse.data ?? []);
    setCities(cityResponse.data ?? []);
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
    setErrorMessage(null);
  };

  const handleSaveSession = async (payload: {
    programId: string | number | null;
    cityId: string | number | null;
    venueId: string | number | null;
    contactId: string | number | null;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    language: string;
    isPublished: boolean;
  }) => {
    if (!payload.programId || !payload.venueId || !payload.contactId) {
      setErrorMessage("Please select a program, venue, and contact.");
      return;
    }

    if (!payload.startDate) {
      setErrorMessage("Please choose a start date.");
      return;
    }

    setIsSaving(true);

    const sessionPayload = {
      program_id: payload.programId,
      venue_id: payload.venueId,
      contact_id: payload.contactId,
      start_date: payload.startDate,
      end_date: payload.endDate || null,
      start_time: payload.startTime || null,
      end_time: payload.endTime || null,
      language: payload.language,
      is_published: payload.isPublished,
    };

    const { error } = editingSession
      ? await supabase
          .from("sessions")
          .update(sessionPayload)
          .eq("id", editingSession.id)
      : await supabase.from("sessions").insert(sessionPayload);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setEditingSession(null);
    await fetchSessions();
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (session: Session) => {
    setPendingDelete(session);
    setDeleteErrorMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await adminDeleteById("sessions", pendingDelete.id);
      setConfirmOpen(false);
      setPendingDelete(null);
      await fetchSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
    setDeleteErrorMessage(null);
    setIsDeleting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-medium text-[#2B2B2B]">Sessions</h1>
          <p className="mt-1 text-sm text-[#8C7A5B]">
            Plan program sessions with dates, venues, and contacts.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingSession(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-3 text-base"
        >
          + Create Session
        </Button>
      </header>

      <section className="rounded-xl border border-[#E2DED3] bg-white">
        <div className="border-b border-[#E2DED3] px-6 py-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#8C7A5B]">
            <span className="text-xs uppercase tracking-[0.25em]">Sort</span>
            <button
              type="button"
              onClick={() => {
                setSortKey("program");
                setSortDirection((prev) =>
                  sortKey === "program" && prev === "asc" ? "desc" : "asc"
                );
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#E2DED3] bg-[#F6F4EF] px-3 py-1"
            >
              Program
              <span className="text-xs">
                {sortKey === "program"
                  ? sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : "↕"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSortKey("city");
                setSortDirection((prev) =>
                  sortKey === "city" && prev === "asc" ? "desc" : "asc"
                );
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#E2DED3] bg-[#F6F4EF] px-3 py-1"
            >
              City
              <span className="text-xs">
                {sortKey === "city"
                  ? sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : "↕"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSortKey("date");
                setSortDirection((prev) =>
                  sortKey === "date" && prev === "asc" ? "desc" : "asc"
                );
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#E2DED3] bg-[#F6F4EF] px-3 py-1"
            >
              Dates
              <span className="text-xs">
                {sortKey === "date"
                  ? sortDirection === "asc"
                    ? "↑"
                    : "↓"
                  : "↕"}
              </span>
            </button>
          </div>
        </div>
        <div className="px-6 py-6">
          {isLoading ? (
            <p className="text-sm text-[#8C7A5B]">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-[#8C7A5B]">
              No sessions yet. Add the first one.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden text-xs uppercase tracking-[0.2em] text-[#8C7A5B] lg:grid lg:grid-cols-[1.4fr_1.2fr_1fr_1.3fr_1fr_0.8fr_0.8fr] lg:gap-4 lg:px-2 lg:pb-2">
                <span>Program</span>
                <span>Venue</span>
                <span>City</span>
                <span>Dates</span>
                <span>Contact</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-[#E2DED3] px-5 py-4"
                  style={{
                    backgroundColor: "#FDFBF7",
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 text-sm text-[#2B2B2B] lg:grid-cols-[1.4fr_1.2fr_1fr_1.3fr_1fr_0.8fr_0.8fr] lg:items-center">
                    <div className="flex items-center gap-2 font-medium">
                      <span
                        className="rounded-full border border-[#E2DED3] px-3 py-1 text-sm font-medium"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.65)",
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full border border-[#E2DED3]"
                            style={{
                              backgroundColor:
                                session.programs?.colour ?? "transparent",
                            }}
                          />
                          {session.programs?.name ?? "—"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8C7A5B]">
                      <span>{session.venues?.name ?? "—"}</span>
                      {session.venues?.google_maps_url ? (
                        <a
                          href={session.venues.google_maps_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`Open ${session.venues?.name ?? "venue"} in Google Maps`}
                          title="Open in Google Maps"
                          className="inline-flex items-center justify-center rounded-md border border-[#E2DED3] bg-[#F6F4EF] p-1 text-[#006400] hover:bg-[#EAE6DC] hover:text-[#004d00]"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
                            <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                          </svg>
                        </a>
                      ) : null}
                    </div>
                    <div className="text-[#8C7A5B]">
                      {session.venues?.cities?.name ?? "—"}
                    </div>
                    <div className="text-[#8C7A5B]">
                      {formatSessionDates(session)}
                    </div>
                    <div className="text-[#8C7A5B]">
                      {session.contacts?.name ?? "—"}
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          session.is_published
                            ? "bg-[#DDE9DC] text-[#2E5A3C]"
                            : "bg-[#EAE6DC] text-[#8C7A5B]"
                        }`}
                      >
                        {session.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="flex items-center justify-start gap-3 text-xs lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleEditSession(session)}
                        className="text-[#6B5E4A] hover:text-[#2B2B2B]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(session)}
                        className="text-[#8C7A5B] hover:text-[#2B2B2B]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {totalPages > 1 ? (
          <div className="border-t border-[#E2DED3] px-6 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>

      <SessionModal
        open={isModalOpen}
        programs={programs}
        venues={venues}
        contacts={contacts}
        cities={cities}
        isSaving={isSaving}
        errorMessage={errorMessage}
        initialSession={editingSession}
        onClose={handleCloseModal}
        onSave={handleSaveSession}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Session"
        message="Delete this session? This action cannot be undone."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        errorMessage={deleteErrorMessage}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[#8C7A5B]">Loading sessions...</p>}
    >
      <SessionsPageInner />
    </Suspense>
  );
}

