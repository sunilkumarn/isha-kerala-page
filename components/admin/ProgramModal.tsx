"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/admin/Button";
import Modal from "@/components/admin/Modal";

type Program = {
  id: string | number;
  name: string;
  sub_text?: string | null;
  parent_id?: string | number | null;
  image_url?: string | null;
  colour?: string | null;
};

type ProgramModalProps = {
  open: boolean;
  programs: Program[];
  initialProgram?: Program | null;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    subText: string;
    parentId: string | number | null;
    file: File | null;
  }) => void;
};

export default function ProgramModal({
  open,
  programs,
  initialProgram,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: ProgramModalProps) {
  const [name, setName] = useState("");
  const [subText, setSubText] = useState("");
  const [parentId, setParentId] = useState<string | number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const sortedPrograms = useMemo(() => {
    const sorted = [...programs].sort((a, b) => a.name.localeCompare(b.name));
    if (!initialProgram) return sorted;
    return sorted.filter((program) => program.id !== initialProgram.id);
  }, [programs, initialProgram]);

  useEffect(() => {
    if (open) {
      setName(initialProgram?.name ?? "");
      setSubText(initialProgram?.sub_text ?? "");
      setParentId(initialProgram?.parent_id ?? null);
      setFile(null);
    }
  }, [open, initialProgram]);

  const handleSave = () => {
    onSave({ name: name.trim(), subText: subText.trim(), parentId, file });
  };

  return (
    <Modal
      open={open}
      title={initialProgram ? "Edit Program" : "Create New Program"}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Program Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g., Weekend Yoga Retreat"
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Sub text (optional)
          </label>
          <textarea
            value={subText}
            onChange={(event) => setSubText(event.target.value)}
            maxLength={160}
            placeholder="Short description shown on program card"
            rows={3}
            className="w-full resize-none rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B] outline-none focus:border-[#8C7A5B]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Parent Program (Optional)
          </label>
          <select
            value={parentId ?? ""}
            onChange={(event) =>
              setParentId(event.target.value ? event.target.value : null)
            }
            className="w-full rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-3 py-2 text-sm text-[#2B2B2B]"
          >
            <option value="">No Parent</option>
            {sortedPrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#2B2B2B]">
            Program Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[#8C7A5B] file:mr-4 file:rounded-md file:border-0 file:bg-[#EAE6DC] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#2B2B2B] hover:file:bg-[#E2DED3]"
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
              : initialProgram
                ? "Update Program"
                : "Save Program"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

