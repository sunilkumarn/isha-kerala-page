"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const isSessionsActive = pathname.startsWith("/admin/sessions");
  const isCitiesActive = pathname.startsWith("/admin/cities");
  const isProgramsActive = pathname.startsWith("/admin/programs");
  const isVenuesActive = pathname.startsWith("/admin/venues");
  const isContactsActive = pathname.startsWith("/admin/contacts");

  const linkBase =
    "flex items-center gap-3 rounded-lg px-4 py-3 text-[16px] font-medium transition-colors";

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-[#E2DED3] bg-[#EAE6DC] px-6 py-8">
      <div className="mb-10">
        <p className="text-lg font-medium tracking-wide text-[#2B2B2B]">
          Isha Kerala Admin
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8C7A5B]">
          Internal Dashboard
        </p>
      </div>

      <nav className="space-y-2">
        <Link
          href="/admin/sessions"
          className={`${linkBase} ${
            isSessionsActive
              ? "bg-white text-[#2B2B2B]"
              : "text-[#8C7A5B] hover:bg-white/70 hover:text-[#2B2B2B]"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B5E4A]/60" />
          Sessions
        </Link>
        <Link
          href="/admin/programs"
          className={`${linkBase} ${
            isProgramsActive
              ? "bg-white text-[#2B2B2B]"
              : "text-[#8C7A5B] hover:bg-white/70 hover:text-[#2B2B2B]"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B5E4A]/60" />
          Programs
        </Link>
        <Link
          href="/admin/cities"
          className={`${linkBase} ${
            isCitiesActive
              ? "bg-white text-[#2B2B2B]"
              : "text-[#8C7A5B] hover:bg-white/70 hover:text-[#2B2B2B]"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B5E4A]/60" />
          Cities
        </Link>
        <Link
          href="/admin/venues"
          className={`${linkBase} ${
            isVenuesActive
              ? "bg-white text-[#2B2B2B]"
              : "text-[#8C7A5B] hover:bg-white/70 hover:text-[#2B2B2B]"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B5E4A]/60" />
          Venues
        </Link>
        <Link
          href="/admin/contacts"
          className={`${linkBase} ${
            isContactsActive
              ? "bg-white text-[#2B2B2B]"
              : "text-[#8C7A5B] hover:bg-white/70 hover:text-[#2B2B2B]"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B5E4A]/60" />
          Contacts
        </Link>
      </nav>
    </aside>
  );
}

