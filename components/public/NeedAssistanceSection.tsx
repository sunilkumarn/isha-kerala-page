import Link from "next/link";

export default function NeedAssistanceSection({
  href = "/contact",
}: {
  href?: string;
}) {
  return (
    <section className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-20">
        <h2 className="font-serif text-3xl tracking-tight text-[#1F2A63] sm:text-4xl">
          Need Assistance?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
          Our volunteers are here to guide you in choosing the right program and
          location for your journey.
        </p>

        <div className="mt-8">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-full bg-[#F28C18] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
          >
            Connect with a Volunteer
          </Link>
        </div>
      </div>
    </section>
  );
}


