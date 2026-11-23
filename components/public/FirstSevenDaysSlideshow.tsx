"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export type SlideshowProgram = {
  id: string | number;
  name: string;
  slug: string;
  image_url?: string | null;
  sub_text?: string | null;
  details_external?: boolean | null;
  external_link?: string | null;
  sessionDate?: string | null;
  centerName?: string | null;
};

type SessionRow = {
  id: string;
  program_id: string;
  venue_id: string;
  start_date: string;
  end_date?: string | null;
  language?: string | null;
  is_published?: boolean | null;
  registration_link?: string | null;
};

type VenueRow = {
  id: string;
  city_id: string | null;
  name: string;
  slug: string;
};

type CityRow = {
  id: string;
  name: string;
  slug: string;
};

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getProgramHref(program: SlideshowProgram): string {
  if (program.details_external && program.external_link) {
    return program.external_link;
  }
  return `/programs/${program.slug}`;
}

export default function FirstSevenDaysSlideshow({
  fallbackPrograms = [],
  autoPlayMs = 5000,
}: {
  fallbackPrograms?: SlideshowProgram[];
  autoPlayMs?: number;
}) {
  const [slides, setSlides] = useState<SlideshowProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const loadFirstSevenDays = async () => {
      try {
        const now = new Date();
        const todayStr = toLocalDateStr(now);

        const sevenDaysLater = new Date(now);
        sevenDaysLater.setDate(now.getDate() + 7);
        const endStr = toLocalDateStr(sevenDaysLater);

        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(
            "id, program_id, venue_id, start_date, end_date, language, is_published, registration_link"
          )
          .eq("is_published", true)
          .gte("start_date", todayStr)
          .lte("start_date", endStr)
          .order("start_date", { ascending: true });

        if (!sessionsError && Array.isArray(sessionsData) && sessionsData.length > 0) {
          const typedSessions = sessionsData as SessionRow[];

          const programIds = Array.from(
            new Set(typedSessions.map((s) => s.program_id).filter(Boolean))
          );
          const venueIds = Array.from(
            new Set(typedSessions.map((s) => s.venue_id).filter(Boolean))
          );

          const programsMap = new Map<string, SlideshowProgram>();
          const venueToCityNameMap = new Map<string, string>();

          if (programIds.length > 0) {
            const { data: progRows } = await supabase
              .from("programs")
              .select(
                "id, name, slug, image_url, sub_text, details_external, external_link"
              )
              .in("id", programIds);

            if (Array.isArray(progRows)) {
              for (const p of progRows as SlideshowProgram[]) {
                programsMap.set(String(p.id), p);
              }
            }
          }

          if (venueIds.length > 0) {
            const { data: venueRows } = await supabase
              .from("venues")
              .select("id, city_id, name, slug")
              .in("id", venueIds);

            if (Array.isArray(venueRows) && venueRows.length > 0) {
              const typedVenues = venueRows as VenueRow[];
              const cityIds = Array.from(
                new Set(
                  typedVenues
                    .map((v) => v.city_id)
                    .filter((id): id is string => Boolean(id))
                )
              );

              const cityMap = new Map<string, string>();
              if (cityIds.length > 0) {
                const { data: cityRows } = await supabase
                  .from("cities")
                  .select("id, name, slug")
                  .in("id", cityIds);

                if (Array.isArray(cityRows)) {
                  for (const c of cityRows as CityRow[]) {
                    cityMap.set(String(c.id), c.name);
                  }
                }
              }

              for (const v of typedVenues) {
                const resolvedCityName = v.city_id
                  ? cityMap.get(String(v.city_id))
                  : undefined;
                if (resolvedCityName) {
                  venueToCityNameMap.set(String(v.id), resolvedCityName);
                } else if (v.name) {
                  venueToCityNameMap.set(String(v.id), v.name);
                }
              }
            }
          }

          const mappedSlides: SlideshowProgram[] = [];
          const seenKeys = new Set<string>();

          for (const session of typedSessions) {
            const progId = String(session.program_id);
            const matchedProgram = programsMap.get(progId);
            const fallbackMatch = fallbackPrograms.find(
              (fp) => String(fp.id) === progId
            );
            const baseProgram = matchedProgram || fallbackMatch;

            if (!baseProgram) continue;

            const centerName = session.venue_id
              ? venueToCityNameMap.get(String(session.venue_id)) || null
              : null;

            const dedupeKey = `${baseProgram.slug}-${session.start_date}-${centerName ?? ""}`;
            if (seenKeys.has(dedupeKey)) continue;
            seenKeys.add(dedupeKey);

            mappedSlides.push({
              ...baseProgram,
              sessionDate: session.start_date,
              centerName,
              external_link: session.registration_link || baseProgram.external_link,
            });
          }

          if (mappedSlides.length > 0) {
            setSlides(mappedSlides);
            setLoading(false);
            return;
          }
        }

        setSlides(fallbackPrograms.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    loadFirstSevenDays();
  }, [fallbackPrograms]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, autoPlayMs);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, autoPlayMs]);

  if (loading || slides.length === 0) {
    return null;
  }

  const current = slides[activeIndex] || slides[0];
  const href = getProgramHref(current);
  const isExternal = Boolean(current.details_external && current.external_link);
  const formattedDate = formatShortDate(current.sessionDate);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const uniformHeightClass = "h-64 w-full sm:h-72";
  const imageCardClass = `relative flex ${uniformHeightClass} items-center justify-center overflow-hidden rounded-2xl border border-[#1F2A63]/10 bg-[#FAF8F4]/90 shadow-2xs backdrop-blur-[2px]`;

  const slideContent = (
    <div
      className={`group grid items-stretch gap-6 ${
        current.image_url ? "md:grid-cols-3" : "md:grid-cols-2"
      }`}
    >
      {/* Block 1: Animated 7-Days Banner Image (No Background Box) */}
      <div
        className={`relative flex ${uniformHeightClass} items-center justify-center overflow-hidden p-4`}
      >
        <div
          aria-hidden="true"
          className="seven-days-glow absolute h-36 w-36 rounded-full bg-[#F28C18]/25 blur-2xl"
        />
        <img
          src="/7days-bg.png"
          alt="Upcoming programs in the next 7 days"
          className="seven-days-float relative z-10 h-full w-full rounded-xl object-contain transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1"
        />
      </div>

      {/* Block 2: Program Image (when present) */}
      {current.image_url && (
        <div className={imageCardClass}>
          <img
            src={current.image_url}
            alt={current.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Block 3: Dynamic Slide Details (No Background Box) */}
      <div
        className={`flex ${uniformHeightClass} flex-col items-start justify-center px-4 py-3 text-left sm:px-6`}
      >
        {current.centerName && (
          <h3 className="text-xl font-medium tracking-normal text-[#1F2A63] sm:text-2xl">
            {current.centerName}
          </h3>
        )}

        <div
          className={`flex flex-wrap items-center gap-2 text-xs font-medium ${
            current.centerName ? "mt-2" : ""
          }`}
        >
          <span className="rounded-full bg-[#F28C18]/15 px-3 py-0.5 text-[#9A5200]">
            Next 7 Days
          </span>
          {formattedDate && (
            <span className="text-[#1F2A63]">{formattedDate}</span>
          )}
        </div>

        <p className="mt-3 line-clamp-2 text-lg font-medium tracking-normal text-slate-900 transition group-hover:text-[#F28C18] sm:text-xl">
          {current.name}
        </p>

        {current.sub_text && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {current.sub_text}
          </p>
        )}

        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#1F2A63] underline underline-offset-4 group-hover:text-[#F28C18]">
          <span>Explore Program</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-3xl border border-black/10 p-6 shadow-sm sm:p-8"
    >
      {/* Background Image Layer */}
      <img
        src="/bg.jpeg"
        alt=""
        aria-hidden="true"
        onError={() => console.error("Failed to load /bg.jpeg")}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill opacity-100"
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-end gap-2">
          {slides.length > 1 && (
            <>
              <span className="mr-1 text-xs font-medium text-slate-500">
                {activeIndex + 1} / {slides.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous program"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2A63]/40"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15 18-6-6 6-6"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next program"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1F2A63] text-white transition hover:bg-[#161e47] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F2A63]/40"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 18 6-6-6-6"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block focus:outline-none"
          >
            {slideContent}
          </a>
        ) : (
          <Link href={href} className="block focus:outline-none">
            {slideContent}
          </Link>
        )}

        {slides.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {slides.map((item, idx) => (
              <button
                key={`${item.id}-${item.sessionDate ?? idx}-${item.centerName ?? ""}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show ${item.name}`}
                className={`h-2 rounded-full transition-all ${
                  idx === activeIndex
                    ? "w-6 bg-[#F28C18]"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes sevenDaysFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(1.2deg);
          }
        }

        @keyframes sevenDaysAura {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.12);
            opacity: 0.85;
          }
        }

        .seven-days-float {
          animation: sevenDaysFloat 3.4s ease-in-out infinite;
        }

        .seven-days-glow {
          animation: sevenDaysAura 3.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .seven-days-float,
          .seven-days-glow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}