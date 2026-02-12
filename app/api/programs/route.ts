import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  image_url?: string | null;
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

  // Fetch one extra row to determine whether there's more to load.
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, parent_id, image_url")
    .is("parent_id", null)
    .order("name")
    .range(offset, offset + limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Program[];
  const hasMore = rows.length > limit;
  const programs = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({ programs, hasMore });
}


