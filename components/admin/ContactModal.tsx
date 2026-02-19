"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/admin/Button";
import Modal from "@/components/admin/Modal";

type City = {
  id: string | number;
  name: string;
};

type ContactModalProps = {
  open: boolean;
  cities: City[];
  isSaving: boolean;
  errorMessage: string | null;
  initialContact?: {
    id: string | number;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    city_id: string | number | null;
  } | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    email: string | null;
    phone: string;
    whatsapp: string;
    cityId: string | number | null;
  }) => void;
};

export default function ContactModal({
  open,
  cities,
  isSaving,
  errorMessage,
  initialContact,
  onClose,
  onSave,
}: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cityId, setCityId] = useState<string | number | null>(null);

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => a.name.localeCompare(b.name)),
    [cities]
  );

  useEffect(() => {
    if (open) {
      setName(initialContact?.name ?? "");
      setEmail(initialContact?.email ?? "");
      setPhone(initialContact?.phone ?? "");
      setWhatsapp(initialContact?.whatsapp ?? "");
      setCityId(initialContact?.city_id ?? null);
    }
  }, [open, initialContact]);

  const handleSave = () => {
    const trimmedEmail = email.trim();
    onSave({
      name: name.trim(),
      email: trimmedEmail ? trimmedEmail : null,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      cityId,
    });
  };

  return (
    <Modal
      open={open}
      title={initialContact ? "Edit Contact" : "Create New Contact"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g., Radhika Iyer"
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Email (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 00000 00000"
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            WhatsApp (Optional)
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="+91 00000 00000"
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
              : initialContact
                ? "Update Contact"
                : "Save Contact"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

