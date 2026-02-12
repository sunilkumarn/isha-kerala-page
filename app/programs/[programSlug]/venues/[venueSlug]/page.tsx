import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { SVGProps } from "react";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

function VenueIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z" />
      <path d="M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 3v3M16 3v3" />
      <path d="M4.5 9h15" />
      <path d="M6.5 5.5h11A2 2 0 0 1 19.5 7.5v12A2 2 0 0 1 17.5 21.5h-11A2 2 0 0 1 4.5 19.5v-12A2 2 0 0 1 6.5 5.5Z" />
    </svg>
  );
}

function LanguageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 5h8" />
      <path d="M8 5v2c0 4-2 7-5 9" />
      <path d="M6 10c1.2 2.3 3.5 4.3 6 5.5" />
      <path d="M14 19l4-10 4 10" />
      <path d="M16 15h4" />
    </svg>
  );
}

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 16.5v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.8 19.8 0 0 1 1.5 2.9 2 2 0 0 1 3.5.7h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L6.9 8.8a16 16 0 0 0 8.3 8.3l1.7-1.7a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 21 16.5Z" />
    </svg>
  );
}

type Program = {
  id: string | number;
  name: string;
  slug: string;
  sub_text?: string | null;
};

type Venue = {
  id: string | number;
  name: string;
  slug: string;
  google_maps_url?: string | null;
  cities?: { name: string }[] | null;
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
  registrations_allowed?: boolean | null;
  registration_link?: string | null;
  open_without_registration?: boolean | null;
  programs?: {
    name: string;
    image_url?: string | null;
    updated_at?: string | null;
    colour?: string | null;
    sub_text?: string | null;
  } | null;
  venues?: {
    name: string;
    slug: string;
    google_maps_url?: string | null;
    cities?: { name: string }[] | null;
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

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
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

  return startDate;
}

function formatSessionTimeRange(session: Session) {
  const startTime = formatTime(session.start_time);
  const endTime = formatTime(session.end_time);

  if (!startTime && !endTime) return "";
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime || endTime;
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

function toSafeHttpUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default async function ProgramVenueSessionsPage({
  params,
}: {
  params: Promise<{ programSlug: string; venueSlug: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { programSlug, venueSlug } = await params;
  const today = getTodayLocalISODate();

  const programByIdFirst = looksLikeUuid(programSlug);
  const venueByIdFirst = looksLikeUuid(venueSlug);

  const [
    { data: programBySlugRows, error: programBySlugError },
    { data: venuesBySlugRows, error: venuesBySlugError },
    programByIdResponse,
    venueByIdResponse,
  ] = await Promise.all([
    supabase
      .from("programs")
      .select("id, name, slug, sub_text")
      .eq("slug", programSlug)
      .order("id", { ascending: true })
      .limit(1),
    supabase
      .from("venues")
      .select("id, name, slug, google_maps_url, cities(name)")
      .eq("slug", venueSlug)
      .order("id", { ascending: true })
      .limit(500),
    programByIdFirst
      ? supabase
          .from("programs")
          .select("id, name, slug, sub_text")
          .eq("id", programSlug)
          .order("id", { ascending: true })
          .limit(1)
      : Promise.resolve({ data: null, error: null } as any),
    venueByIdFirst
      ? supabase
          .from("venues")
          .select("id, name, slug, google_maps_url, cities(name)")
          .eq("id", venueSlug)
          .order("id", { ascending: true })
          .limit(1)
      : Promise.resolve({ data: null, error: null } as any),
  ]);

  const programBySlug = (programBySlugRows?.[0] ?? null) as Program | null;
  const programById = (programByIdResponse?.data?.[0] ?? null) as Program | null;
  const venueById = (venueByIdResponse?.data?.[0] ?? null) as Venue | null;
  const venuesBySlug = (venuesBySlugRows ?? []) as Venue[];

  const programError =
    programBySlugError ?? (programByIdResponse?.error ?? null);
  const venueError = venuesBySlugError ?? (venueByIdResponse?.error ?? null);

  if (programError || venueError) {
    console.error("Failed to load program/venue:", programError ?? venueError);
    notFound();
  }

  const program = (programBySlug ?? programById) as Program | null;
  const venues = (venueByIdFirst ? (venueById ? [venueById] : []) : venuesBySlug) as Venue[];

  if (!program || venues.length === 0) notFound();

  // Backwards compatibility for old ID-based URLs.
  // If we were hit with an ID, redirect to the canonical slug URL.
  if ((programByIdFirst || venueByIdFirst) && program.slug) {
    const canonicalVenueSlug = venueByIdFirst ? venueById?.slug : venueSlug;
    if (canonicalVenueSlug && (programSlug !== program.slug || venueSlug !== canonicalVenueSlug)) {
      redirect(
        `/programs/${encodeURIComponent(program.slug)}/venues/${encodeURIComponent(
          canonicalVenueSlug
        )}`
      );
    }
  }

  const programId = (program as Program).id;
  const venueIds = Array.from(new Set(venues.map((v) => v.id)));

  const { data: children, error: childrenError } = await supabase
    .from("programs")
    .select("id")
    .eq("parent_id", programId);

  if (childrenError) {
    console.error("Failed to load child programs:", childrenError);
    throw new Error(childrenError.message);
  }

  const childIds = (children ?? []).map((child) => child.id);
  const programIds = Array.from(new Set([programId, ...childIds]));

  let sessions: Session[] = [];
  let sessionsErrorMessage: string | null = null;

  if (programIds.length > 0 && venueIds.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        `
        *,
        programs(name, image_url, updated_at, colour, sub_text),
        venues(name, slug, google_maps_url, cities(name)),
        contacts(*)
      `
      )
      .in("venue_id", venueIds)
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

  const venueCityName =
    venues.find((v) => v.cities?.[0]?.name)?.cities?.[0]?.name ??
    venues[0]?.cities?.[0]?.name ??
    venueSlug;
  const title = `${(program as Program).name} in ${venueCityName}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F4EE]">
      <main className="flex-1">
        <header className="bg-indigo-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <Link
              href={`/programs/${encodeURIComponent((program as Program).slug)}`}
              className="mx-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to Venues
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h1>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
              Upcoming sessions
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
                const mapsHref = toSafeHttpUrl(session.venues?.google_maps_url);
                const registrationsAllowed = Boolean(session.registrations_allowed);
                const openWithoutRegistration = Boolean(
                  session.open_without_registration
                );
                const registrationHref = toSafeHttpUrl(session.registration_link);

                return (
                  <article
                    key={String(session.id)}
                    className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: accent ?? undefined }}
                  >
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      {session.programs?.image_url ? (
                        <Image
                          src={`${session.programs.image_url}${
                            session.programs.image_url.includes("?") ? "&" : "?"
                          }v=${encodeURIComponent(session.programs.updated_at ?? "")}`}
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
                      <div className="text-center">
                        <h3 className="text-xl text-slate-900">
                          {session.programs?.name ?? "Program"}
                        </h3>
                        {session.programs?.sub_text ? (
                          <p className="mt-0 text-sm text-slate-600 line-clamp-2">
                            {session.programs?.sub_text}
                          </p>
                        ) : null}
                      </div>

                      {registrationsAllowed || openWithoutRegistration ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {registrationsAllowed ? (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                              Register Required
                            </span>
                          ) : null}
                          {openWithoutRegistration ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Open to all
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-medium text-slate-600">
                          Contact for details
                        </p>
                      )}

                      <dl className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex items-start gap-3">
                          <VenueIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">Venue</dt>
                            <dd className="font-medium text-slate-700">
                              <span className="flex flex-wrap items-center gap-2">
                                <span>{session.venues?.name ?? "—"}</span>
                                {mapsHref ? (
                                  <a
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900"
                                    aria-label={`Open ${session.venues?.name ?? "venue"} on Google Maps`}
                                  >
                                    Google maps location
                                     <svg
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
                                      <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                                    </svg>
                                  </a>
                                ) : null}
                              </span>
                            </dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-slate-500">Date</dt>
                              <dd className="font-medium text-slate-700">
                                {formatSessionDates(session)}
                              </dd>
                            </div>
                            {formatSessionTimeRange(session) ? (
                              <div className="flex gap-2">
                                <dt className="w-20 shrink-0 text-slate-500">
                                  Time
                                </dt>
                                <dd className="font-medium text-slate-700">
                                  {formatSessionTimeRange(session)}
                                </dd>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {(session.language && 
                          <div className="flex items-start gap-3">
                            <LanguageIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-slate-500">Language</dt>
                              <dd className="font-medium text-slate-700">
                                {session.language ?? "—"}
                              </dd>
                            </div>
                          </div>
                        )} 
                        <div className="flex items-start gap-3">
                          <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
                            <dd className="font-medium text-slate-700">
                              {session.contacts?.phone ?? "—"}
                            </dd>
                          </div>
                        </div>
                      </dl>

                      {registrationsAllowed ? (
                        <div className="mt-6">
                          <a
                            href={registrationHref ?? undefined}
                            aria-disabled={!registrationHref}
                            className={`inline-flex w-full items-center justify-center rounded-full px-6 py-2 text-sm font-semibold text-white shadow-sm transition ${
                              registrationHref
                                ? "bg-[#F28C18] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
                                : "cursor-not-allowed bg-slate-300"
                            }`}
                            target={registrationHref ? "_blank" : undefined}
                            rel={registrationHref ? "noopener noreferrer" : undefined}
                          >
                            Register/Enquire Now
                          </a>
                        </div>
                      ) : null}
                      
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


