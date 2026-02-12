import { supabase } from "@/lib/supabase";

export async function uploadCityImage(params: {
  file: File;
  slug: string;
  timestamp?: number;
}) {
  const timestamp = params.timestamp ?? Date.now();
  const filePath = `cities/${timestamp}-${params.slug}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("city_images")
    .upload(filePath, params.file, {
      contentType: params.file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicData } = supabase.storage
    .from("city_images")
    .getPublicUrl(filePath);

  const publicUrl = publicData.publicUrl ?? null;
  if (!publicUrl) {
    throw new Error("Could not generate public URL for uploaded city image.");
  }

  return { publicUrl, filePath };
}

