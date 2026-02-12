import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPublicProgramsFromPublishedSessions } from "@/lib/public-programs";
import PublicFooter from "@/components/public/PublicFooter";
import NeedAssistanceSection from "@/components/public/NeedAssistanceSection";
import ProgramsGridWithPagination from "@/components/public/ProgramsGridWithPagination";

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
    <div className="flex min-h-screen flex-col bg-[#F7F6F2]  text-slate-900">
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

        <NeedAssistanceSection />
      </main>

      <PublicFooter />
    </div>
  );
}


