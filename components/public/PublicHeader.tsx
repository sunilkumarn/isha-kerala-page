"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Centers", href: "/centers" },
];

export default function PublicHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-full py-1.5 pr-3 text-slate-900 transition hover:text-[#1F2A63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C18]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[#F28C18] transition-transform duration-200 group-hover:scale-110" />
          <span className="text-base font-medium tracking-normal text-[#1F2A63] sm:text-lg">
            Isha Kerala
          </span>
        </Link>

        <nav aria-label="Primary Navigation" className="flex items-center gap-1.5 sm:gap-2">
          {NAV_LINKS.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium tracking-normal transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2A63]/40 ${
                  active
                    ? "bg-[#1F2A63] text-white shadow-2xs"
                    : "text-slate-700 hover:bg-[#FAF8F4] hover:text-[#1F2A63]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}