"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { generatePastelColor } from "@/lib/colors";
import Button from "@/components/admin/Button";
import ProgramList, { buildProgramRows } from "@/components/admin/ProgramList";
import Pagination from "@/components/admin/Pagination";
import ProgramModal from "@/components/admin/ProgramModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  image_url?: string | null;
  colour?: string | null;
};

const PAGE_SIZE = 20;

function ProgramsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, Math.floor(Number(pageParam ?? "1") || 1));

  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Program | null>(null);

  const totalCount = useMemo(() => buildProgramRows(programs).length, [programs]);
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

  const fetchPrograms = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("programs").select("*").order("name");

    if (error) {
      setErrorMessage(error.message);
      setPrograms([]);
    } else {
      setErrorMessage(null);
      setPrograms(data ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!searchParams.get("create")) return;

    setEditingProgram(null);
    setIsModalOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProgram(null);
    setErrorMessage(null);
  };

  const handleSaveProgram = async (payload: {
    name: string;
    parentId: string | number | null;
    file: File | null;
  }) => {
    if (!payload.name) {
      setErrorMessage("Please enter a program name.");
      return;
    }

    setIsSaving(true);

    let imageUrl: string | null = null;

    // Upload the optional image before inserting/updating the program.
    if (payload.file) {
      const filePath = `programs/${Date.now()}-${payload.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("program_images")
        .upload(filePath, payload.file);

      if (uploadError) {
        setErrorMessage(uploadError.message);
        setIsSaving(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("program_images")
        .getPublicUrl(filePath);

      imageUrl = publicData.publicUrl ?? null;
    }

    const basePayload: {
      name: string;
      parent_id: string | number | null;
      slug: string;
      image_url?: string | null;
      colour?: string | null;
    } = {
      name: payload.name,
      parent_id: payload.parentId,
      slug: slugify(payload.name),
    };

    if (imageUrl) {
      basePayload.image_url = imageUrl;
    }

    if (!editingProgram) {
      basePayload.colour = generatePastelColor();
    }

    const { error } = editingProgram
      ? await supabase
          .from("programs")
          .update(basePayload)
          .eq("id", editingProgram.id)
      : await supabase.from("programs").insert({
          ...basePayload,
          image_url: imageUrl ?? null,
        });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setEditingProgram(null);
    await fetchPrograms();
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (program: Program) => {
    setPendingDelete(program);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { error } = await supabase
      .from("programs")
      .delete()
      .eq("id", pendingDelete.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setConfirmOpen(false);
    setPendingDelete(null);
    await fetchPrograms();
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#2B2B2B]">Programs</h1>
          <p className="mt-1 text-sm text-[#8C7A5B]">
            Organize programs with optional parent groupings and images.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingProgram(null);
            setIsModalOpen(true);
          }}
        >
          + Add Program
        </Button>
      </header>

      <section className="rounded-lg border border-[#E2DED3] bg-white">
        <div className="border-b border-[#E2DED3] px-6 py-4 text-sm font-medium text-[#8C7A5B]">
          Program List
        </div>
        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-[#8C7A5B]">Loading programs...</p>
          ) : programs.length === 0 ? (
            <p className="text-sm text-[#8C7A5B]">
              No programs yet. Add the first one.
            </p>
          ) : (
            <ProgramList
              programs={programs}
              page={page}
              pageSize={PAGE_SIZE}
              onEdit={handleEditProgram}
              onDelete={handleRequestDelete}
            />
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

      <ProgramModal
        open={isModalOpen}
        programs={programs}
        initialProgram={editingProgram}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onClose={handleCloseModal}
        onSave={handleSaveProgram}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Program"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This action cannot be undone.`
            : "Delete this program? This action cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[#8C7A5B]">Loading programs...</p>}
    >
      <ProgramsPageInner />
    </Suspense>
  );
}

