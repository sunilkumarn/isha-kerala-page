import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type IncomingSession = {
  rowNumber?: number;
  programSlug?: string;
  programName?: string;
  cityName?: string;
  venueName?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  language?: string | null;
  isPublished?: boolean;
  registrationLink?: string | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-sync-secret");
    if (!process.env.SHEETS_SYNC_SECRET || secret !== process.env.SHEETS_SYNC_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rows: IncomingSession[] = Array.isArray(body?.sessions) ? body.sessions : [];

    if (rows.length === 0) {
      return NextResponse.json({ error: "No sessions provided" }, { status: 400 });
    }

    const results: Array<{
      rowNumber?: number;
      ok: boolean;
      sessionId?: string;
      error?: string;
    }> = [];

    for (const item of rows) {
      try {
        if (!item.startDate) {
          results.push({
            rowNumber: item.rowNumber,
            ok: false,
            error: "Missing start_date",
          });
          continue;
        }

        // 1. Resolve program by slug or name
        let programQuery = supabaseAdmin.from("programs").select("id, slug, name");
        if (item.programSlug) {
          programQuery = programQuery.eq("slug", item.programSlug.trim());
        } else if (item.programName) {
          programQuery = programQuery.ilike("name", item.programName.trim());
        } else {
          results.push({
            rowNumber: item.rowNumber,
            ok: false,
            error: "Missing programSlug or programName",
          });
          continue;
        }

        const { data: programRow, error: progError } = await programQuery.maybeSingle();
        if (progError || !programRow) {
          results.push({
            rowNumber: item.rowNumber,
            ok: false,
            error: `Program not found (${item.programSlug || item.programName})`,
          });
          continue;
        }

        // 2. Resolve city & venue if provided
        let venueId: string | null = null;
        const cleanVenueName = item.venueName?.trim();
        const cleanCityName = item.cityName?.trim();

        if (cleanVenueName || cleanCityName) {
          let cityId: string | null = null;

          if (cleanCityName) {
            const citySlug = slugify(cleanCityName);
            const { data: existingCity } = await supabaseAdmin
              .from("cities")
              .select("id")
              .eq("slug", citySlug)
              .maybeSingle();

            if (existingCity?.id) {
              cityId = existingCity.id;
            } else {
              const { data: createdCity } = await supabaseAdmin
                .from("cities")
                .insert({ name: cleanCityName, slug: citySlug })
                .select("id")
                .single();
              cityId = createdCity?.id ?? null;
            }
          }

          const resolvedVenueName = cleanVenueName || cleanCityName!;
          const venueSlug = slugify(`${resolvedVenueName}-${cleanCityName ?? ""}`);

          const { data: existingVenue } = await supabaseAdmin
            .from("venues")
            .select("id")
            .eq("slug", venueSlug)
            .maybeSingle();

          if (existingVenue?.id) {
            venueId = existingVenue.id;
          } else {
            const { data: createdVenue } = await supabaseAdmin
              .from("venues")
              .insert({
                name: resolvedVenueName,
                slug: venueSlug,
                city_id: cityId,
              })
              .select("id")
              .single();
            venueId = createdVenue?.id ?? null;
          }
        }

        // 3. Upsert session (assumes a unique constraint on (program_id, venue_id, start_date))
        const payload = {
          program_id: programRow.id,
          venue_id: venueId,
          start_date: item.startDate.slice(0, 10),
          end_date: item.endDate ? item.endDate.slice(0, 10) : null,
          language: item.language?.trim() || null,
          is_published: item.isPublished ?? true,
          registration_link: item.registrationLink?.trim() || null,
        };

        const { data: upsertedSession, error: sessionError } = await supabaseAdmin
          .from("sessions")
          .upsert(payload, {
            onConflict: "program_id,venue_id,start_date",
          })
          .select("id")
          .single();

        if (sessionError) {
          results.push({
            rowNumber: item.rowNumber,
            ok: false,
            error: sessionError.message,
          });
          continue;
        }

        results.push({
          rowNumber: item.rowNumber,
          ok: true,
          sessionId: upsertedSession?.id,
        });
      } catch (err) {
        results.push({
          rowNumber: item.rowNumber,
          ok: false,
          error: err instanceof Error ? err.message : "Unexpected row error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}