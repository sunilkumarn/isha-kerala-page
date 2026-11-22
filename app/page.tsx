import Link from "next/link";
import PublicFooter from "@/components/public/PublicFooter";
import NeedAssistanceSection from "@/components/public/NeedAssistanceSection";

export const metadata = {
  title: "Isha Kerala | Programs, Volunteering & Centers",
  description:
    "Explore volunteering opportunities, upcoming Isha programs, and local centers across Kerala.",
};

const LANDING_BLOCKS = [
  {
    title: "Volunteering Opportunity",
    description:
      "Become an active part of bringing inner wellbeing to Kerala. Express your interest to support upcoming programs and local center activities.",
    ctaLabel: "Express Interest",
    href: "/volunteering/kerala",
    accentBg: "bg-[#F28C18]/15 text-[#F28C18]",
    buttonClass:
      "bg-[#F28C18] text-white hover:brightness-95 focus:ring-[#F28C18]/50",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6"
      >
        <path
          d="M12 21c-4.5-3.2-8-6.4-8-10.4A4.6 4.6 0 0 1 8.6 6c1.5 0 2.7.7 3.4 1.8A4.1 4.1 0 0 1 15.4 6 4.6 4.6 0 0 1 20 10.6c0 4-3.5 7.2-8 10.4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Upcoming Programs",
    description:
      "Discover Inner Engineering, Hatha Yoga, and other upcoming Isha programs scheduled across cities and centers in Kerala.",
    ctaLabel: "View Programs",
    href: "/programs",
    accentBg: "bg-[#1F2A63]/10 text-[#1F2A63]",
    buttonClass:
      "bg-[#1F2A63] text-white hover:brightness-110 focus:ring-[#1F2A63]/40",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="17"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 2.5v3M16 2.5v3M3 9.5h18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Connect with Your Center",
    description:
      "Find your nearest local Isha center in Kerala, view center details, and stay connected with activities happening close to you.",
    ctaLabel: "Explore Centers",
    href: "/centers",
    accentBg: "bg-emerald-500/15 text-emerald-700",
    buttonClass:
      "border border-[#1F2A63]/20 bg-[#F7F6F2] text-[#1F2A63] hover:bg-[#1F2A63]/5 focus:ring-[#1F2A63]/30",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6"
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
    ),
  },
];

export default function HomeLandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#F7F6F2] text-slate-900">
      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="bg-[#1F2A63] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/sadhguru.jpg')" }}
        >
          <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
            <p className="mx-auto max-w-2xl text-lg text-white/85">
              Welcome to Isha Kerala
            </p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
            <h1 className="mt-6 text-3xl tracking-tight text-white sm:text-5xl">
              Explore, Participate &amp; Connect
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Step into volunteering, join an upcoming program, or connect with
              an Isha center near you across Kerala.
            </p>
          </div>
        </section>

        {/* Three Major Blocks */}
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {LANDING_BLOCKS.map((block) => (
              <div
                key={block.title}
                className="flex flex-col justify-between rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${block.accentBg}`}
                  >
                    {block.icon}
                  </div>

                  <h2 className="mt-6 text-2xl tracking-tight text-slate-900">
                    {block.title}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {block.description}
                  </p>
                </div>

                <div className="mt-8">
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