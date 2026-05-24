"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Image as ImageIcon, Layers, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./confirm-dialog";

export type DeleteAssetSummary = {
  hasPdf?: boolean;
  coverUploaded?: boolean;
  hasPages?: boolean;
  numPages?: number;
};

export default function IssueDeleteButton({
  id,
  title,
  slug,
  assets,
}: {
  id: number;
  title: string;
  slug?: string;
  assets?: DeleteAssetSummary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performDelete() {
    setError(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/issues/${id}`, { method: "DELETE" });
      if (!r.ok) {
        setError(`Delete failed: ${await r.text()}`);
        setBusy(false);
        return;
      }
      setOpen(false);
      setBusy(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const assetCount =
    (assets?.hasPdf ? 1 : 0) +
    (assets?.coverUploaded ? 1 : 0) +
    (assets?.hasPages ? assets?.numPages ?? 0 : 0);

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label="Delete entry"
        className="btn-icon-danger"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ConfirmDialog
        open={open}
        subtitle={`Retiring entry · №${id}`}
        title={
          <>
            <span className="italic font-light text-(--muted-fg)">Retire </span>
            <span>{title}</span>
            <span className="italic font-light text-(--muted-fg)"> from the archive?</span>
          </>
        }
        confirmLabel={busy ? "Retiring…" : "Yes, retire entry"}
        cancelLabel="Keep it"
        confirmTone="danger"
        busy={busy}
        onCancel={() => !busy && setOpen(false)}
        onConfirm={performDelete}
        body={
          <div className="space-y-4">
            <p className="font-serif italic text-(--ink-2)">
              This action is irreversible. The database row will be expunged and the following
              objects in R2 will be permanently deleted.
            </p>

            {slug && (
              <div className="font-mono-tab text-[0.75rem] text-(--muted-fg)">
                slug: <span className="text-(--ink-2)">{slug}</span>
              </div>
            )}

            <ul className="divide-y divide-(--rule) rounded-[2px] border border-(--rule) bg-(--paper-2)">
              <AssetRow
                icon={<FileText className="h-3.5 w-3.5" />}
                label="PDF"
                meta={`pdfs/${id}.pdf`}
                present={!!assets?.hasPdf}
              />
              <AssetRow
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                label="Cover image"
                meta={`covers/${id}.webp`}
                present={!!assets?.coverUploaded}
              />
              <AssetRow
                icon={<Layers className="h-3.5 w-3.5" />}
                label={
                  assets?.hasPages
                    ? `${assets.numPages ?? 0} page image${assets.numPages === 1 ? "" : "s"}`
                    : "Page images"
                }
                meta={`pages/${id}/…`}
                present={!!assets?.hasPages}
              />
            </ul>

            <div className="flex items-baseline justify-between border-t border-(--rule) pt-3 text-[0.75rem]">
              <span className="smallcaps text-(--muted-fg)">Total objects</span>
              <span className="font-mono-tab text-(--ink-2)">{assetCount}</span>
            </div>

            {error && (
              <div className="rounded-[2px] border border-(--danger)/50 bg-(--danger-soft) px-3 py-2 text-[0.75rem] text-(--danger)">
                {error}
              </div>
            )}
          </div>
        }
      />
    </>
  );
}

function AssetRow({
  icon,
  label,
  meta,
  present,
}: {
  icon: React.ReactNode;
  label: string;
  meta: string;
  present: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between px-3 py-2 ${
        present ? "text-(--ink-2)" : "text-(--muted-fg) opacity-55"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span>{icon}</span>
        <span className="text-[0.8125rem]">{label}</span>
      </div>
      <span className="font-mono-tab text-[0.6875rem]">
        {present ? meta : "not present"}
      </span>
    </li>
  );
}

