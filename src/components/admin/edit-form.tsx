"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";

const CATEGORY_OPTIONS: { slug: string; label: string }[] = [
  { slug: "press-issue", label: "Press Issues" },
  { slug: "graduation-magazine", label: "Graduation Magazines" },
  { slug: "freshmanual", label: "Freshmanuals" },
  { slug: "uaap-primer", label: "UAAP Primers" },
  { slug: "other", label: "Others" },
];

type IssueData = {
  id: number;
  slug: string;
  title: string;
  datePublished: string;
  description: string | null;
  isLegacy: boolean;
  unsureDate: boolean;
  volumeNum: number | null;
  issueNum: number | null;
  status: "draft" | "processing" | "ready";
  hasPdf: boolean;
  hasPages: boolean;
  coverUploaded: boolean;
  numPages: number;
  issueContent: string;
  contributors: string;
  categorySlugs: string[];
};

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditIssueForm({ issue }: { issue: IssueData }) {
  const router = useRouter();

  const [title, setTitle] = useState(issue.title);
  const [slug, setSlug] = useState(issue.slug);
  const [datePublished, setDatePublished] = useState(toDateInput(issue.datePublished));
  const [description, setDescription] = useState(issue.description ?? "");
  const [volumeNum, setVolumeNum] = useState(issue.volumeNum?.toString() ?? "");
  const [issueNum, setIssueNum] = useState(issue.issueNum?.toString() ?? "");
  const [isLegacy, setIsLegacy] = useState(issue.isLegacy);
  const [unsureDate, setUnsureDate] = useState(issue.unsureDate);
  const [status, setStatus] = useState<"draft" | "processing" | "ready">(issue.status);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(issue.categorySlugs);
  const [issueContentJson, setIssueContentJson] = useState(issue.issueContent);
  const [contributorsJson, setContributorsJson] = useState(issue.contributors);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugValid = /^[a-z0-9-]+$/.test(slug);
  const canSubmit = title.trim().length > 0 && slug.length > 0 && slugValid && datePublished.length > 0;

  function toggleCategory(s: string, checked: boolean) {
    setSelectedCategories((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          datePublished: new Date(datePublished).toISOString(),
          description: description || null,
          isLegacy,
          unsureDate,
          volumeNum: volumeNum ? parseInt(volumeNum, 10) : null,
          issueNum: issueNum ? parseInt(issueNum, 10) : null,
          status,
          categorySlugs: selectedCategories,
          issueContent: issueContentJson || "[]",
          contributors: contributorsJson || "[]",
        }),
      });
      if (!r.ok) throw new Error(`Save failed: ${await r.text()}`);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div className="admin-page max-w-3xl">
      <div className="admin-in admin-in-1 mb-8">
        <Link
          href="/admin"
          className="btn-ghost -ml-2 inline-flex mb-3 smallcaps"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to index
        </Link>
        <div className="smallcaps text-(--muted-fg) mb-2">Editing entry · №{issue.id}</div>
        <h1 className="font-serif text-[2.75rem] leading-[0.95] tracking-[-0.015em]">
          {issue.title}
        </h1>
        <p className="font-serif italic mt-3 text-(--ink-2)">
          Refine the metadata for this volume. File uploads are not editable here.
        </p>
      </div>

      <form onSubmit={onSubmit} className="admin-in admin-in-2 space-y-0">
        <Card className="rounded-none border-(--rule)">
          <CardHeader className="border-b border-(--rule)">
            <div className="smallcaps text-(--muted-fg) mb-1">Article I</div>
            <CardTitle className="font-serif text-2xl font-medium">Issue details</CardTitle>
            <CardDescription className="font-serif italic">Title, slug, and date of publication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.currentTarget.value)}
                aria-invalid={!slugValid}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
                {!slugValid && <span className="ml-1 text-destructive">Invalid characters.</span>}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date published <span className="text-destructive">*</span></Label>
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
                  <Input id="vol" type="number" value={volumeNum} onChange={(e) => setVolumeNum(e.currentTarget.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iss">Issue #</Label>
                  <Input id="iss" type="number" value={issueNum} onChange={(e) => setIssueNum(e.currentTarget.value)} />
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
                className="font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(["draft", "processing", "ready"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors ${
                      status === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-t-0 border-(--rule)">
          <CardHeader className="border-b border-(--rule)">
            <div className="smallcaps text-(--muted-fg) mb-1">Article II</div>
            <CardTitle className="font-serif text-2xl font-medium">Categorization</CardTitle>
            <CardDescription className="font-serif italic">Where this entry sits in the catalogue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
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
                  Legacy issues have no PDF — only a cover image.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-t-0 border-(--rule)">
          <CardHeader className="border-b border-(--rule)">
            <div className="smallcaps text-(--muted-fg) mb-1">Article III</div>
            <CardTitle className="font-serif text-2xl font-medium">Assets</CardTitle>
            <CardDescription className="font-serif italic">Read-only summary. Re-uploads are not supported here.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant={issue.hasPdf ? "default" : "outline"}>PDF {issue.hasPdf ? "✓" : "—"}</Badge>
              <Badge variant={issue.coverUploaded ? "default" : "outline"}>
                Cover {issue.coverUploaded ? "✓" : "—"}
              </Badge>
              <Badge variant={issue.hasPages ? "default" : "outline"}>
                {issue.hasPages ? `${issue.numPages} pages` : "No pages"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-t-0 border-(--rule)">
          <CardHeader className="border-b border-(--rule)">
            <div className="smallcaps text-(--muted-fg) mb-1">Article IV</div>
            <CardTitle className="font-serif text-2xl font-medium">Structured content</CardTitle>
            <CardDescription className="font-serif italic">JSON blobs for issue content and contributors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="content-json">Issue content</Label>
              <Textarea
                id="content-json"
                rows={5}
                value={issueContentJson}
                onChange={(e) => setIssueContentJson(e.currentTarget.value)}
                spellCheck={false}
              />
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
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription className="break-all">{error}</AlertDescription>
          </Alert>
        )}

        <div className="sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 border border-(--rule) bg-(--paper)/95 px-5 py-3 backdrop-blur">
          <span className="smallcaps text-(--muted-fg)">
            {canSubmit ? "Ready to publish revisions" : "Complete required fields"}
          </span>
          <div className="flex gap-2">
            <Link href="/admin" className="btn-ghost">Cancel</Link>
            <button type="submit" disabled={saving || !canSubmit} className="btn-press disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save revisions
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
