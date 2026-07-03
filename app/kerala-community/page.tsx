import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

type JoinedCommunityRow = {
  city_id: string;
  group_name: string;
  whatsapp_url: string;
  cities: {
    name: string;
  };
};

export default async function KeralaCommunityPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Fetch data exclusively where WhatsApp links are present
  const { data, error } = await supabase
    .from("city_whatsapp_links")
    .select(`
      city_id,
      group_name,
      whatsapp_url,
      cities!inner(
        name
      )
    `);

  const errorMessage = error?.message ?? null;
  const communityRows = (data ?? []) as unknown as JoinedCommunityRow[];

  // 2. Sort alphabetically by city name
  const sortedCommunityRows = [...communityRows].sort((a, b) => 
    a.cities.name.localeCompare(b.cities.name)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      {/* Decorative Top Gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-[#F28C18] to-indigo-900" />

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
        
        <header className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        
        <h1 className="text-2xl md:text-3xl font-bold text-indigo-950 tracking-tight leading-tight">
        Isha Kerala Meditators Community
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/10 mb-3 tracking-wide uppercase">
        For those iniitated into Shambhavi Mahamudra Kriya
        </span>
        <p className="mt-3 text-sm md:text-base text-slate-600 font-light leading-relaxed">
        Connect with local seekers, receive official program updates, and support local sathsangs by joining your city's active circle.
        </p>
        </header>

        {/* Dynamic Display Logic */}
        {errorMessage ? (
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 text-sm text-red-700 backdrop-blur-sm max-w-md mx-auto text-center shadow-sm">
            <span className="font-semibold block mb-1">Unable to load connections</span>
            {errorMessage}
          </div>
        ) : sortedCommunityRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-md mx-auto shadow-sm">
            <p className="text-sm font-medium text-slate-500">No active local groups found at this time.</p>
          </div>
        ) : (
          /* Responsive Cards Grid Layout */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCommunityRows.map((item) => (
              <div 
                key={item.city_id} 
                className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.07)] hover:border-amber-100"
              >
                {/* Visual Accent Element inside card */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-amber-500/10 pointer-events-none">
                  <svg className="h-16 w-16 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>

                <div className="mb-6">
                  {/* City Title wrapped cleanly with break management */}
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight whitespace-normal break-words line-clamp-2 leading-tight pr-8">
                    {item.cities.name}
                  </h2>
                  <p className="text-xs font-semibold text-amber-700 mt-2 bg-amber-50 inline-block px-2.5 py-0.5 rounded-md">
                    {item.group_name}
                  </p>
                </div>

                {/* Glassmorphic-styled Action Button */}
                <div className="mt-auto pt-4 border-t border-slate-50">
                  <a
                    href={item.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-green-500/10 transition-all duration-200 hover:bg-[#1ebe57] hover:shadow-lg hover:shadow-green-500/20 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
                  >
                    {/* SVG WhatsApp Vector Icon */}
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.93 0c3.167.001 6.145 1.233 8.384 3.474 2.239 2.24 3.469 5.221 3.467 8.391-.004 6.582-5.342 11.93-11.878 11.93-2.001-.001-3.971-.51-5.715-1.48L0 24zm6.59-4.846c1.655.982 3.511 1.5 5.409 1.5 5.426 0 9.843-4.417 9.846-9.843.002-2.63-1.023-5.101-2.884-6.964C17.159 1.982 14.69 .957 12.06 1.054c-5.425 0-9.842 4.417-9.845 9.844-.001 1.97.513 3.894 1.49 5.602l-.995 3.635 3.737-.981z"/>
                    </svg>
                    Connect via WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}