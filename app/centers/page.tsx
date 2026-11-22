import { createSupabaseServerClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/slugify";
import PublicFooter from "@/components/public/PublicFooter";
import CitiesSearchGrid from "@/app/centers/CitiesSearchGrid";

export const dynamic = "force-dynamic";

type CityRow = {
  id: string | number;
  name: string;
  image_url: string | null;
  slug: string | null;
};

type ContactRow = {
  city_id: string | number | null;
  phone: string | null;
  email: string | null;
  is_center_specific: boolean;
};

export default async function CentersCitiesPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Fetching tables independently with parallel requests for safety and speed
  const [citiesResponse, contactsResponse] = await Promise.all([
    supabase.from("cities").select("id, name, image_url, slug").order("name"),
    supabase.from("contacts").select("city_id, phone, email, is_center_specific"),
  ]);

  const errorMessage =
    citiesResponse.error?.message ?? contactsResponse.error?.message ?? null;

  const cityRows = (citiesResponse.data ?? []) as CityRow[];
  const contactRows = (contactsResponse.data ?? []) as ContactRow[];

  // 2. Map contacts by their city_id ONLY when marked center-specific
  const centerContactMap = new Map<
    string | number,
    { phone: string | null; email: string | null }
  >();

  contactRows.forEach((contact) => {
    if (contact.city_id) {
      // STRICT GATEKEEPER: Only map the row if it's explicitly center specific.
      // This ensures rows marked false are completely passed over and discarded.
      if (contact.is_center_specific === true) {
        if (!centerContactMap.has(contact.city_id)) {
          centerContactMap.set(contact.city_id, {
            phone: contact.phone ? contact.phone.trim() : null,
            email: contact.email ? contact.email.trim() : null,
          });
        }
      }
    }
  });

  // 3. Construct your city cards and attach the isolated center contact details
  const cityCards = cityRows.map((city) => {
    const cityName = city.name?.trim() || "Other";
    const dbSlug = city.slug?.trim() || "";
    const slug = dbSlug || slugify(cityName);

    // Attempt to pull a true-flagged center contact from our lookup map
    const matchedCenterContact = centerContactMap.get(city.id);

    return {
      cityKey: `city:${String(city.id)}`,
      cityName,
      slug,
      imageUrl: city.image_url ?? null,
      updatedAt: null,
      // If a matched center-specific contact exists, render it. Otherwise, pass null so the card remains blank!
      contact: matchedCenterContact ? matchedCenterContact.phone : null,
      email: matchedCenterContact ? matchedCenterContact.email : null,
    };
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F4EE]">
      <main className="flex-1">
        <header
          className="bg-[#1F2A63] bg-cover bg-center bg-no-repeat text-white"
          style={{ backgroundImage: "url('/sadhguru.jpg')" }}
        >
          <div className="mx-auto max-w-5xl px-6 py-12 text-center sm:py-16">
            <p className="mx-auto max-w-xl text-sm text-white/85 sm:text-base">
              Welcome to Isha Kerala
            </p>
            <div className="mx-auto mt-2.5 h-0.5 w-12 rounded-full bg-[#F28C18]" />
            <h1 className="mt-3.5 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              All Centers
            </h1>
            <p className="mx-auto mt-2.5 max-w-xl text-sm text-white/85 sm:text-base">
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