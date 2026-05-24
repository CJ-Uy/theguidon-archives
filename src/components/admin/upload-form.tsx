"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pdfPagesToWebp, imageFileToWebp } from "@/lib/pdf-to-webp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, FileText, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";

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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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

function FileDrop({
  file,
  accept,
  label,
  hint,
  icon,
  onChange,
}: {
  file: File | null;
  accept: string;
  label: React.ReactNode;
  hint: string;
  icon: React.ReactNode;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-muted-foreground">{icon}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Remove file">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center transition-colors hover:bg-muted/40">
          <div className="text-muted-foreground">{icon}</div>
          <div className="text-sm">
            <span className="font-medium text-primary">Click to upload</span>{" "}
            <span className="text-muted-foreground">or drag and drop</span>
          </div>
          <div className="text-xs text-muted-foreground">{hint}</div>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => onChange(e.currentTarget.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
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

  const slugValid = /^[a-z0-9-]+$/.test(effectiveSlug);
  const canSubmit =
    title.trim().length > 0 &&
    effectiveSlug.length > 0 &&
    slugValid &&
    datePublished.length > 0 &&
    (isLegacy ? coverFile != null : pdfFile != null);

  const progressPct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;

  function toggleCategory(slug: string, checked: boolean) {
    setSelectedCategories((prev) =>
      checked ? [...prev, slug] : prev.filter((s) => s !== slug),
    );
  }

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
        setProgress({ stage: "Uploading PDF", done: doneAssets, total: totalAssets });
        await uploadBlob(urls.pdf, pdfFile);
        doneAssets++;
        setProgress({ stage: "Uploading PDF", done: doneAssets, total: totalAssets });
      }
      if (urls.cover && coverBlob) {
        setProgress({ stage: "Uploading cover", done: doneAssets, total: totalAssets });
        await uploadBlob(urls.cover, coverBlob);
        doneAssets++;
        setProgress({ stage: "Uploading cover", done: doneAssets, total: totalAssets });
      }
      if (urls.pages && pageBlobs.length > 0) {
        setProgress({ stage: "Uploading pages", done: doneAssets, total: totalAssets });
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
    <div className="admin-page max-w-3xl">
      <div className="admin-in admin-in-1 mb-8">
        <div className="smallcaps text-(--muted-fg) mb-3">Composition · new entry</div>
        <h1 className="font-serif text-[3rem] leading-[0.95] tracking-[-0.015em]">
          Compose an Issue
        </h1>
        <p className="font-serif italic mt-3 text-(--ink-2) max-w-xl">
          Lodge a new release into the archive. PDF pages are quietly converted to WebP in the
          browser before they travel to the press.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Issue details</CardTitle>
            <CardDescription>Title and the URL slug readers will see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                placeholder="e.g. Volume XCII, Issue 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlug(e.currentTarget.value);
                  setSlugTouched(true);
                }}
                placeholder="auto-generated-from-title"
                aria-invalid={!slugValid}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Auto-suggested from the title.
                {!slugValid && (
                  <span className="ml-1 text-destructive">Invalid characters.</span>
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date published <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={datePublished}
                  onChange={(e) => setDatePublished(e.currentTarget.value)}
                  required
                />
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="unsure-date"
                    checked={unsureDate}
                    onCheckedChange={(v) => setUnsureDate(v === true)}
                  />
                  <Label htmlFor="unsure-date" className="font-normal text-muted-foreground">
                    Unsure about the exact date
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vol">Volume #</Label>
                  <Input
                    id="vol"
                    type="number"
                    value={volumeNum}
                    onChange={(e) => setVolumeNum(e.currentTarget.value)}
                    placeholder="—"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iss">Issue #</Label>
                  <Input
                    id="iss"
                    type="number"
                    value={issueNum}
                    onChange={(e) => setIssueNum(e.currentTarget.value)}
                    placeholder="—"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                placeholder="Optional short blurb about this issue."
                className="font-sans"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
            <CardDescription>
              Pick zero or more categories. &ldquo;Legacy&rdquo; is a separate flag — older issues with no PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORY_OPTIONS.map((c) => {
                const checked = selectedCategories.includes(c.slug);
                return (
                  <label
                    key={c.slug}
                    htmlFor={`cat-${c.slug}`}
                    className="flex cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2.5 hover:bg-accent/50"
                  >
                    <Checkbox
                      id={`cat-${c.slug}`}
                      checked={checked}
                      onCheckedChange={(v) => toggleCategory(c.slug, v === true)}
                    />
                    <span className="text-sm font-medium">{c.label}</span>
                  </label>
                );
              })}
            </div>

            <Separator />

            <div className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-3">
              <Checkbox
                id="is-legacy"
                checked={isLegacy}
                onCheckedChange={(v) => setIsLegacy(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="is-legacy" className="cursor-pointer">
                  Mark as legacy
                </Label>
                <p className="text-xs text-muted-foreground">
                  Legacy issues have no PDF — only a cover image. Skips PDF-to-WebP conversion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              {isLegacy
                ? "Legacy mode: upload a cover image only."
                : "Upload the PDF. Pages convert to WebP in your browser before upload. Cover is optional."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!isLegacy && (
              <FileDrop
                file={pdfFile}
                accept="application/pdf"
                label={
                  <span>
                    PDF file <span className="text-destructive">*</span>
                  </span> as unknown as string
                }
                hint="PDF up to ~100 MB"
                icon={<FileText className="h-6 w-6" />}
                onChange={setPdfFile}
              />
            )}
            <FileDrop
              file={coverFile}
              accept="image/png,image/jpeg,image/webp"
              label={
                <span>
                  Cover image{" "}
                  {isLegacy ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  )}
                </span>
              }
              hint="PNG, JPG, or WebP"
              icon={<ImageIcon className="h-6 w-6" />}
              onChange={setCoverFile}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Structured content</CardTitle>
            <CardDescription>
              Paste JSON from the <Badge variant="outline">content_script</Badge> tools. Defaults to <code>[]</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="content-json">Issue content</Label>
              <Textarea
                id="content-json"
                rows={5}
                value={issueContentJson}
                onChange={(e) => setIssueContentJson(e.currentTarget.value)}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Output of <code>python content_script/parse-content.py</code>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrib-json">Contributors</Label>
              <Textarea
                id="contrib-json"
                rows={5}
                value={contributorsJson}
                onChange={(e) => setContributorsJson(e.currentTarget.value)}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Output of <code>python content_script/parse-contributors.py</code>.
              </p>
            </div>
          </CardContent>
        </Card>

        {progress && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress.stage}
                </div>
                <div className="text-muted-foreground tabular-nums">
                  {progress.done} / {progress.total}
                </div>
              </div>
              <Progress value={progressPct} />
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription className="break-all">{error}</AlertDescription>
          </Alert>
        )}

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
          <p className="mr-auto text-xs text-muted-foreground">
            {canSubmit
              ? "Ready to upload."
              : "Fill in title, slug, date, and the required file."}
          </p>
          <Button type="submit" disabled={submitting || !canSubmit} size="lg">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload issue
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
