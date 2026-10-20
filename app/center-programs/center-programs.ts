import { SupabaseClient } from "@supabase/supabase-js";

export async function getProgramsCityWise(supabase: SupabaseClient) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("cities")
    .select(`
      id,
      name,
      slug,
      image_url,
      venues!inner (
        id,
        name,
        address,
        google_maps_url,
        sessions!inner (
          id,
          start_date,
          end_date,
          start_time,
          end_time,
          language,
          registrations_allowed,
          registration_link,
          open_without_registration,
          is_published,
          programs (
            id,
            name,
            slug,
            sub_text,
            details_external,
            external_link
          )
        )
      )
    `)
    .eq("venues.sessions.is_published", true)
    .gt("venues.sessions.start_date", today)
    .order("name", { ascending: true }) // Sort cities alphabetically
    .order("name", { referencedTable: "venues", ascending: true }) // Sort venues alphabetically within each city
    .order("start_date", { referencedTable: "venues.sessions", ascending: true }); // Sort sessions chronologically

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}