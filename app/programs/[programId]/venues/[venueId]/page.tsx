import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

type Program = {
  id: string | number;
  name: string;
};

type Venue = {
  id: string | number;
  name: string;
};

type Contact = {
  id: string | number;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city_id: string | number | null;
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
  programs?: {
    name: string;
    image_url?: string | null;
    colour?: string | null;
  } | null;
  contacts?: Contact | null;
};

function getTodayLocalISODate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatSessionDates(session: Session) {
  const startDate = formatDate(session.start_date);
  const endDate = formatDate(session.end_date);

  if (session.end_date && session.end_date !== session.start_date) {
    return `${startDate} – ${endDate || startDate}`;
  }

  const startTime = formatTime(session.start_time);
  const endTime = formatTime(session.end_time);

  if (startTime || endTime) {
    const timeRange = endTime ? `${startTime || "—"} – ${endTime}` : startTime;
    return `${startDate} (${timeRange})`;
  }

  return startDate;
}

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.trim().replace("#", "");
  const isValid = /^[0-9a-fA-F]{6}$/.test(cleaned);
  if (!isValid) return null;
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  const safeAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

function toTelHref(phone?: string | null) {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return `tel:${trimmed}`;
}

export default async function ProgramVenueSessionsPage({
  params,
}: {
  params: Promise<{ programId: string; venueId: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { programId, venueId } = await params;
  const today = getTodayLocalISODate();

  const [{ data: program, error: programError }, { data: venue, error: venueError }] =
    await Promise.all([
      supabase.from("programs").select("id, name").eq("id", programId).maybeSingle(),
      supabase.from("venues").select("id, name").eq("id", venueId).maybeSingle(),
    ]);

  if (programError || venueError) {
    console.error("Failed to load program/venue:", programError ?? venueError);
    notFound();
  }

  if (!program || !venue) notFound();

  const { data: children, error: childrenError } = await supabase
    .from("programs")
    .select("id")
    .eq("parent_id", programId);

  if (childrenError) {
    console.error("Failed to load child programs:", childrenError);
    throw new Error(childrenError.message);
  }

  const childIds = (children ?? []).map((child) => child.id);
  const programIds = childIds.length > 0 ? childIds : [programId];

  let sessions: Session[] = [];
  let sessionsErrorMessage: string | null = null;

  if (programIds.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        `
        *,
        programs(name, image_url, colour),
        contacts(*)
      `
      )
      .eq("venue_id", venueId)
      .in("program_id", programIds)
      .eq("is_published", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true });

    if (sessionsError) {
      sessionsErrorMessage = sessionsError.message;
      sessions = [];
    } else {
      sessions = (sessionRows ?? []) as Session[];
    }
  }

  const title = `${(program as Program).name} in ${(venue as Venue).name}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F4EE]">
      <main className="flex-1">
        <header className="bg-indigo-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <Link
              href={`/programs/${encodeURIComponent(programId)}`}
              className="mx-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to Venues
            </Link>

            <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h1>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
              Upcoming sessions available for registration
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-12">
          {sessionsErrorMessage ? (
            <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
              Failed to load sessions: {sessionsErrorMessage}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                No upcoming published sessions found for this venue yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => {
                const accent = session.programs?.colour
                  ? hexToRgba(session.programs.colour, 0.08)
                  : null;
                const telHref = toTelHref(session.contacts?.phone);

                return (
                  <article
                    key={String(session.id)}
                    className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: accent ?? undefined }}
                  >
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      {session.programs?.image_url ? (
                        <Image
                          src={session.programs.image_url}
                          alt={session.programs?.name ?? "Program image"}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs font-medium text-slate-500">
                            No image
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="font-serif text-xl text-slate-900">
                        {session.programs?.name ?? "Program"}
                      </h3>

                      <dl className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Venue</dt>
                          <dd className="font-medium text-slate-700">
                            {(venue as Venue).name}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Date</dt>
                          <dd>{formatSessionDates(session)}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Language</dt>
                          <dd>{session.language ?? "—"}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
                          <dd className="font-medium text-slate-700">
                            {session.contacts?.phone ?? "—"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-6">
                        <a
                          href={telHref ?? undefined}
                          aria-disabled={!telHref}
                          className={`inline-flex w-full items-center justify-center rounded-full px-6 py-2 text-sm font-semibold text-white shadow-sm transition ${
                            telHref
                              ? "bg-[#F28C18] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
                              : "cursor-not-allowed bg-slate-300"
                          }`}
                        >
                          Register Now
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


