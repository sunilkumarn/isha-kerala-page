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
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold leading-snug tracking-normal text-[#3A3228] sm:text-4xl">
            Expression of Volunteering Interest - Kerala
          </h1>

          {/* Decorative Divider */}
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
        </div>

        {/* Supabase Storage Image */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#2C251D]/10 bg-[#FAF8F4] shadow-md">
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
      </main>

      <PublicFooter />
    </div>
  );
}
