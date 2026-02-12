"use client";

import { useMemo } from "react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function getVisiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, idx) => idx + 1);

  const pages = new Set<number>([1, total, current]);
  pages.add(clamp(current - 1, 1, total));
  pages.add(clamp(current + 1, 1, total));
  pages.add(clamp(current - 2, 1, total));
  pages.add(clamp(current + 2, 1, total));

  return Array.from(pages)
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b);
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 20,
  className,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, Math.floor(totalPages));
  const safePage = clamp(Math.floor(page), 1, safeTotalPages);

  const canPrev = safePage > 1;
  const canNext = safePage < safeTotalPages;

  const label = useMemo(() => {
    if (typeof totalItems !== "number") {
      return `Page ${safePage} of ${safeTotalPages}`;
    }

    if (totalItems === 0) return "No results";

    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(totalItems, safePage * pageSize);
    return `Showing ${start}–${end} of ${totalItems}`;
  }, [pageSize, safePage, safeTotalPages, totalItems]);

  const visiblePages = useMemo(
    () => getVisiblePages(safePage, safeTotalPages),
    [safePage, safeTotalPages]
  );

  if (safeTotalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        className ?? ""
      }`}
    >
      <p className="text-sm text-[#8C7A5B]">{label}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={!canPrev}
          className="rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-xs font-medium text-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {visiblePages.map((pageNumber, idx) => {
            const previous = visiblePages[idx - 1];
            const showEllipsis = idx > 0 && previous !== undefined && pageNumber - previous > 1;

            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {showEllipsis ? (
                  <span className="px-2 text-xs text-[#8C7A5B]">…</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  aria-current={pageNumber === safePage ? "page" : undefined}
                  className={`min-w-9 rounded-md border px-3 py-2 text-xs font-medium ${
                    pageNumber === safePage
                      ? "border-[#8C7A5B] bg-white text-[#2B2B2B]"
                      : "border-[#E2DED3] bg-[#F6F4EF] text-[#2B2B2B] hover:bg-[#EAE6DC]"
                  }`}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={!canNext}
          className="rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-xs font-medium text-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}


