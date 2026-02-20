"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { adminDeleteById } from "@/lib/admin-delete";
import { slugify } from "@/lib/slugify";
import { uploadCityImage } from "@/lib/upload-city-image";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type City = {
  id: string | number;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  updated_at?: string | null;
};

const PAGE_SIZE = 20;

async function ensureUniqueCitySlug(base: string, excludeId?: City["id"]) {
  const trimmed = base.trim();
  const safeBase = trimmed || "city";
  let candidate = safeBase;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    let query = supabase.from("cities").select("id").eq("slug", candidate).limit(1);
    if (excludeId !== undefined && excludeId !== null) {
      query = query.neq("id", excludeId as string | number);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return candidate;

    candidate = `${safeBase}-${attempt + 2}`;
  }

  const fallbackSuffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as Crypto).randomUUID().slice(0, 8)
      : String(Date.now());
  return `${safeBase}-${fallbackSuffix}`;
}

function CitiesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Math.floor(Number(pageParam ?? "1") || 1));

  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cityName, setCityName] = useState("");
  const [cityImageFile, setCityImageFile] = useState<File | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<City | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setPage = (nextPage: number) => {
    const safeNextPage = Math.max(1, Math.floor(nextPage));
    const params = new URLSearchParams(searchParams.toString());
    if (safeNextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(safeNextPage));
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const fetchCities = async () => {
    setIsLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("cities")
      .select("*", { count: "exact" })
      .order("name")
      .range(from, to);

    if (error) {
      setErrorMessage(error.message);
      setCities([]);
      setTotalCount(0);
    } else {
      setErrorMessage(null);
      setCities(data ?? []);
      setTotalCount(count ?? 0);

      const nextTotalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchCities();
  }, [page]);

  const handleSave = async () => {
    const trimmedName = cityName.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a city name.");
      return;
    }

    setIsSaving(true);
    try {
      const baseSlug = slugify(trimmedName);
      const slug =
        editingCity?.slug && editingCity.slug.trim()
          ? editingCity.slug.trim()
          : await ensureUniqueCitySlug(baseSlug, editingCity?.id);

      let imageUrl: string | null = null;

      if (cityImageFile) {
        const { publicUrl } = await uploadCityImage({
          file: cityImageFile,
          slug,
        });
        imageUrl = publicUrl;
      }

      const basePayload: {
        name: string;
        slug?: string;
        image_url?: string | null;
      } = {
        name: trimmedName,
      };

      if (!editingCity) {
        basePayload.slug = slug;
      } else if (!editingCity.slug) {
        basePayload.slug = slug;
      }

      if (imageUrl) {
        basePayload.image_url = imageUrl;
      }

      const { error } = editingCity
        ? await supabase.from("cities").update(basePayload).eq("id", editingCity.id)
        : await supabase.from("cities").insert({
            ...basePayload,
            image_url: imageUrl ?? null,
          });

      if (error) {
        if (!editingCity && error.code === "23505") {
          setErrorMessage("City already exists");
        } else {
          setErrorMessage(error.message);
        }
        setIsSaving(false);
        return;
      }

      setCityName("");
      setCityImageFile(null);
      setIsModalOpen(false);
      setEditingCity(null);
      await fetchCities();
      setIsSaving(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCityName("");
    setCityImageFile(null);
    setEditingCity(null);
    setErrorMessage(null);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityName(city.name);
    setCityImageFile(null);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (city: City) => {
    setPendingDelete(city);
    setDeleteErrorMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await adminDeleteById("cities", pendingDelete.id);
      setConfirmOpen(false);
      setPendingDelete(null);
      await fetchCities();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
    setDeleteErrorMessage(null);
    setIsDeleting(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2B2B2B]">Cities</h1>
          <p className="mt-1 text-sm text-[#8C7A5B]">
            Manage the cities available for sessions and venues.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingCity(null);
            setCityName("");
            setCityImageFile(null);
            setIsModalOpen(true);
          }}
        >
          + Add City
        </Button>
      </header>

      <section className="rounded-lg border border-[#E2DED3] bg-white">
        <div className="border-b border-[#E2DED3] px-6 py-4 text-sm font-medium text-[#8C7A5B]">
          City List
        </div>
        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-[#8C7A5B]">Loading cities...</p>
          ) : cities.length === 0 ? (
            <p className="text-sm text-[#8C7A5B]">
              No cities yet. Add the first one.
            </p>
          ) : (
            <ul className="space-y-3">
              {cities.map((city) => (
                <li
                  key={city.id}
                  className="flex items-center justify-between rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-4">
                    {city.image_url ? (
                      <img
                        src={`${city.image_url}${
                          city.image_url.includes("?") ? "&" : "?"
                        }v=${encodeURIComponent(city.updated_at ?? "")}`}
                        alt={city.name}
                        className="h-10 w-10 rounded-md border border-[#E2DED3] object-cover"
                      />
                    ) : null}
                    <span className="font-medium text-[#2B2B2B]">
                      {city.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleEditCity(city)}
                      className="text-[#6B5E4A] hover:text-[#2B2B2B]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(city)}
                      className="text-[#8C7A5B] hover:text-[#2B2B2B]"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {totalPages > 1 ? (
          <div className="border-t border-[#E2DED3] px-6 py-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>

      <Modal
        open={isModalOpen}
        title={editingCity ? "Edit City" : "Create New City"}
        onClose={handleCloseModal}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              City Name
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(event) => setCityName(event.target.value)}
              placeholder="e.g., San Francisco"
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              City Image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setCityImageFile(file);
              }}
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#2B2B2B]"
            />
            <p className="text-xs text-[#8C7A5B]">
              Upload an image here. 
            </p>
          </div>

          {errorMessage ? (
            <p className="text-xs text-red-600">{errorMessage}</p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingCity
                  ? "Update City"
                  : "Save City"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete City"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This action cannot be undone.`
            : "Delete this city? This action cannot be undone."
        }
        confirmLabel="Delete"
        isConfirming={isDeleting}
        errorMessage={deleteErrorMessage}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default function CitiesPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[#8C7A5B]">Loading cities...</p>}
    >
      <CitiesPageInner />
    </Suspense>
  );
}
