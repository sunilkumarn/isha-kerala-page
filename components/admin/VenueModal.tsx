"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/admin/Button";
import Modal from "@/components/admin/Modal";

type City = {
  id: string | number;
  name: string;
};

type VenueModalProps = {
  open: boolean;
  cities: City[];
  isSaving: boolean;
  errorMessage: string | null;
  initialVenue?: {
    id: string | number;
    name: string;
    city_id: string | number | null;
    address: string | null;
    google_maps_url: string | null;
  } | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    cityId: string | number | null;
    address: string;
    googleMapsUrl: string;
  }) => void;
};

export default function VenueModal({
  open,
  cities,
  isSaving,
  errorMessage,
  initialVenue,
  onClose,
  onSave,
}: VenueModalProps) {
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState<string | number | null>(null);
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => a.name.localeCompare(b.name)),
    [cities]
  );

  useEffect(() => {
    if (open) {
      setName(initialVenue?.name ?? "");
      setCityId(initialVenue?.city_id ?? null);
      setAddress(initialVenue?.address ?? "");
      setGoogleMapsUrl(initialVenue?.google_maps_url ?? "");
    }
  }, [open, initialVenue]);

  const handleSave = () => {
    onSave({
      name: name.trim(),
      cityId,
      address: address.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
    });
  };

  return (
    <Modal
      open={open}
      title={initialVenue ? "Edit Venue" : "Create New Venue"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Venue Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g., Isha Yoga Center"
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">City</label>
          <select
            value={cityId ?? ""}
            onChange={(event) =>
              setCityId(event.target.value ? event.target.value : null)
            }
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="">Select City</option>
            {sortedCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">Address</label>
          <input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Street, area, and landmark"
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Google Maps Link
          </label>
          <input
            type="url"
            value={googleMapsUrl}
            onChange={(event) => setGoogleMapsUrl(event.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-[#8C7A5B]">{errorMessage}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : initialVenue
                ? "Update Venue"
                : "Save Venue"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

