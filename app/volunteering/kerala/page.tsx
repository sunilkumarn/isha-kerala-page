import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";
import VolunteeringInterestForm from "@/components/public/VolunteeringInterestForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Expression of Volunteering Interest - Kerala | Isha Kerala",
  description:
    "Express your interest in volunteering for Isha programs and activities across Kerala.",
};

type CityOption = {
  id: string | number;
  name: string;
};

export default async function KeralaVolunteeringPage() {
  const supabase = await createSupabaseServerClient();

  const { data: citiesData } = await supabase
    .from("cities")
    .select("id, name")
    .order("name", { ascending: true });

  const centers: CityOption[] = (citiesData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Fetch public image URL from Supabase Storage
  const { data: bannerImageData } = supabase.storage
    .from("General")
    .getPublicUrl("/vol2.jpeg");

  const bannerImageUrl = bannerImageData?.publicUrl || "/sadhguru.jpg";

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF4E8] text-[#2C251D]">
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="bg-[#1F2A63] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/sadhguru.jpg')" }}
        >
          <div className="mx-auto max-w-5xl px-6 py-12 text-center sm:py-16">
            <p className="mx-auto max-w-xl text-sm text-white/85 sm:text-base">
              Isha Kerala
            </p>
            <div className="mx-auto mt-2.5 h-0.5 w-12 rounded-full bg-[#F28C18]" />

            <h1 className="mt-3.5 text-xl font-medium tracking-normal text-white sm:text-3xl">
              Expression of Volunteering Interest - Kerala
            </h1>

            <p className="mx-auto mt-2.5 max-w-2xl text-xs italic font-medium leading-relaxed text-white/90 sm:text-sm">
              Express your interest in volunteering for Isha programs and
              activities across Kerala.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
          {/* Supabase Storage Image */}
          <div className="overflow-hidden rounded-2xl border border-[#2C251D]/10 bg-[#FAF8F4] shadow-md">
            <img
              src={bannerImageUrl}
              alt="Volunteering with Isha Kerala"
              className="h-auto w-full object-contain"
            />
          </div>

          {/* Submission Form */}
          <div className="mt-10">
            <VolunteeringInterestForm centers={centers} />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
