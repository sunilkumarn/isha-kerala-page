"use client";

import Button from "@/components/admin/Button";
import Modal from "@/components/admin/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isConfirming = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="space-y-5">
        <p className="text-sm text-[#8C7A5B]">{message}</p>
        {errorMessage ? (
          <p className="text-xs text-red-600">{errorMessage}</p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

