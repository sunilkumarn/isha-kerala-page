import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

type Venue = {
  id: string | number;
  name: string;
  address: string | null;
  google_maps_url: string | null;
  city_id: string | number | null;
  cities?: { name: string } | null;
};

function getTodayLocalISODate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function ProgramVenuesPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const supabase = createSupabaseServerClient();
  const { programId } = await params;
  const today = getTodayLocalISODate();

  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id, name")
    .eq("id", programId)
    .maybeSingle();

  if (programError) {
    console.error("Failed to load program:", programError);
    notFound();
  }

  if (!program) notFound();

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
        .select("*, cities(name)")
        .in("id", venueIds)
        .order("name");

      if (venuesError) {
        console.error("Failed to load venues:", venuesError);
        throw new Error(venuesError.message);
      }

      venues = (venueRows ?? []) as Venue[];
    }
  }

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
              {program.name} Programs
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
              Select your city to explore upcoming sessions
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-12">
          {venues.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                No upcoming published sessions found for this program yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <div
                  key={String(venue.id)}
                  className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm"
                >
                  <h2 className="text-xl font-semibold text-indigo-950">
                    {venue.cities?.name}
                  </h2>
                  <div className="mt-5">
                    <Link
                      href={`/programs/${encodeURIComponent(
                        programId
                      )}/venues/${encodeURIComponent(String(venue.id))}`}
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


