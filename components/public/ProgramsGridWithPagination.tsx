"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  slug: string;
  image_url?: string | null;
};

type ProgramsApiResponse =
  | { programs: Program[]; hasMore: boolean }
  | { error: string };

export default function ProgramsGridWithPagination({
  initialPrograms,
  initialHasMore,
  pageSize = 6,
}: {
  initialPrograms: Program[];
  initialHasMore: boolean;
  pageSize?: number;
}) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const offset = useMemo(() => programs.length, [programs.length]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/programs?offset=${offset}&limit=${pageSize}`,
        { method: "GET" }
      );

      const json = (await response.json()) as ProgramsApiResponse;

      if (!response.ok) {
        const message =
          "error" in json ? json.error : "Failed to load more programs.";
        throw new Error(message);
      }

      if ("error" in json) throw new Error(json.error);

      setPrograms((prev) => [...prev, ...json.programs]);
      setHasMore(json.hasMore);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <article
            key={String(program.id)}
            className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full bg-slate-100">
              {program.image_url ? (
                // Use <img> to avoid Next image remotePatterns configuration.
                <img
                  src={program.image_url}
                  alt={program.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-medium text-slate-500">
                    No image
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 text-center">
              <h3 className="text-xl text-slate-900">{program.name}</h3>

              <div className="mt-5">
                <Link
                  href={`/programs/${encodeURIComponent(program.slug)}`}
                  className="inline-flex items-center justify-center rounded-full bg-[#F28C18] px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
                >
                  Know More
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {errorMessage ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center justify-center rounded-full bg-[#F28C18] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
          >
            {isLoadingMore ? "Loading..." : "Show more programs"}
          </button>
        </div>
      ) : null}
    </div>
  );
}


