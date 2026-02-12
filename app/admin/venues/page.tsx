"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import VenueModal from "@/components/admin/VenueModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type City = {
  id: string | number;
  name: string;
};

type Venue = {
  id: string | number;
  name: string;
  city_id: string | number | null;
  address: string | null;
  google_maps_url: string | null;
  cities?: { name: string } | null;
};

const PAGE_SIZE = 20;

function VenuesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Math.floor(Number(pageParam ?? "1") || 1));

  const [venues, setVenues] = useState<Venue[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Venue | null>(null);
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

  const fetchVenues = async () => {
    setIsLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("venues")
      .select("*, cities(name)", { count: "exact" })
      .order("name")
      .range(from, to);

    if (error) {
      setErrorMessage(error.message);
      setVenues([]);
      setTotalCount(0);
    } else {
      setErrorMessage(null);
      setVenues(data ?? []);
      setTotalCount(count ?? 0);

      const nextTotalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
    }

    setIsLoading(false);
  };

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("name");

    if (error) {
      setErrorMessage(error.message);
      setCities([]);
    } else {
      setCities(data ?? []);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [page]);

  useEffect(() => {
    fetchCities();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVenue(null);
    setErrorMessage(null);
  };

  const handleSaveVenue = async (payload: {
    name: string;
    cityId: string | number | null;
    address: string;
    googleMapsUrl: string;
  }) => {
    if (!payload.name || !payload.cityId) {
      setErrorMessage("Please enter a venue name and select a city.");
      return;
    }

    setIsSaving(true);

    const venuePayload = {
      name: payload.name,
      slug: slugify(payload.name),
      city_id: payload.cityId,
      address: payload.address || null,
      google_maps_url: payload.googleMapsUrl || null,
    };

    const { error } = editingVenue
      ? await supabase
          .from("venues")
          .update(venuePayload)
          .eq("id", editingVenue.id)
      : await supabase.from("venues").insert(venuePayload);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setEditingVenue(null);
    await fetchVenues();
  };

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (venue: Venue) => {
    setPendingDelete(venue);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { error } = await supabase
      .from("venues")
      .delete()
      .eq("id", pendingDelete.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setConfirmOpen(false);
    setPendingDelete(null);
    await fetchVenues();
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2B2B2B]">Venues</h1>
          <p className="mt-1 text-sm text-[#8C7A5B]">
            Store venue details, locations, and city references.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingVenue(null);
            setIsModalOpen(true);
          }}
        >
          + Add Venue
        </Button>
      </header>

      <section className="rounded-lg border border-[#E2DED3] bg-white">
        <div className="border-b border-[#E2DED3] px-6 py-4 text-sm font-medium text-[#8C7A5B]">
          Venue List
        </div>
        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-[#8C7A5B]">Loading venues...</p>
          ) : venues.length === 0 ? (
            <p className="text-sm text-[#8C7A5B]">
              No venues yet. Add the first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#E2DED3] text-left text-xs uppercase tracking-[0.2em] text-[#8C7A5B]">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Venue Name</th>
                    <th className="pb-3 pr-4 font-medium">City</th>
                    <th className="pb-3 pr-4 font-medium">Address</th>
                    <th className="pb-3 pr-4 text-right font-medium">Map</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DED3]">
                  {venues.map((venue) => (
                    <tr key={venue.id} className="text-[#2B2B2B]">
                      <td className="py-4 pr-4 font-medium">{venue.name}</td>
                      <td className="py-4 pr-4 text-[#8C7A5B]">
                        {venue.cities?.name ?? "—"}
                      </td>
                      <td className="py-4 pr-4 text-[#8C7A5B]">
                        {venue.address || "—"}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        {venue.google_maps_url ? (
                          <a
                            href={venue.google_maps_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Open ${venue.name} in Google Maps`}
                            className="inline-flex items-center justify-end rounded-md border border-[#E2DED3] px-2 py-1 text-xs font-medium text-[#008000] hover:bg-[#F6F4EF]"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
                              <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-xs text-[#8C7A5B]">—</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleEditVenue(venue)}
                            className="text-[#6B5E4A] hover:text-[#2B2B2B]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(venue)}
                            className="text-[#8C7A5B] hover:text-[#2B2B2B]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      <VenueModal
        open={isModalOpen}
        cities={cities}
        isSaving={isSaving}
        errorMessage={errorMessage}
        initialVenue={editingVenue}
        onClose={handleCloseModal}
        onSave={handleSaveVenue}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Venue"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This action cannot be undone.`
            : "Delete this venue? This action cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[#8C7A5B]">Loading venues...</p>}
    >
      <VenuesPageInner />
    </Suspense>
  );
}

