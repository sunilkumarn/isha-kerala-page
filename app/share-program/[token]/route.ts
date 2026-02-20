import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yyyyRaw, mmRaw, ddRaw] = value.split("-");
  const yyyy = Number(yyyyRaw);
  const mm = Number(mmRaw);
  const dd = Number(ddRaw);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return false;
  const utc = new Date(Date.UTC(yyyy, mm - 1, dd));
  return (
    utc.getUTCFullYear() === yyyy &&
    utc.getUTCMonth() === mm - 1 &&
    utc.getUTCDate() === dd
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: tokenRaw } = await params;
  const token = decodeURIComponent(tokenRaw ?? "").trim();

  // Expected: <programSlug-citySlug-venueSlug-YYYY-MM-DD>
  if (!token || token.length < 12) {
    return NextResponse.redirect(new URL("/programs", request.url));
  }

  const datePart = token.slice(-10);
  const dashBeforeDate = token.at(-11) ?? "";
  if (dashBeforeDate !== "-" || !isIsoDate(datePart)) {
    return NextResponse.redirect(new URL("/programs", request.url));
  }

  const rest = token.slice(0, -11);
  const separators: number[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === "-") separators.push(i);
  }

  if (separators.length < 2) {
    return NextResponse.redirect(new URL("/programs", request.url));
  }

  const candidateProgramSlugs = Array.from(
    new Set(separators.map((idx) => rest.slice(0, idx)).filter(Boolean))
  );
  const candidateVenueSlugs = Array.from(
    new Set(separators.map((idx) => rest.slice(idx + 1)).filter(Boolean))
  );

  if (candidateProgramSlugs.length === 0 || candidateVenueSlugs.length === 0) {
    return NextResponse.redirect(new URL("/programs", request.url));
  }

  const supabase = createSupabaseServerClient();

  const [{ data: programRows, error: programError }, { data: venueRows, error: venueError }] =
    await Promise.all([
      supabase.from("programs").select("slug").in("slug", candidateProgramSlugs),
      supabase.from("venues").select("slug").in("slug", candidateVenueSlugs),
    ]);

  if (programError || venueError) {
    return NextResponse.redirect(new URL("/programs", request.url));
  }

  const programSet = new Set((programRows ?? []).map((row) => String(row.slug)));
  const venueSet = new Set((venueRows ?? []).map((row) => String(row.slug)));

  type Match = { programSlug: string; citySlug: string; venueSlug: string; score: number };
  const matches: Match[] = [];

  for (let a = 0; a < separators.length - 1; a += 1) {
    const i = separators[a];
    const programSlug = rest.slice(0, i);
    if (!programSet.has(programSlug)) continue;

    for (let b = a + 1; b < separators.length; b += 1) {
      const j = separators[b];
      const citySlug = rest.slice(i + 1, j);
      const venueSlug = rest.slice(j + 1);
      if (!citySlug || !venueSlug) continue;
      if (!venueSet.has(venueSlug)) continue;
      matches.push({
        programSlug,
        citySlug,
        venueSlug,
        score: programSlug.length + venueSlug.length,
      });
    }
  }

  const best = matches.sort((x, y) => y.score - x.score)[0] ?? null;
  if (!best) {
    return NextResponse.redirect(new URL("/programs", request.url));
  }

  const redirectTo = `/programs/${encodeURIComponent(
    best.programSlug
  )}/centers/${encodeURIComponent(best.citySlug)}?venue=${encodeURIComponent(
    best.venueSlug
  )}&date=${encodeURIComponent(datePart)}`;

  return NextResponse.redirect(new URL(redirectTo, request.url), 302);
}

