import { createSupabaseServerClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/slugify";
import PublicFooter from "@/components/public/PublicFooter";
import CitiesSearchGrid from "@/app/centers/CitiesSearchGrid";

export const dynamic = "force-dynamic";

type City = {
  id: string | number;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  updated_at?: string | null;
};

export default async function CentersCitiesPage() {
  const supabase = createSupabaseServerClient();

  const { data: cityRows, error } = await supabase
    .from("cities")
    .select("id, name, slug, image_url, updated_at")
    .order("name");

  const errorMessage = error?.message ?? null;
  const cities = ((cityRows ?? []) as City[]).filter(Boolean);

  const cityCards = cities.map((city) => {
    const cityName = city.name?.trim() || "Other";
    const dbSlug = city.slug?.trim() || "";
    const slug = dbSlug || slugify(cityName);
    return {
      cityKey: `city:${String(city.id)}`,
      cityName,
      slug,
      imageUrl: city.image_url ?? null,
      updatedAt: city.updated_at ?? null,
    };
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F4EE]">
      <main className="flex-1">
        <header className="bg-indigo-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 text-center">
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
              All Centers
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
              Select your city to explore upcoming sessions
            </p>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-12">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
              Failed to load cities: {errorMessage}
            </div>
          ) : cityCards.length === 0 ? (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-gray-600">No cities found yet.</p>
            </div>
          ) : (
            <CitiesSearchGrid cityCards={cityCards} />
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

