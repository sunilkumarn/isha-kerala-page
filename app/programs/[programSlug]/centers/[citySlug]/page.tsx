import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/slugify";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;

type Program = {
  id: string | number;
  name: string;
  slug: string;
};

type ProgramJoin = {
  name: string;
  slug?: string | null;
  image_url: string | null;
  updated_at: string | null;
  colour: string | null;
  sub_text: string | null;
};

type CityJoin = { name: string; slug?: string | null };

type VenueJoin = {
  name: string;
  slug?: string | null;
  google_maps_url: string | null;
  cities: CityJoin | CityJoin[] | null;
};

type ContactJoin = {
  phone: string | null;
  whatsapp: string | null;
};

type Session = {
  id: string | number;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  language: string | null;
  registrations_allowed: boolean | null;
  registration_link: string | null;
  open_without_registration: boolean | null;
  programs: ProgramJoin | ProgramJoin[] | null;
  venues: VenueJoin | VenueJoin[] | null;
  contacts: ContactJoin | ContactJoin[] | null;
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

function looksLikeNumericId(value: string) {
  return /^\d+$/.test(value.trim());
}

function pickSearchParam(value: SearchParamValue) {
  if (!value) return null;
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return null;
  const trimmed = first.trim();
  return trimmed ? trimmed : null;
}

function normalizeIsoDateParam(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const [yyyyRaw, mmRaw, ddRaw] = trimmed.split("-");
  const yyyy = Number(yyyyRaw);
  const mm = Number(mmRaw);
  const dd = Number(ddRaw);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;

  const utc = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    utc.getUTCFullYear() !== yyyy ||
    utc.getUTCMonth() !== mm - 1 ||
    utc.getUTCDate() !== dd
  ) {
    return null;
  }

  return trimmed;
}

async function getOriginFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
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

function formatSessionDates(session: Pick<Session, "start_date" | "end_date">) {
  const startDate = formatDate(session.start_date);
  const endDate = formatDate(session.end_date);

  if (session.end_date && session.end_date !== session.start_date) {
    return `${startDate} – ${endDate || startDate}`;
  }

  return startDate;
}

