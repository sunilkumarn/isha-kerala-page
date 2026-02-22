"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CityCard = {
  cityKey: string;
  cityName: string;
  slug: string;
  imageUrl: string | null;
  updatedAt: string | null;
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export default function CitiesSearchGrid({ cityCards }: { cityCards: CityCard[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return cityCards;
    return cityCards.filter((city) => normalizeQuery(city.cityName).includes(q));
  }, [cityCards, query]);

  return (
    <div>
      <div className="mx-auto mb-10 flex w-full max-w-2xl justify-center">
        <div className="relative w-full">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a city..."
            aria-label="Search cities by name"
            className="w-full rounded-full border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#F28C18] focus:ring-2 focus:ring-[#F28C18]/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">No matching cities found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((city) => (
            <div
              key={city.cityKey}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm"
            >
              <div className="-mx-8 -mt-8 mb-6">
                <div
                  className="relative aspect-[4/3] w-full bg-slate-100 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url("${
                      city.imageUrl
                        ? `${city.imageUrl}${
                            city.imageUrl.includes("?") ? "&" : "?"
                          }v=${encodeURIComponent(city.updatedAt ?? "")}`
                        : "/city-image.jpeg"
                    }")`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/60" aria-hidden="true" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-3xl font-semibold text-slate-700 mt-15">
                      {city.cityName}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <Link
                  href={`programs/all-programs/centers/${encodeURIComponent(city.slug)}`}
                  className="inline-flex items-center justify-center rounded-full bg-[#F28C18] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                >
                  View programs
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

