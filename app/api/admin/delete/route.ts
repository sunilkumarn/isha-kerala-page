import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { createSupabaseServerClientWithAccessToken } from "@/lib/supabase-server";

const ALLOWED_TABLES = new Set([
  "cities",
  "venues",
  "contacts",
  "programs",
  "sessions",
] as const);

type AllowedTable = (typeof ALLOWED_TABLES extends Set<infer T> ? T : never) &
  string;

type DeleteRequestBody = {
  table?: string;
  id?: string | number;
};

function isAllowedTable(value: string): value is AllowedTable {
  return ALLOWED_TABLES.has(value as AllowedTable);
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServerClientWithAccessToken(accessToken);
  
    const body = await request.json();
  
    if (!body?.table || !ALLOWED_TABLES.has(body.table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
  
    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
  
    const { data, error } = await supabase
      .from(body.table)
      .delete()
      .eq("id", body.id)
      .select("id");
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If RLS blocks the delete (or the ID doesn't exist), PostgREST often returns
    // success with 0 rows affected. Make that failure explicit.
    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nothing was deleted. The row may not exist, or RLS prevented the delete for this user.",
        },
        { status: 404 }
      );
    }
  
    return NextResponse.json({ ok: true });
  }
  