function formatSessionTimeRange(session: Pick<Session, "start_time" | "end_time">) {
  const startTime = formatTime(session.start_time);
  const endTime = formatTime(session.end_time);

  if (!startTime && !endTime) return "";
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  return startTime || endTime;
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

function toTelHref(phone?: string | null) {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return `tel:${trimmed}`;
}

function normalizeSlug(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getProgramFromSession(session: Session) {
  return pickOne(session.programs);
}

function getVenueFromSession(session: Session) {
  return pickOne(session.venues);
}

function getContactFromSession(session: Session) {
  return pickOne(session.contacts);
}

function getCityFromSession(session: Session) {
  const venue = getVenueFromSession(session);
  if (!venue) return null;

  const cities = venue.cities ?? null;
  const city = pickOne(cities);
  if (!city) {
    return { name: "Other", dbSlug: null, derivedSlug: slugify("Other") };
  }
  const name = city.name?.trim() || null;
  const dbSlug = city.slug?.trim() || null;
  const derivedSlug = name ? slugify(name) : null;
  return { name, dbSlug, derivedSlug };
}

export default async function ProgramCitySessionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ programSlug: string; citySlug: string }>;
  searchParams?: Promise<Record<string, SearchParamValue>>;
}) {
  const supabase = createSupabaseServerClient();
  const { programSlug, citySlug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const today = getTodayLocalISODate();
  const origin = await getOriginFromHeaders();

  const isAllPrograms = normalizeSlug(programSlug) === "all-programs";
  const venueParamRaw = pickSearchParam(resolvedSearchParams.venue);
  const dateParamRaw = pickSearchParam(resolvedSearchParams.date);
  const venueParam = venueParamRaw ? normalizeSlug(venueParamRaw) : null;
  const startDateParam = normalizeIsoDateParam(dateParamRaw);
  const dateParamErrorMessage =
    dateParamRaw && !startDateParam ? "Invalid date parameter." : null;

  let venueId: string | number | null = null;
  let venueLookupErrorMessage: string | null = null;
  let venueWasFound = true;

  if (venueParam) {
    const shouldTryIdFirst = looksLikeUuid(venueParamRaw ?? "") || looksLikeNumericId(venueParamRaw ?? "");

    const lookupById = async () =>
      supabase.from("venues").select("id").eq("id", venueParamRaw).limit(1);
    const lookupBySlug = async () =>
      supabase.from("venues").select("id").eq("slug", venueParam).limit(1);

    const { data: venueRows, error: venueError } = shouldTryIdFirst
      ? await (async () => {
          const byId = await lookupById();
          if (byId.error) return byId;
          if (byId.data && byId.data.length > 0) return byId;
          return lookupBySlug();
        })()
      : await (async () => {
          const bySlug = await lookupBySlug();
          if (bySlug.error) return bySlug;
          if (bySlug.data && bySlug.data.length > 0) return bySlug;
          return lookupById();
        })();

    if (venueError) {
      venueLookupErrorMessage = venueError.message;
    } else {
      const firstVenue = venueRows?.[0] ?? null;
      venueId = (firstVenue?.id ?? null) as string | number | null;
      if (!venueId) venueWasFound = false;
    }
  }

  if (isAllPrograms) {
    const shouldSkipSessionsQuery =
      Boolean(dateParamErrorMessage) ||
      (Boolean(venueParam) && !venueLookupErrorMessage && !venueWasFound);

    const { data: sessionRows, error: sessionsError } = shouldSkipSessionsQuery
      ? { data: [], error: null }
      : await (() => {
          let query = supabase
            .from("sessions")
            .select(
              `
                id,
                start_date,
                end_date,
                start_time,
                end_time,
                language,
                registrations_allowed,
                registration_link,
                open_without_registration,
                programs(name, slug, image_url, updated_at, colour, sub_text),
                venues(name, slug, google_maps_url, cities(name, slug)),
                contacts(phone, whatsapp)
              `
            )
            .eq("is_published", true)
            .order("start_date", { ascending: true });

          if (venueId) query = query.eq("venue_id", venueId);
          if (startDateParam) {
            query = query.eq("start_date", startDateParam);
          } else {
            query = query.gte("start_date", today);
          }

          return query;
        })();

    const sessionsErrorMessage =
      dateParamErrorMessage ??
      venueLookupErrorMessage ??
      sessionsError?.message ??
      null;
    const targetCitySlug = normalizeSlug(citySlug);

    const allSessions = ((sessionRows ?? []) as Session[]).filter(Boolean);
    const citySessions = allSessions.filter((session) => {
      const city = getCityFromSession(session);
      if (!city) return false;
      const dbSlug = city.dbSlug ? normalizeSlug(city.dbSlug) : null;
      const derivedSlug = city.derivedSlug ? normalizeSlug(city.derivedSlug) : null;
      return dbSlug === targetCitySlug || derivedSlug === targetCitySlug;
    });

    const cityDisplayName = (citySessions.length > 0
      ? getCityFromSession(citySessions[0])?.name
      : null) ?? citySlug;

    const title = `All programs in ${cityDisplayName}`;

    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F4EE]">
        <main className="flex-1">
          <header className="bg-indigo-950 text-white">
            <div className="mx-auto max-w-6xl px-6 py-14 text-center">
              <Link
                href="/centers"
                className="mx-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
              >
                <span aria-hidden="true">←</span>
                Back to Centers
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
            ) : citySessions.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-gray-600">
                  No upcoming published sessions found for this city yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {citySessions.map((session) => {
                  const programInfo = getProgramFromSession(session);
                  const venueInfo = getVenueFromSession(session);
                  const contactInfo = getContactFromSession(session);

                  const mapsHref = toSafeHttpUrl(venueInfo?.google_maps_url);
                  const registrationsAllowed = Boolean(session.registrations_allowed);
                  const openWithoutRegistration = Boolean(
                    session.open_without_registration
                  );
                  const registrationHref = toSafeHttpUrl(session.registration_link);
                  const phoneHref = toTelHref(contactInfo?.phone);
                  const timeRange = formatSessionTimeRange(session);
                  const shareProgramSlug = programInfo?.slug?.trim() || null;
                  const shareVenueSlug = venueInfo?.slug?.trim() || null;
                  const shareDate = session.start_date;
                  const shareToken =
                    shareProgramSlug && shareVenueSlug && shareDate
                      ? `${shareProgramSlug}-${normalizeSlug(citySlug)}-${shareVenueSlug}-${shareDate}`
                      : null;
                  const shareUrl = shareToken
                    ? `${origin ?? ""}/share-program/${encodeURIComponent(shareToken)}`
                    : null;
                  const whatsAppShareHref = shareUrl
                    ? `https://wa.me/?text=${encodeURIComponent(
                        `See upcoming session details: ${shareUrl}`
                      )}`
                    : null;

                  return (
                    <article
                      key={String(session.id)}
                      className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-100">
                        {programInfo?.image_url ? (
                          <Image
                            src={`${programInfo.image_url}${
                              programInfo.image_url.includes("?") ? "&" : "?"
                            }v=${encodeURIComponent(programInfo.updated_at ?? "")}`}
                            alt={programInfo?.name ?? "Program image"}
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
                            {programInfo?.name ?? "Program"}
                          </h3>
                          {programInfo?.sub_text ? (
                            <p className="mt-0 text-sm text-slate-600 line-clamp-2">
                              {programInfo.sub_text}
                            </p>
                          ) : null}
                        </div>

                        {registrationsAllowed || openWithoutRegistration ? (
                          <div className="mt-3 flex flex-wrap gap-2">
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
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">Venue</dt>
                            <dd className="font-medium text-slate-700">
                              <span className="flex flex-wrap items-center gap-2">
                                <span>{venueInfo?.name ?? "—"}</span>
                                {mapsHref ? (
                                  <a
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
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
                                    Google maps
                                  </a>
                                ) : null}
                              </span>
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">Date</dt>
                            <dd className="font-medium text-slate-700">
                              {formatSessionDates(session)}
                            </dd>
                          </div>
                          {timeRange ? (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-slate-500">Time</dt>
                              <dd className="font-medium text-slate-700">
                                {timeRange}
                              </dd>
                            </div>
                          ) : null}
                          {session.language ? (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-slate-500">
                                Language
                              </dt>
                              <dd className="font-medium text-slate-700">
                                {session.language}
                              </dd>
                            </div>
                          ) : null}
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
                            <dd className="font-medium text-slate-700">
                              {phoneHref ? (
                                <a href={phoneHref} className="hover:underline">
                                  {contactInfo?.phone}
                                </a>
                              ) : (
                                (contactInfo?.phone ?? "—")
                              )}
                            </dd>
                          </div>
                        </dl>

                        {registrationsAllowed || whatsAppShareHref ? (
                          <div className="mt-6">
                            {registrationsAllowed ? (
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
                            ) : null}
                            {whatsAppShareHref ? (
                              <a
                                href={whatsAppShareHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${registrationsAllowed ? "mt-3 " : ""}inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-green-600 bg-white px-6 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:ring-offset-2`}
                              >
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 32 32"
                                  className="h-5 w-5"
                                  fill="currentColor"
                                >
                                  <path d="M19.11 17.61c-.23-.12-1.34-.66-1.55-.74-.21-.08-.36-.12-.51.12-.15.23-.59.74-.72.89-.13.15-.27.17-.5.06-.23-.12-.98-.36-1.86-1.16-.69-.61-1.15-1.36-1.28-1.59-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.11-.13.15-.23.23-.38.08-.15.04-.29-.02-.4-.06-.12-.51-1.23-.7-1.68-.18-.43-.37-.37-.51-.38h-.44c-.15 0-.4.06-.61.29-.21.23-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.61 2.46 3.89 3.45.54.23.96.37 1.29.47.54.17 1.03.15 1.42.09.43-.06 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.06-.1-.21-.15-.44-.27ZM16.02 5.33c-5.87 0-10.64 4.77-10.64 10.64 0 1.87.49 3.7 1.43 5.31l-1.52 5.54 5.67-1.49a10.6 10.6 0 0 0 5.06 1.29h.01c5.87 0 10.64-4.77 10.64-10.64 0-2.84-1.11-5.51-3.12-7.52a10.57 10.57 0 0 0-7.53-3.12Zm0 19.49h-.01c-1.62 0-3.21-.44-4.6-1.28l-.33-.19-3.37.88.9-3.29-.21-.34a8.8 8.8 0 0 1-1.35-4.7c0-4.86 3.96-8.82 8.82-8.82 2.36 0 4.58.92 6.25 2.59a8.78 8.78 0 0 1 2.59 6.25c0 4.86-3.96 8.82-8.69 8.9Z" />
                                </svg>
                                Share this program
                              </a>
                            ) : null}
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

  const lookupProgramByIdFirst = looksLikeUuid(programSlug);

  const { data: programBySlugRows, error: programBySlugError } = await supabase
    .from("programs")
    .select("id, name, slug")
    .eq("slug", programSlug)
    .order("id", { ascending: true })
    .limit(1);

  const { data: programByIdRows, error: programByIdError } = lookupProgramByIdFirst
    ? await supabase
        .from("programs")
        .select("id, name, slug")
        .eq("id", programSlug)
        .order("id", { ascending: true })
        .limit(1)
    : { data: null, error: null };

  if (programBySlugError || programByIdError) {
    console.error(
      "Failed to load program:",
      programBySlugError ?? programByIdError
    );
    notFound();
  }

  const programBySlug = (programBySlugRows?.[0] ?? null) as Program | null;
  const programById = (programByIdRows?.[0] ?? null) as Program | null;
  const program = (programBySlug ?? programById) as Program | null;
  if (!program) notFound();

  if (lookupProgramByIdFirst && program.slug && programSlug !== program.slug) {
    redirect(
      `/programs/${encodeURIComponent(program.slug)}/centers/${encodeURIComponent(citySlug)}`
    );
  }

  const { data: children, error: childrenError } = await supabase
    .from("programs")
    .select("id")
    .eq("parent_id", program.id);

  if (childrenError) {
    console.error("Failed to load child programs:", childrenError);
    throw new Error(childrenError.message);
  }

  const childIds = (children ?? []).map((child) => child.id);
  const programIds = Array.from(new Set([program.id, ...childIds]));

  const shouldSkipSessionsQuery =
    Boolean(dateParamErrorMessage) ||
    (Boolean(venueParam) && !venueLookupErrorMessage && !venueWasFound);

  const { data: sessionRows, error: sessionsError } = shouldSkipSessionsQuery
    ? { data: [], error: null }
    : await (() => {
        let query = supabase
          .from("sessions")
          .select(
            `
              id,
              start_date,
              end_date,
              start_time,
              end_time,
              language,
              registrations_allowed,
              registration_link,
              open_without_registration,
              programs(name, slug, image_url, updated_at, colour, sub_text),
              venues(name, slug, google_maps_url, cities(name, slug)),
              contacts(phone, whatsapp)
            `
          )
          .in("program_id", programIds)
          .eq("is_published", true)
          .order("start_date", { ascending: true });

        if (venueId) query = query.eq("venue_id", venueId);
        if (startDateParam) {
          query = query.eq("start_date", startDateParam);
        } else {
          query = query.gte("start_date", today);
        }

        return query;
      })();

  const sessionsErrorMessage =
    dateParamErrorMessage ??
    venueLookupErrorMessage ??
    sessionsError?.message ??
    null;

  const targetCitySlug = normalizeSlug(citySlug);

  const allSessions = ((sessionRows ?? []) as Session[]).filter(Boolean);
  const citySessions = allSessions.filter((session) => {
    const city = getCityFromSession(session);
    if (!city) return false;
    const dbSlug = city.dbSlug ? normalizeSlug(city.dbSlug) : null;
    const derivedSlug = city.derivedSlug ? normalizeSlug(city.derivedSlug) : null;
    return dbSlug === targetCitySlug || derivedSlug === targetCitySlug;
  });

  const cityDisplayName = (citySessions.length > 0
    ? getCityFromSession(citySessions[0])?.name
    : null) ?? citySlug;

  const title = `${program.name} in ${cityDisplayName}`;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F4EE]">
      <main className="flex-1">
        <header className="bg-indigo-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <Link
              href={`/programs/${encodeURIComponent(program.slug)}`}
              className="mx-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to {program.name} program
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
          ) : citySessions.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                No upcoming published sessions found for this city yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {citySessions.map((session) => {
                const programInfo = getProgramFromSession(session);
                const venueInfo = getVenueFromSession(session);
                const contactInfo = getContactFromSession(session);

                const mapsHref = toSafeHttpUrl(venueInfo?.google_maps_url);
                const registrationsAllowed = Boolean(session.registrations_allowed);
                const openWithoutRegistration = Boolean(
                  session.open_without_registration
                );
                const registrationHref = toSafeHttpUrl(session.registration_link);
                const phoneHref = toTelHref(contactInfo?.phone);
                const timeRange = formatSessionTimeRange(session);
                const shareProgramSlug = program.slug;
                const shareVenueSlug = venueInfo?.slug?.trim() || null;
                const shareDate = session.start_date;
                const shareToken =
                  shareProgramSlug && shareVenueSlug && shareDate
                    ? `${shareProgramSlug}-${normalizeSlug(citySlug)}-${shareVenueSlug}-${shareDate}`
                    : null;
                const shareUrl = shareToken
                  ? `${origin ?? ""}/share-program/${encodeURIComponent(shareToken)}`
                  : null;
                const whatsAppShareHref = shareUrl
                  ? `https://wa.me/?text=${encodeURIComponent(
                      `See upcoming session details: ${shareUrl}`
                    )}`
                  : null;

                return (
                  <article
                    key={String(session.id)}
                    className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      {programInfo?.image_url ? (
                        <Image
                          src={`${programInfo.image_url}${
                            programInfo.image_url.includes("?") ? "&" : "?"
                          }v=${encodeURIComponent(programInfo.updated_at ?? "")}`}
                          alt={programInfo?.name ?? "Program image"}
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
                          {programInfo?.name ?? program.name}
                        </h3>
                        {programInfo?.sub_text ? (
                          <p className="mt-0 text-sm text-slate-600 line-clamp-2">
                            {programInfo.sub_text}
                          </p>
                        ) : null}
                      </div>

                      {registrationsAllowed || openWithoutRegistration ? (
                        <div className="mt-3 flex flex-wrap gap-2">
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
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Venue</dt>
                          <dd className="font-medium text-slate-700">
                              <span className="flex flex-wrap items-center gap-2">
                                <span>{venueInfo?.name ?? "—"}</span>
                                {mapsHref ? (
                                  <a
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
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
                                    Google maps
                                  </a>
                                ) : null}
                              </span>
                            </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Date</dt>
                          <dd className="font-medium text-slate-700">
                            {formatSessionDates(session)}
                          </dd>
                        </div>
                        {timeRange ? (
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">Time</dt>
                            <dd className="font-medium text-slate-700">{timeRange}</dd>
                          </div>
                        ) : null}
                        {session.language ? (
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">
                              Language
                            </dt>
                            <dd className="font-medium text-slate-700">
                              {session.language}
                            </dd>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">Phone</dt>
                          <dd className="font-medium text-slate-700">
                            {phoneHref ? (
                              <a href={phoneHref} className="hover:underline">
                                {contactInfo?.phone}
                              </a>
                            ) : (
                              (contactInfo?.phone ?? "—")
                            )}
                          </dd>
                        </div>
                      </dl>

                      {registrationsAllowed || whatsAppShareHref ? (
                        <div className="mt-6">
                          {registrationsAllowed ? (
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
                          ) : null}
                          {whatsAppShareHref ? (
                            <a
                              href={whatsAppShareHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${registrationsAllowed ? "mt-3 " : ""}inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-green-600 bg-white px-6 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:ring-offset-2`}
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 32 32"
                                className="h-5 w-5"
                                fill="currentColor"
                              >
                                <path d="M19.11 17.61c-.23-.12-1.34-.66-1.55-.74-.21-.08-.36-.12-.51.12-.15.23-.59.74-.72.89-.13.15-.27.17-.5.06-.23-.12-.98-.36-1.86-1.16-.69-.61-1.15-1.36-1.28-1.59-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.11-.13.15-.23.23-.38.08-.15.04-.29-.02-.4-.06-.12-.51-1.23-.7-1.68-.18-.43-.37-.37-.51-.38h-.44c-.15 0-.4.06-.61.29-.21.23-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.61 2.46 3.89 3.45.54.23.96.37 1.29.47.54.17 1.03.15 1.42.09.43-.06 1.34-.55 1.53-1.08.19-.53.19-.98.13-1.08-.06-.1-.21-.15-.44-.27ZM16.02 5.33c-5.87 0-10.64 4.77-10.64 10.64 0 1.87.49 3.7 1.43 5.31l-1.52 5.54 5.67-1.49a10.6 10.6 0 0 0 5.06 1.29h.01c5.87 0 10.64-4.77 10.64-10.64 0-2.84-1.11-5.51-3.12-7.52a10.57 10.57 0 0 0-7.53-3.12Zm0 19.49h-.01c-1.62 0-3.21-.44-4.6-1.28l-.33-.19-3.37.88.9-3.29-.21-.34a8.8 8.8 0 0 1-1.35-4.7c0-4.86 3.96-8.82 8.82-8.82 2.36 0 4.58.92 6.25 2.59a8.78 8.78 0 0 1 2.59 6.25c0 4.86-3.96 8.82-8.69 8.9Z" />
                              </svg>
                              Share this program
                            </a>
                          ) : null}
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

