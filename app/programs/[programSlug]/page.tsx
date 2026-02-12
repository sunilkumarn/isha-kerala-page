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

type Venue = {
  id: string | number;
  name: string;
  slug: string;
  address: string | null;
  google_maps_url: string | null;
  city_id: string | number | null;
  cities?: { name: string; image_url?: string | null } | null;
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

export default async function ProgramVenuesPage({
  params,
}: {
  params: Promise<{ programSlug: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { programSlug } = await params;
  const today = getTodayLocalISODate();

  const lookupByIdFirst = looksLikeUuid(programSlug);

  const { data: programBySlugRows, error: programBySlugError } = await supabase
    .from("programs")
    .select("id, name, slug")
    .eq("slug", programSlug)
    .order("id", { ascending: true })
    .limit(1);

  if (programBySlugError) {
    console.error("Failed to load program by slug:", programBySlugError);
    notFound();
  }

  const { data: programByIdRows, error: programByIdError } = lookupByIdFirst
    ? await supabase
        .from("programs")
        .select("id, name, slug")
        .eq("id", programSlug)
        .order("id", { ascending: true })
        .limit(1)
    : { data: null, error: null };

  if (programByIdError) {
    console.error("Failed to load program by id:", programByIdError);
    notFound();
  }

  const programBySlug = (programBySlugRows?.[0] ?? null) as Program | null;
  const programById = (programByIdRows?.[0] ?? null) as Program | null;
  const program = (programBySlug ?? programById) as Program | null;
  if (!program) notFound();

  // Backwards compatibility: old URLs used /programs/:programId
  // If we were hit with an ID, redirect to the canonical slug URL.
  if (lookupByIdFirst && program.slug && programSlug !== program.slug) {
    redirect(`/programs/${encodeURIComponent(program.slug)}`);
  }

  const programId = (program as Program).id;

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

  let venues: Venue[] = [];

  if (programIds.length > 0) {
    const { data: sessionVenueRows, error: sessionsError } = await supabase
      .from("sessions")
      .select("venue_id")
      .in("program_id", programIds)
      .eq("is_published", true)
      .gte("start_date", today)
      .not("venue_id", "is", null);

    if (sessionsError) {
      console.error("Failed to load sessions:", sessionsError);
      throw new Error(sessionsError.message);
    }

    const venueIds = Array.from(
      new Set((sessionVenueRows ?? []).map((row) => row.venue_id).filter(Boolean))
    ) as Array<string | number>;

    if (venueIds.length > 0) {
      const { data: venueRows, error: venuesError } = await supabase
        .from("venues")
        .select("*, cities(name, image_url)")
        .in("id", venueIds)
        .order("name");

      if (venuesError) {
        console.error("Failed to load venues:", venuesError);
        throw new Error(venuesError.message);
      }

      venues = (venueRows ?? []) as Venue[];
    }
  }

  const cityCards = (() => {
    type CityCard = {
      cityKey: string;
      cityName: string;
      imageUrl: string | null;
      venueSlug: string;
    };

    const map = new Map<string, CityCard>();

    for (const venue of venues) {
      const cityName = venue.cities?.name?.trim() || "Other";
      const imageUrl = venue.cities?.image_url ?? null;
      const cityKey = venue.city_id ? `city:${String(venue.city_id)}` : `name:${cityName}`;

      const preferredSlug = cityName ? slugify(cityName) : null;
      const isPreferred = preferredSlug ? venue.slug === preferredSlug : false;

      const existing = map.get(cityKey);
      if (!existing) {
        map.set(cityKey, {
          cityKey,
          cityName,
          imageUrl,
          venueSlug: venue.slug,
        });
        continue;
      }

      const existingIsPreferred = preferredSlug
        ? existing.venueSlug === preferredSlug
        : false;

      if (!existingIsPreferred && isPreferred) {
        map.set(cityKey, {
          cityKey,
          cityName,
          imageUrl: existing.imageUrl ?? imageUrl,
          venueSlug: venue.slug,
        });
      } else if (!existing.imageUrl && imageUrl) {
        map.set(cityKey, { ...existing, imageUrl });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.cityName.localeCompare(b.cityName)
    );
  })();

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F4EE]">
      <main className="flex-1">
        <header className="bg-indigo-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <Link
              href="/programs"
              className="mx-auto inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to All Programs
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
              {(program as Program).name} Programs
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
              Select your city to explore upcoming sessions
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-12">
          {cityCards.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                No upcoming published sessions found for this program yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cityCards.map((city) => (
                <div
                  key={city.cityKey}
                  className="overflow-hidden rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm"
                >
                  <div className="-mx-8 -mt-8 mb-6">
                    <div className="flex flex-col items-center justify-center gap-4 bg-slate-50 py-10">
                      <div className="text-3xl font-semibold text-slate-600">
                        {city.cityName.toUpperCase()}
                      </div>
                      <div className="h-20 w-28 overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
                        <img
                          src={"/city-image.jpeg"}
                          alt={`${city.cityName} thumbnail`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Link
                      href={`/programs/${encodeURIComponent(
                        (program as Program).slug
                      )}/venues/${encodeURIComponent(city.venueSlug)}`}
                      className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                    >
                      Upcoming Programs
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


