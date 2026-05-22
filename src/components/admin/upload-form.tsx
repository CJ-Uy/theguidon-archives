"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pdfPagesToWebp, imageFileToWebp } from "@/lib/pdf-to-webp";
import "./upload-form.css";

const CATEGORY_OPTIONS: { slug: string; label: string }[] = [
  { slug: "press-issue", label: "Press Issues" },
  { slug: "graduation-magazine", label: "Graduation Magazines" },
  { slug: "freshmanual", label: "Freshmanuals" },
  { slug: "uaap-primer", label: "UAAP Primers" },
  { slug: "other", label: "Others" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

async function uploadBlob(url: string, blob: Blob): Promise<void> {
  const r = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type || "application/octet-stream" },
  });
  if (!r.ok) throw new Error(`Upload failed ${r.status}: ${await r.text()}`);
}

async function uploadWithConcurrency<T>(
  items: T[],
  handler: (item: T, idx: number) => Promise<void>,
  limit = 5,
): Promise<void> {
  let cursor = 0;
  const workers: Promise<void>[] = [];
  for (let w = 0; w < limit; w++) {
    workers.push((async () => {
      while (cursor < items.length) {
        const idx = cursor++;
        await handler(items[idx], idx);
      }
    })());
  }
  await Promise.all(workers);
}

