"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";
import { adminDeleteById } from "@/lib/admin-delete";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import ContactModal from "@/components/admin/ContactModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type City = {
  id: string | number;
  name: string;
};

type Contact = {
  id: string | number;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city_id: string | number | null;
  cities?: { name: string } | null;
};

const PAGE_SIZE = 20;

function ContactsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Math.floor(Number(pageParam ?? "1") || 1));

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
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

  const fetchContacts = async () => {
    setIsLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("contacts")
      .select("*, cities(name)", { count: "exact" })
      .order("name")
      .range(from, to);

    if (error) {
      setErrorMessage(error.message);
      setContacts([]);
      setTotalCount(0);
    } else {
      setErrorMessage(null);
      setContacts(data ?? []);
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
    fetchContacts();
  }, [page]);

  useEffect(() => {
    fetchCities();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setErrorMessage(null);
  };

  const handleSaveContact = async (payload: {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    cityId: string | number | null;
  }) => {
    if (!payload.name || !payload.email || !payload.phone || !payload.cityId) {
      setErrorMessage("Please complete the required contact fields.");
      return;
    }

    setIsSaving(true);

    const contactPayload = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      whatsapp: payload.whatsapp || null,
      city_id: payload.cityId,
    };

    const { error } = editingContact
      ? await supabase
          .from("contacts")
          .update(contactPayload)
          .eq("id", editingContact.id)
      : await supabase.from("contacts").insert(contactPayload);

    if (error) {
      setErrorMessage(
        getSupabaseErrorMessage(error, {
          uniqueViolationMessage: editingContact ? undefined : "Contact already exists",
        })
      );
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setEditingContact(null);
    await fetchContacts();
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (contact: Contact) => {
    setPendingDelete(contact);
    setDeleteErrorMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await adminDeleteById("contacts", pendingDelete.id);
      setConfirmOpen(false);
      setPendingDelete(null);
      await fetchContacts();
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
          <h1 className="text-2xl font-medium text-[#2B2B2B]">Contacts</h1>
          <p className="mt-1 text-sm text-[#8C7A5B]">
            Keep local contact people organized by city.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingContact(null);
            setIsModalOpen(true);
          }}
        >
          + Add Contact
        </Button>
      </header>

      <section className="rounded-lg border border-[#E2DED3] bg-white">
        <div className="border-b border-[#E2DED3] px-6 py-4 text-sm font-medium text-[#8C7A5B]">
          Contact List
        </div>
        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-[#8C7A5B]">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-[#8C7A5B]">
              No contacts yet. Add the first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#E2DED3] text-left text-xs uppercase tracking-[0.2em] text-[#8C7A5B]">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">City</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Phone</th>
                    <th className="pb-3 pr-4 font-medium">WhatsApp</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DED3]">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="text-[#2B2B2B]">
                      <td className="py-4 pr-4 font-medium">
                        {contact.name}
                      </td>
                      <td className="py-4 pr-4 text-[#8C7A5B]">
                        {contact.cities?.name ?? "—"}
                      </td>
                      <td className="py-4 pr-4 text-[#8C7A5B]">
                        {contact.email || "—"}
                      </td>
                      <td className="py-4 pr-4 text-[#8C7A5B]">
                        {contact.phone || "—"}
                      </td>
                      <td className="py-4 pr-4 text-[#8C7A5B]">
                        {contact.whatsapp || "—"}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleEditContact(contact)}
                            className="text-[#6B5E4A] hover:text-[#2B2B2B]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(contact)}
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

      <ContactModal
        open={isModalOpen}
        cities={cities}
        isSaving={isSaving}
        errorMessage={errorMessage}
        initialContact={editingContact}
        onClose={handleCloseModal}
        onSave={handleSaveContact}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Contact"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This action cannot be undone.`
            : "Delete this contact? This action cannot be undone."
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

export default function ContactsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[#8C7A5B]">Loading contacts...</p>}
    >
      <ContactsPageInner />
    </Suspense>
  );
}
