export type AdminDeletableTable =
  | "cities"
  | "venues"
  | "contacts"
  | "programs"
  | "sessions";

export async function adminDeleteById(
  table: AdminDeletableTable,
  id: string | number
) {
  const response = await fetch("/api/admin/delete", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, id }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Delete failed.");
  }

  return payload;
}


