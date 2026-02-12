import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import PublicFooter from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

type Contact = {
  id: string | number;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  // Supabase can return joined tables as arrays depending on relationship inference.
  cities?: { name: string }[] | null;
};

export const metadata = {
  title: "Connect with a Volunteer | Isha Kerala",
};

function toTelHref(phone?: string | null) {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return `tel:${trimmed}`;
}

function toMailtoHref(email?: string | null) {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return `mailto:${trimmed}`;
}

function toWhatsAppHref(whatsapp?: string | null) {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function groupContactsByCity(contacts: Contact[]) {
  const grouped = new Map<string, Contact[]>();

  for (const contact of contacts) {
    const cityName = contact.cities?.[0]?.name?.trim() || "Other";
    const existing = grouped.get(cityName);
    if (existing) existing.push(contact);
    else grouped.set(cityName, [contact]);
  }

  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default async function ContactPage() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, email, phone, whatsapp, cities(name)")
    .order("name");

  const contacts: Contact[] = data ?? [];
  const grouped = groupContactsByCity(contacts);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F2] text-slate-900">
      <main className="flex-1">
        <section className="bg-[#1F2A63]">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h1 className="text-4xl tracking-tight text-white sm:text-5xl">
              Connect with a Volunteer
            </h1>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
            <p className="mx-auto mt-6 max-w-2xl text-sm text-white/80 sm:text-base">
              Reach out for guidance in choosing the right program and location.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Please contact{" "}
                  <a
                    href="mailto:kerala@ishayoga.org"
                    className="font-semibold text-[#1F2A63] underline decoration-[#F28C18]/70 underline-offset-4 transition hover:text-[#141C45] hover:decoration-[#F28C18] focus:outline-none focus:ring-2 focus:ring-[#F28C18]/40 focus:ring-offset-2"
                  >
                    kerala@ishayoga.org
                  </a>{" "}
                  for any assistance.
                </h2>
              </div>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/40 focus:ring-offset-2"
              >
                Back to Programs
              </Link>
            </div>
          </div>

          {/* {error ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
              Failed to load contacts: {error.message}
            </div>
          ) : contacts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-black/5 bg-white p-10 text-center">
              <h3 className="text-xl font-medium">No contacts available yet</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                Please check back later. We’ll publish volunteer contacts here as
                soon as they’re available.
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-10">
              {grouped.map(([cityName, cityContacts]) => (
                <section key={cityName} aria-label={`${cityName} contacts`}>
                  <h3 className="text-base font-semibold text-[#1F2A63]">
                    {cityName}
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cityContacts.map((contact) => {
                      const telHref = toTelHref(contact.phone);
                      const mailHref = toMailtoHref(contact.email);
                      const waHref = toWhatsAppHref(contact.whatsapp);

                      return (
                        <article
                          key={String(contact.id)}
                          className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
                        >
                          <div className="text-lg font-semibold text-slate-900">
                            {contact.name}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            {waHref ? (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full bg-[#F28C18] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/50 focus:ring-offset-2"
                              >
                                WhatsApp
                              </a>
                            ) : null}

                            {telHref ? (
                              <a
                                href={telHref}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/40 focus:ring-offset-2"
                              >
                                Call
                              </a>
                            ) : null}

                            {mailHref ? (
                              <a
                                href={mailHref}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#F28C18]/40 focus:ring-offset-2"
                              >
                                Email
                              </a>
                            ) : null}
                          </div>

                          {!waHref && !telHref && !mailHref ? (
                            <div className="mt-4 text-sm text-slate-600">
                              Contact details not provided.
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )} */}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}


