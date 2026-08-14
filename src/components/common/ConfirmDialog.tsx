"use client";

type ConfirmDialogProps = {
  confirmLabel: string;
  confirmTone?: "danger" | "primary";
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  confirmLabel,
  confirmTone = "danger",
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-5">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="확인 다이얼로그 닫기"
      />

      <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl">
        <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-3 text-sm font-bold text-white ${
              confirmTone === "primary" ? "bg-zinc-950" : "bg-red-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