export default function AdminUploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [datePublished, setDatePublished] = useState("");
  const [description, setDescription] = useState("");
  const [volumeNum, setVolumeNum] = useState("");
  const [issueNum, setIssueNum] = useState("");
  const [isLegacy, setIsLegacy] = useState(false);
  const [unsureDate, setUnsureDate] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [issueContentJson, setIssueContentJson] = useState("[]");
  const [contributorsJson, setContributorsJson] = useState("[]");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = useMemo(
    () => (slugTouched ? slug : slugify(title)),
    [title, slug, slugTouched],
  );

  const canSubmit =
    title.trim().length > 0 &&
    effectiveSlug.length > 0 &&
    datePublished.length > 0 &&
    (isLegacy ? coverFile != null : pdfFile != null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let pageBlobs: Blob[] = [];
      let numPages = 0;
      if (!isLegacy && pdfFile) {
        setProgress({ stage: "Converting PDF pages to WebP", done: 0, total: 1 });
        const conv = await pdfPagesToWebp(pdfFile, (done, total) =>
          setProgress({ stage: "Converting PDF pages to WebP", done, total }),
        );
        pageBlobs = conv.blobs;
        numPages = conv.numPages;
      }

      let coverBlob: Blob | null = null;
      if (coverFile) {
        setProgress({ stage: "Converting cover image", done: 0, total: 1 });
        coverBlob = await imageFileToWebp(coverFile);
      }

      setProgress({ stage: "Creating database row", done: 0, total: 1 });
      const insertResp = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: effectiveSlug,
          title,
          datePublished: new Date(datePublished).toISOString(),
          description: description || undefined,
          isLegacy,
          unsureDate,
          volumeNum: volumeNum ? parseInt(volumeNum, 10) : null,
          issueNum: issueNum ? parseInt(issueNum, 10) : null,
          numPages,
          categorySlugs: selectedCategories,
          issueContent: issueContentJson || "[]",
          contributors: contributorsJson || "[]",
        }),
      });
      if (!insertResp.ok) throw new Error(`Insert failed: ${await insertResp.text()}`);
      const { id } = (await insertResp.json()) as { id: number };

      setProgress({ stage: "Requesting upload URLs", done: 0, total: 1 });
      const urlsResp = await fetch(`/api/admin/issues/${id}/upload-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf: !isLegacy && pdfFile != null,
          cover: coverBlob != null,
          pages: pageBlobs.length,
        }),
      });
      if (!urlsResp.ok) throw new Error(`URLs failed: ${await urlsResp.text()}`);
      const urls = (await urlsResp.json()) as { pdf?: string; cover?: string; pages?: string[] };

      const totalAssets = (urls.pdf ? 1 : 0) + (urls.cover ? 1 : 0) + (urls.pages?.length ?? 0);
      let doneAssets = 0;

      if (urls.pdf && pdfFile) {
        await uploadBlob(urls.pdf, pdfFile);
        doneAssets++;
        setProgress({ stage: "Uploading PDF", done: doneAssets, total: totalAssets });
      }
      if (urls.cover && coverBlob) {
        await uploadBlob(urls.cover, coverBlob);
        doneAssets++;
        setProgress({ stage: "Uploading cover", done: doneAssets, total: totalAssets });
      }
      if (urls.pages && pageBlobs.length > 0) {
        await uploadWithConcurrency(
          urls.pages.map((u, i) => ({ u, blob: pageBlobs[i] })),
          async (item) => {
            await uploadBlob(item.u, item.blob);
            doneAssets++;
            setProgress({ stage: "Uploading pages", done: doneAssets, total: totalAssets });
          },
          5,
        );
      }

      setProgress({ stage: "Finalizing", done: 0, total: 1 });
      const finalizeResp = await fetch(`/api/admin/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hasPdf: urls.pdf != null,
          hasPages: pageBlobs.length > 0,
          coverUploaded: urls.cover != null,
          numPages,
          status: "ready",
        }),
      });
      if (!finalizeResp.ok) throw new Error(`Finalize failed: ${await finalizeResp.text()}`);

      router.push(`/issue/${effectiveSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <form className="upload-form" onSubmit={onSubmit}>
      <h1>Upload Issue</h1>

      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
      </label>

      <label>
        Slug (URL identifier; auto-suggested from title)
        <input
          type="text"
          value={effectiveSlug}
          onChange={(e) => { setSlug(e.currentTarget.value); setSlugTouched(true); }}
          pattern="[a-z0-9-]+"
          required
        />
      </label>

      <div className="row">
        <label>
          Date published
          <input type="date" value={datePublished} onChange={(e) => setDatePublished(e.currentTarget.value)} required />
        </label>
        <label>
          <input type="checkbox" checked={unsureDate} onChange={(e) => setUnsureDate(e.currentTarget.checked)} /> Unsure date
        </label>
      </div>

      <div className="row">
        <label>
          Volume #
          <input type="number" value={volumeNum} onChange={(e) => setVolumeNum(e.currentTarget.value)} />
        </label>
        <label>
          Issue #
          <input type="number" value={issueNum} onChange={(e) => setIssueNum(e.currentTarget.value)} />
        </label>
      </div>

      <label>
        Description
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
      </label>

      <label>
        <input type="checkbox" checked={isLegacy} onChange={(e) => setIsLegacy(e.currentTarget.checked)} /> Is legacy
      </label>

      <fieldset>
        <legend>Categories</legend>
        {CATEGORY_OPTIONS.map((c) => (
          <label key={c.slug} style={{ display: "inline-flex", marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(c.slug)}
              onChange={(e) => {
                const next = e.currentTarget.checked
                  ? [...selectedCategories, c.slug]
                  : selectedCategories.filter((s) => s !== c.slug);
                setSelectedCategories(next);
              }}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      {!isLegacy && (
        <label>
          PDF file
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.currentTarget.files?.[0] ?? null)}
          />
        </label>
      )}
      <label>
        Cover image (optional for non-legacy; required for legacy)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setCoverFile(e.currentTarget.files?.[0] ?? null)}
        />
      </label>

      <label>
        Issue content (JSON; paste from parse-content.py output)
        <textarea rows={4} value={issueContentJson} onChange={(e) => setIssueContentJson(e.currentTarget.value)} />
      </label>

      <label>
        Contributors (JSON; paste from parse-contributors.py output)
        <textarea rows={4} value={contributorsJson} onChange={(e) => setContributorsJson(e.currentTarget.value)} />
      </label>

      {progress && (
        <div className="progress">
          <p>{progress.stage} — {progress.done}/{progress.total}</p>
          <div className="progress-bar"><div style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }} /></div>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <button className="submit" type="submit" disabled={submitting || !canSubmit}>
        {submitting ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
