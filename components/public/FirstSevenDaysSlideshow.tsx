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

  const slideContent = (
    <div className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:shadow-md">
      <div className="grid items-center md:grid-cols-12">
        {current.image_url && (
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF8F4] md:col-span-5">
            <img
              src={current.image_url}
              alt={current.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div
          className={`p-6 sm:p-8 ${
            current.image_url ? "md:col-span-7" : "md:col-span-12"
          }`}
        >
          {current.centerName && (
            <h3 className="text-lg font-medium tracking-normal text-[#1F2A63] sm:text-xl">
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

          <p className="mt-3 text-xl font-medium tracking-normal text-slate-900 transition group-hover:text-[#F28C18] sm:text-2xl">
            {current.name}
          </p>

          {current.sub_text && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {current.sub_text}
            </p>
          )}

          <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#1F2A63] underline underline-offset-4 group-hover:text-[#F28C18]">
            <span>Explore Program</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium tracking-normal text-[#1F2A63] sm:text-lg">
          Starting in the Next 7 Days
        </h2>

        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {activeIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous program"
              className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next program"
              className="rounded-full bg-[#1F2A63] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#161e47]"
            >
              Next
            </button>
          </div>
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
        <div className="flex items-center justify-center gap-2 pt-1">
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
  );
}