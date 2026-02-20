import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/slugify";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

type Program = {
  id: string | number;
  name: string;
  slug: string;
};

type ProgramJoin = {
  name: string;
  image_url: string | null;
  updated_at: string | null;
  colour: string | null;
  sub_text: string | null;
};

type CityJoin = { name: string; slug?: string | null };

type VenueJoin = {
  name: string;
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
}: {
  params: Promise<{ programSlug: string; citySlug: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { programSlug, citySlug } = await params;
  const today = getTodayLocalISODate();

  const isAllPrograms = normalizeSlug(programSlug) === "all-programs";

  if (isAllPrograms) {
    const { data: sessionRows, error: sessionsError } = await supabase
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
          programs(name, image_url, updated_at, colour, sub_text),
          venues(name, google_maps_url, cities(name, slug)),
          contacts(phone, whatsapp)
        `
      )
      .eq("is_published", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true });

    const sessionsErrorMessage = sessionsError?.message ?? null;
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
                href="/programs"
                className="mx-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
              >
                <span aria-hidden="true">←</span>
                Back to Programs
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
                                    className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900"
                                  >
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

  const { data: sessionRows, error: sessionsError } = await supabase
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
        programs(name, image_url, updated_at, colour, sub_text),
        venues(name, google_maps_url, cities(name, slug)),
        contacts(phone, whatsapp)
      `
    )
    .in("program_id", programIds)
    .eq("is_published", true)
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  const sessionsErrorMessage = sessionsError?.message ?? null;

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
              Back to Cities
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
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900"
                                >
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

