import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getPublicProgramsFromPublishedSessions } from "@/lib/public-programs";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  slug: string;
  image_url?: string | null;
  sub_text?: string | null;
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
    return NextResponse.json({ programs, hasMore });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


