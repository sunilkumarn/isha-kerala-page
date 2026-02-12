"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type City = {
  id: string | number;
  name: string;
};

const PAGE_SIZE = 20;

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
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<City | null>(null);
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
    const { error } = editingCity
      ? await supabase
          .from("cities")
          .update({ name: trimmedName })
          .eq("id", editingCity.id)
      : await supabase.from("cities").insert({ name: trimmedName });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setCityName("");
    setIsModalOpen(false);
    setEditingCity(null);
    await fetchCities();
    setIsSaving(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCityName("");
    setEditingCity(null);
    setErrorMessage(null);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityName(city.name);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (city: City) => {
    setPendingDelete(city);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { error } = await supabase
      .from("cities")
      .delete()
      .eq("id", pendingDelete.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setConfirmOpen(false);
    setPendingDelete(null);
    await fetchCities();
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
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
                  <span className="font-medium text-[#2B2B2B]">
                    {city.name}
                  </span>
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

          {errorMessage ? (
            <p className="text-sm text-[#8C7A5B]">{errorMessage}</p>
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

