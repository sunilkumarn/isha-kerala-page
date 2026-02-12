"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2B2B]/30 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-[#E2DED3] bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium text-[#2B2B2B]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[#8C7A5B] hover:text-[#2B2B2B]"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="-mr-1 mt-6 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

