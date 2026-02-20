import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPublicProgramsFromPublishedSessions } from "@/lib/public-programs";
import PublicFooter from "@/components/public/PublicFooter";
import NeedAssistanceSection from "@/components/public/NeedAssistanceSection";
import ProgramsGridWithPagination from "@/components/public/ProgramsGridWithPagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  slug: string;
  image_url?: string | null;
  updated_at?: string | null;
  sub_text?: string | null;
  details_external?: boolean | null;
  external_link?: string | null;
};

export const metadata = {
  title: "Upcoming Programs | Isha Kerala",
};

export default async function ProgramsPage() {
  const supabase = createSupabaseServerClient();

  const PAGE_SIZE = 6;

  let programs: Program[] = [];
  let hasMore = false;
  let errorMessage: string | null = null;

  try {
    const result = await getPublicProgramsFromPublishedSessions(supabase, {
      offset: 0,
      limit: PAGE_SIZE,
    });
    programs = result.programs as Program[];
    hasMore = result.hasMore;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F6F2]  text-slate-900">
      <main className="flex-1">
        <section className="bg-[#1F2A63] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/sadhguru.jpg')" }}>
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h3 className="mx-auto mt-6 max-w-2xl text-lg text-white/80 ">
              Welcome to Isha kerala
            </h3>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
            <br></br>
            <h3 className="text-2xl tracking-tight text-white sm:text-5xl">
              Upcoming Programs
            </h3>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
              Failed to load programs: {errorMessage}
            </div>
          ) : programs.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-10 text-center">
              <h2 className="text-xl font-medium">No programs yet</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                Please check back later. We’ll publish new programs here as soon as
                they’re available.
              </p>
            </div>
          ) : (
            <ProgramsGridWithPagination
              initialPrograms={programs}
              initialHasMore={hasMore}
              pageSize={PAGE_SIZE}
            />
          )}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
          <div className="rounded-3xl border border-black/5 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">
            <div className="mx-auto bg-green-500 flex h-14 w-14 items-center justify-center rounded-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="h-6 w-6 text-[#FFF]"
              >
                <path
                  d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 13.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </div>

            <h2 className="mt-7 text-3xl tracking-tight text-slate-900 sm:text-4xl">
              Looking for a Center Near You?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
              Explore all our centers across Kerala and find programs happening close
              to you.
            </p>

            <div className="mt-8">
              <Link
                href="/centers"
                className="inline-flex items-center justify-center rounded-full bg-[#F28C18] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
              >
                View All Centers
              </Link>
            </div>
          </div>
        </section>

        <NeedAssistanceSection />
      </main>

      <PublicFooter />
    </div>
  );
}


