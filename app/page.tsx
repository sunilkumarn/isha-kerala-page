import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";
import NeedAssistanceSection from "@/components/public/NeedAssistanceSection";

export const metadata = {
  title: "Isha Kerala | Programs, Volunteering & Centers",
  description:
    "Explore upcoming programs, discover volunteering opportunities, and connect with an Isha center near you across Kerala.",
};

export default async function HomeLandingPage() {
  const supabase = await createSupabaseServerClient();

  const getGeneralImageUrl = (fileName: string) => {
    const { data } = supabase.storage.from("General").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const LANDING_BLOCKS = [
    {
      title: "Volunteering Opportunity",
      description:
        "Become an active part of bringing inner wellbeing to Kerala. Express your interest to support upcoming programs and local center activities.",
      ctaLabel: "Express Interest",
      href: "/volunteering/kerala",
      imageUrl: getGeneralImageUrl("vol.jpg"),
      imageAlt: "Volunteering Opportunity - Isha Kerala",
      buttonClass:
        "bg-[#F28C18] text-white hover:brightness-95 focus:ring-[#F28C18]/50",
    },
    {
      title: "Upcoming Programs",
      description:
        "Discover Inner Engineering, Hatha Yoga, and other upcoming Isha programs scheduled across cities and centers in Kerala.",
      ctaLabel: "View Programs",
      href: "/programs",
      imageUrl: getGeneralImageUrl("programs.jpeg"),
      imageAlt: "Upcoming Programs - Isha Kerala",
      buttonClass:
        "bg-[#1F2A63] text-white hover:brightness-110 focus:ring-[#1F2A63]/40",
    },
    {
      title: "Connect with Center",
      description:
        "Find your nearest local Isha center in Kerala, view center details, and stay connected with activities happening close to you.",
      ctaLabel: "Explore Centers",
      href: "/centers",
      imageUrl: getGeneralImageUrl("connect.jpeg"),
      imageAlt: "Connect with Center - Isha Kerala",
      buttonClass:
        "bg-[#F28C18] text-white hover:brightness-95 focus:ring-[#F28C18]/50",
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F6F2] text-slate-900">
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="bg-[#1F2A63] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/sadhguru.jpg')" }}
        >
          <div className="mx-auto max-w-5xl px-6 py-12 text-center sm:py-16">
            <p className="mx-auto max-w-xl text-sm text-white/85 sm:text-base">
              Welcome to Isha Kerala
            </p>
            <div className="mx-auto mt-2.5 h-0.5 w-12 rounded-full bg-[#F28C18]" />

            <h1 className="mt-3.5 text-xl font-medium tracking-normal text-white sm:text-3xl">
              Your journey with Isha can begin in many ways
            </h1>

            <p className="mx-auto mt-2.5 max-w-2xl text-xs italic font-medium leading-relaxed text-[#F28C18] sm:text-sm">
              Explore upcoming programs, discover volunteering opportunities, and
              connect with an Isha center near you across Kerala
            </p>
          </div>
        </section>

        {/* Three Major Blocks */}
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {LANDING_BLOCKS.map((block) => (
              <div
                key={block.title}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={block.imageUrl}
                      alt={block.imageAlt}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>

                  <div className="p-7 pb-0 text-center">
                    <h2 className="text-2xl font-medium tracking-normal text-slate-900">
                      {block.title}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {block.description}
                    </p>
                  </div>
                </div>

                <div className="p-7 pt-8">
                  <Link
                    href={block.href}
                    className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium shadow-xs transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${block.buttonClass}`}
                  >
                    {block.ctaLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <NeedAssistanceSection />
      </main>

      <PublicFooter />
    </div>
  );
}