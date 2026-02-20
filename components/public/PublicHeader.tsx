import Image from "next/image";
import Link from "next/link";

const navLinkBase =
  "text-xs font-semibold tracking-[0.22em] text-slate-700 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/40 focus:ring-offset-2";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/programs"
          className="inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/40 focus:ring-offset-2"
          aria-label="Isha Kerala home"
        >
          <Image
            src="/isha-logo.svg"
            alt="Isha Kerala"
            width={30}
            height={30}
            priority
          />
          <span className="text-base font-semibold text-slate-900">
            Isha Kerala home
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-7">
          <Link href="/programs" className={navLinkBase}>
            PROGRAMS
          </Link>
          <Link href="/centers" className={navLinkBase}>
            CENTERS
          </Link>
        </nav>
      </div>
    </header>
  );
}

