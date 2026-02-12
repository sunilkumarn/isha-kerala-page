import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPublicProgramsFromPublishedSessions } from "@/lib/public-programs";

export const dynamic = "force-dynamic";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  slug: string;
  image_url?: string | null;
  updated_at?: string | null;
  sub_text?: string | null;
  details_external?: boolean | null;
  external_link?: string | null;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const floored = Math.floor(parsed);
  return floored >= 0 ? floored : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const offset = parsePositiveInt(url.searchParams.get("offset"), 0);
  const limitRaw = parsePositiveInt(url.searchParams.get("limit"), 6);
  const limit = Math.min(50, Math.max(1, limitRaw));

  const supabase = createSupabaseServerClient();

  try {
    const { programs, hasMore } = await getPublicProgramsFromPublishedSessions(
      supabase,
      { offset, limit }
    );
    return NextResponse.json(
      { programs, hasMore },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}


