"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export default function IssueDeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `Retire "${title}" from the archive?\n\nThis removes the database row and every R2 object (PDF, cover, page WebPs). The action is irreversible.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/issues/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const text = await r.text();
        window.alert(`Delete failed: ${text}`);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (err) {
      window.alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      aria-label="Delete entry"
      className="btn-icon-danger"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
