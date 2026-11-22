import Link from "next/link";
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

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF4E8] text-[#2C251D]">
      <header className="border-b border-[#2C251D]/10 bg-[#F3ECE0]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-serif text-2xl font-bold italic tracking-tight text-[#2C251D]"
          >
            isha
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C5346] transition hover:text-[#2C251D]"
          >
            <span aria-hidden="true">&larr;</span> Back to Programs
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold leading-snug tracking-tight text-[#3A3228] sm:text-4xl">
            Expression of Volunteering Interest - Kerala
          </h1>

          <div className="mx-auto mt-5 flex justify-center">
            <svg
              viewBox="0 0 260 44"
              fill="none"
              aria-hidden="true"
              className="h-9 w-56 text-[#2B3A8C]"
            >
              <path
                d="M12 24 C32 24, 42 6, 50 24 C58 42, 68 8, 82 22 C96 34, 108 12, 124 22 C140 32, 154 14, 172 22 C190 28, 212 22, 248 23"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M18 23 L244 23"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#2C251D]/10 bg-[#1B3B6F] shadow-md">
          <img
            src="/sadhguru.jpg"
            alt="Volunteering with Isha Kerala"
            className="h-56 w-full object-cover object-center sm:h-64"
          />
        </div>

        <blockquote className="mx-auto mt-8 max-w-xl text-center">
          <p className="text-base font-semibold leading-relaxed text-[#3A3228] sm:text-lg">
            &ldquo;Volunteering means to become willing, or in other words, to
            become an absolute YES to life.&rdquo; - Sadhguru
          </p>
        </blockquote>

        <div className="mt-10">
          <VolunteeringInterestForm centers={centers} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}