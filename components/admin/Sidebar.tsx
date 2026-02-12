"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const isSessionsActive = pathname.startsWith("/admin/sessions");
  const isCitiesActive = pathname.startsWith("/admin/cities");
  const isProgramsActive = pathname.startsWith("/admin/programs");
  const isVenuesActive = pathname.startsWith("/admin/venues");
  const isContactsActive = pathname.startsWith("/admin/contacts");

  const linkBase =
    "flex items-center gap-3 rounded-lg px-4 py-3 text-[16px] font-medium transition-colors";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } catch {
      // Best-effort logout; still clear cookie + redirect.
    }

    // Clear the cookie used by middleware.ts for /admin protection.
    document.cookie = "sb-access-token=; Path=/; Max-Age=0; SameSite=Lax";

    setLoggingOut(false);
    router.push("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-[#E2DED3] bg-[#EAE6DC] px-6 py-8">
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

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`${linkBase} w-full text-[#8C7A5B] hover:bg-white/70 hover:text-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B5E4A]/60" />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}

