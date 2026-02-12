"use client";

import Link from "next/link";

type Program = {
  id: string | number;
  name: string;
  slug: string;
  image_url?: string | null;
  sub_text?: string | null;
  details_external?: boolean | null;
  external_link?: string | null;
};

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 5h5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14L19 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProgramCard({ program }: { program: Program }) {
  const externalHref = (program.external_link ?? "").trim();
  const wantsExternal = Boolean(program.details_external);
  const isExternal = wantsExternal && externalHref.length > 0;

  const Wrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => {
    if (isExternal) {
      return (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={`/programs/${encodeURIComponent(program.slug)}`}
        className="block h-full"
      >
        {children}
      </Link>
    );
  };

  return (
    <article className="h-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Wrapper>
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
              <div className="text-xs font-medium text-slate-500">No image</div>
            </div>
          )}

          
        </div>

        <div className="p-6 text-center">
          <h3 className="text-xl text-slate-900">{program.name}</h3>
          {program.sub_text ? (
            <p className="mt-0 text-sm text-slate-600 line-clamp-2">
              {program.sub_text}
            </p>
          ) : null}

          <div className="mt-5">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F28C18] px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2">
              Know More
              {wantsExternal ? (
                <ExternalLinkIcon className="h-4 w-4 text-white/90" />
              ) : null}
            </span>
          </div>
        </div>
      </Wrapper>
    </article>
  );
}

