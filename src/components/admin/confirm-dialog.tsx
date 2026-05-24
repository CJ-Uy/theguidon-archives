"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

export type ConfirmDialogProps = {
  open: boolean;
  title: React.ReactNode;
  subtitle?: string;
  body?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  subtitle,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "primary",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const confirmClass =
    confirmTone === "danger"
      ? "bg-[var(--danger)] text-white hover:bg-[#931b14]"
      : "bg-[var(--ink-2)] text-white hover:bg-[var(--ink)]";

  return createPortal(
    <div
      className="admin-theme fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 cursor-default bg-[#0f265c]/55 backdrop-blur-[2px] animate-in fade-in duration-150"
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md border border-(--rule-strong) bg-white shadow-[0_30px_60px_-15px_rgba(15,38,92,0.35)] animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent rule */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background:
              confirmTone === "danger"
                ? "var(--danger)"
                : "linear-gradient(90deg, var(--ink-2), var(--accent-blue))",
          }}
        />

        <button
          type="button"
          onClick={busy ? undefined : onCancel}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-sm text-(--muted-fg) transition-colors hover:bg-(--paper-2) hover:text-(--ink)"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-7 pb-2 pt-7">
          {subtitle && (
            <div className="smallcaps text-(--muted-fg) mb-2">{subtitle}</div>
          )}
          <h2
            id="confirm-title"
            className="font-serif text-[1.65rem] leading-[1.05] tracking-[-0.01em] text-(--ink)"
          >
            {title}
          </h2>
        </div>

        {body && (
          <div className="px-7 pb-6 text-sm text-(--text) leading-relaxed">
            {body}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-(--rule) bg-(--paper-2) px-5 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-[2px] px-3 py-2 text-[0.8125rem] text-(--ink-2) transition-colors hover:bg-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-[2px] px-3.5 py-2 text-[0.8125rem] tracking-[0.02em] transition-colors disabled:opacity-60 ${confirmClass}`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
