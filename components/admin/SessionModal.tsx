"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/admin/Button";
import Modal from "@/components/admin/Modal";

type Program = {
  id: string | number;
  name: string;
  parent_id?: string | number | null;
};

type Venue = {
  id: string | number;
  name: string;
  city_id?: string | number | null;
};

type Contact = {
  id: string | number;
  name: string;
};

type City = {
  id: string | number;
  name: string;
};

type SessionModalProps = {
  open: boolean;
  programs: Program[];
  venues: Venue[];
  contacts: Contact[];
  cities: City[];
  isSaving: boolean;
  errorMessage: string | null;
  initialSession?: {
    id: string | number;
    program_id: string | number | null;
    venue_id: string | number | null;
    contact_id: string | number | null;
    start_date: string;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    language: string | null;
    is_published: boolean | null;
    registrations_allowed?: boolean | null;
    registration_link?: string | null;
    open_without_registration?: boolean | null;
  } | null;
  onClose: () => void;
  onSave: (payload: {
    programId: string | number | null;
    cityId: string | number | null;
    venueId: string | number | null;
    contactId: string | number | null;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    language: string;
    isPublished: boolean;
    registrationsAllowed: boolean;
    registrationLink: string;
    openWithoutRegistration: boolean;
  }) => void;
};

export default function SessionModal({
  open,
  programs,
  venues,
  contacts,
  cities,
  isSaving,
  errorMessage,
  initialSession,
  onClose,
  onSave,
}: SessionModalProps) {
  const router = useRouter();
  const [programId, setProgramId] = useState<string | number | null>(null);
  const [cityId, setCityId] = useState<string | number | null>(null);
  const [venueId, setVenueId] = useState<string | number | null>(null);
  const [contactId, setContactId] = useState<string | number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [language, setLanguage] = useState("English");
  const [isPublished, setIsPublished] = useState(false);
  const [registrationsAllowed, setRegistrationsAllowed] = useState(false);
  const [registrationLink, setRegistrationLink] = useState("");
  const [openWithoutRegistration, setOpenWithoutRegistration] = useState(false);

  const leafPrograms = useMemo(() => {
    const parentIds = new Set(
      programs
        .map((program) => program.parent_id)
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value))
    );

    return programs.filter((program) => !parentIds.has(String(program.id)));
  }, [programs]);

  const sortedPrograms = useMemo(
    () => [...leafPrograms].sort((a, b) => a.name.localeCompare(b.name)),
    [leafPrograms]
  );

  const sortedVenues = useMemo(
    () => [...venues].sort((a, b) => a.name.localeCompare(b.name)),
    [venues]
  );

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.name.localeCompare(b.name)),
    [contacts]
  );

  useEffect(() => {
    if (open) {
      const initialVenue = venues.find(
        (venue) => String(venue.id) === String(initialSession?.venue_id ?? "")
      );
      setProgramId(initialSession?.program_id ?? null);
      setCityId(initialVenue?.city_id ?? null);
      setVenueId(initialSession?.venue_id ?? null);
      setContactId(initialSession?.contact_id ?? null);
      setStartDate(initialSession?.start_date ?? "");
      setEndDate(initialSession?.end_date ?? "");
      setStartTime(initialSession?.start_time ?? "");
      setEndTime(initialSession?.end_time ?? "");
      setLanguage(initialSession?.language ?? "English");
      setIsPublished(Boolean(initialSession?.is_published));
      setRegistrationsAllowed(Boolean(initialSession?.registrations_allowed));
      setRegistrationLink(initialSession?.registration_link ?? "");
      setOpenWithoutRegistration(Boolean(initialSession?.open_without_registration));
    }
  }, [open, initialSession, venues]);

  useEffect(() => {
    if (!registrationsAllowed) {
      setRegistrationLink("");
    }
  }, [registrationsAllowed]);

  const handleSave = () => {
    onSave({
      programId,
      cityId,
      venueId,
      contactId,
      startDate,
      endDate,
      startTime,
      endTime,
      language,
      isPublished,
      registrationsAllowed,
      registrationLink,
      openWithoutRegistration,
    });
  };

  const filteredVenues = useMemo(() => {
    if (!cityId) return sortedVenues;
    return sortedVenues.filter(
      (venue) => String(venue.city_id ?? "") === String(cityId)
    );
  }, [sortedVenues, cityId]);

  return (
    <Modal
      open={open}
      title={initialSession ? "Edit Session" : "Create New Session"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">Program</label>
          <select
            value={programId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "__create_program__") {
                router.push("/admin/programs?create=1");
                return;
              }
              setProgramId(value ? value : null);
            }}
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="">Select Program</option>
            {sortedPrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
            <option value="__create_program__">Add new program</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">City</label>
          <select
            value={cityId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "__create_city__") {
                router.push("/admin/cities?create=1");
                return;
              }
              setCityId(value ? value : null);
              setVenueId(null);
            }}
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
            <option value="__create_city__">Add new city</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">Venue</label>
          <select
            value={venueId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "__create_venue__") {
                router.push("/admin/venues?create=1");
                return;
              }
              setVenueId(value ? value : null);
            }}
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="">Select Venue</option>
            {filteredVenues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
            <option value="__create_venue__">Create new venue</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">Contact</label>
          <select
            value={contactId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "__create_contact__") {
                router.push("/admin/contacts?create=1");
                return;
              }
              setContactId(value ? value : null);
            }}
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="">Select Contact</option>
            {sortedContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
            <option value="__create_contact__">Create new contact</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              Start Time (Optional)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              End Time (Optional)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Language
          </label>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="English">English</option>
            <option value="Malayalam">Malayalam</option>
          </select>
        </div>

        <label className="flex items-center justify-between rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]">
          Registrations Open?
          <input
            type="checkbox"
            checked={registrationsAllowed}
            onChange={(event) => setRegistrationsAllowed(event.target.checked)}
            className="h-4 w-4 rounded border-[#E2DED3] text-[#6B5E4A] focus:ring-[#8C7A5B]"
          />
        </label>

        {registrationsAllowed ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2B2B2B]">
              Registration Link
            </label>
            <input
              type="url"
              value={registrationLink}
              onChange={(event) => setRegistrationLink(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
            />
          </div>
        ) : null}

        <label className="flex items-center justify-between rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]">
          Open without Registration (Walk-in allowed)
          <input
            type="checkbox"
            checked={openWithoutRegistration}
            onChange={(event) => setOpenWithoutRegistration(event.target.checked)}
            className="h-4 w-4 rounded border-[#E2DED3] text-[#6B5E4A] focus:ring-[#8C7A5B]"
          />
        </label>

        <label className="flex items-center justify-between rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]">
          Publish this session
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4 rounded border-[#E2DED3] text-[#6B5E4A] focus:ring-[#8C7A5B]"
          />
        </label>

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
              : initialSession
                ? "Update Session"
                : "Save Session"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

