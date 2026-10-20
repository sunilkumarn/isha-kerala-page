import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProgramsCityWise } from "./center-programs"; // Fixed function name
import PublicFooter from "@/components/public/PublicFooter";
import NeedAssistanceSection from "@/components/public/NeedAssistanceSection";
import CenterProgramsTable from "./CenterProgramsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Programs by City | Isha Kerala",
};

export default async function ProgramsCityWisePage() {
  const supabase = await createSupabaseServerClient();

  let citiesData: any[] = [];
  let errorMessage: string | null = null;

  try {
    citiesData = await getProgramsCityWise(supabase);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F6F2] text-slate-900">
      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="bg-[#1F2A63] bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/sadhguru.jpg')" }}
        >
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h3 className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              Welcome to Isha Kerala
            </h3>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
            <br />
            <h1 className="text-3xl tracking-tight text-white sm:text-5xl font-semibold">
              Upcoming Programs by City
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 sm:text-base">
              Explore upcoming programs grouped by city across Kerala.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
              Failed to load programs: {errorMessage}
            </div>
          ) : citiesData.length === 0 ? (
            <div className="rounded-3xl border border-black/5 bg-white p-12 text-center shadow-sm">
              <h2 className="text-xl font-medium text-slate-800">No upcoming programs found</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                There are currently no published programs with start dates after today. Please check back later.
              </p>
            </div>
          ) : (
            <CenterProgramsTable citiesData={citiesData} /> // Fixed prop name from centersData to citiesData
          )}
        </section>

        {/* Assistance Section */}
        <NeedAssistanceSection />
      </main>

      <PublicFooter />
    </div>
  );
}