"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type CityOption = {
  id: string | number;
  name: string;
};

const VOLUNTEERING_AREAS = [
  "Program Coordination & Support",
  "Venue Setup & Hospitality",
  "Outreach & Publicity",
  "Registration & Participant Care",
  "Audio / Visual & Tech Support",
  "Translation (Malayalam / English)",
  "General Volunteering",
];

const AVAILABILITY_OPTIONS = [
  "Weekends Only",
  "Weekdays",
  "During Specific Programs / Events",
  "Flexible / Anytime",
];

export default function VolunteeringInterestForm({
  centers,
}: {
  centers: CityOption[];
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedCenter = centers.find(
    (c) => String(c.id) === String(selectedCityId)
  );

  const toggleArea = (area: string) => {
    setAreasOfInterest((prev) =>
      prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    const cleanWhatsapp = sameAsWhatsapp
      ? cleanMobile
      : whatsappNumber.replace(/\D/g, "");

    if (!/^[6-9][0-9]{9}$/.test(cleanMobile)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (cleanWhatsapp && !/^[6-9][0-9]{9}$/.test(cleanWhatsapp)) {
      setErrorMsg("Please enter a valid 10-digit WhatsApp number.");
      return;
    }

    if (!selectedCenter) {
      setErrorMsg("Please select your local center.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("volunteering_interests").insert({
      full_name: fullName.trim(),
      mobile_number: cleanMobile,
      whatsapp_number: cleanWhatsapp || null,
      email: email.trim() || null,
      city_id: selectedCenter.id,
      local_center: selectedCenter.name,
      areas_of_interest: areasOfInterest,
      availability: availability || null,
      notes: notes.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#2C251D]/10 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mt-5 font-serif text-2xl font-semibold text-[#2C251D]">
          Thank You for Stepping Forward
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5C5346]">
          Your volunteering interest for{" "}
          <span className="font-medium text-[#2C251D]">
            {selectedCenter?.name}
          </span>{" "}
          center has been recorded. A local coordinator will reach out to you
          soon.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setFullName("");
            setMobileNumber("");
            setWhatsappNumber("");
            setEmail("");
            setSelectedCityId("");
            setAreasOfInterest([]);
            setAvailability("");
            setNotes("");
          }}
          className="mt-7 inline-flex items-center justify-center rounded-full border border-[#2C251D]/20 px-6 py-2.5 text-sm font-medium text-[#2C251D] transition hover:bg-[#FAF4E8]"
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#2C251D]/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="border-b border-[#2C251D]/10 pb-4">
        <h2 className="font-serif text-xl font-semibold text-[#2C251D] sm:text-2xl">
          Share Your Details
        </h2>
        <p className="mt-1 text-sm text-[#6E6456]">
          Select your nearest center and let us know how you would like to
          contribute.
        </p>
      </div>

      {errorMsg && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-[#2C251D]">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20"
          />
        </div>

        {/* Mobile & WhatsApp */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#2C251D]">
              Mobile Number (10 digits) <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="9876543210"
              className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#2C251D]">
                WhatsApp Number
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#6E6456]">
                <input
                  type="checkbox"
                  checked={sameAsWhatsapp}
                  onChange={(e) => setSameAsWhatsapp(e.target.checked)}
                  className="rounded border-slate-300 text-[#F28C18] focus:ring-[#F28C18]"
                />
                Same as mobile
              </label>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              disabled={sameAsWhatsapp}
              value={sameAsWhatsapp ? mobileNumber : whatsappNumber}
              onChange={(e) =>
                setWhatsappNumber(e.target.value.replace(/\D/g, ""))
              }
              placeholder="9876543210"
              className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        {/* Local Center & Email */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[#2C251D]">
              Local Center <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20"
            >
              <option value="">Select your local center</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C251D]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20"
            />
          </div>
        </div>

        {/* Areas of Interest */}
        <div>
          <label className="block text-sm font-medium text-[#2C251D]">
            Areas of Volunteering Interest
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOLUNTEERING_AREAS.map((area) => {
              const selected = areasOfInterest.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "border-[#F28C18] bg-[#F28C18] text-white shadow-xs"
                      : "border-[#2C251D]/15 bg-[#FCFBF8] text-[#4A4135] hover:border-[#F28C18]/50"
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-[#2C251D]">
            Availability
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20"
          >
            <option value="">Select availability</option>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-[#2C251D]">
            Programs Completed / Additional Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share if you have completed Inner Engineering or have prior volunteering experience..."
            className="mt-1.5 w-full rounded-xl border border-[#2C251D]/15 bg-[#FCFBF8] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#F28C18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C18]/20"
          />
        </div>
      </div>

      <div className="mt-7">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#F28C18] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Expression of Interest"}
        </button>
      </div>
    </form>
  );
}