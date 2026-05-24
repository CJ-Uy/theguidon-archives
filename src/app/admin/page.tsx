import Link from "next/link";
import { db } from "@/lib/db";
import { issues } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { formatDate } from "@/lib/dates";
import { Pencil, Plus, FileText, Image as ImageIcon, Layers } from "lucide-react";
import IssueDeleteButton from "@/components/admin/issue-delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Issues | Admin" };

function StatusLabel({ status }: { status: "draft" | "processing" | "ready" }) {
  return (
    <span className="inline-flex items-center text-[0.75rem] tracking-[0.06em] uppercase text-(--ink-2)">
      <span className={`status-dot ${status}`} aria-hidden />
      {status}
    </span>
  );
}

export default async function AdminIssuesPage() {
  const rows = await db
    .select({
      id: issues.id,
      slug: issues.slug,
      title: issues.title,
      datePublished: issues.datePublished,
      status: issues.status,
      isLegacy: issues.isLegacy,
      hasPdf: issues.hasPdf,
      hasPages: issues.hasPages,
      coverUploaded: issues.coverUploaded,
      numPages: issues.numPages,
      volumeNum: issues.volumeNum,
      issueNum: issues.issueNum,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .orderBy(desc(issues.datePublished));

  const readyCount = rows.filter((r) => r.status === "ready").length;
  const draftCount = rows.filter((r) => r.status === "draft").length;
  const legacyCount = rows.filter((r) => r.isLegacy).length;

  return (
    <div className="admin-page">
      {/* Masthead — newspaper section opener */}
      <section className="admin-in admin-in-1">
        <div className="flex items-end justify-between gap-6 border-b border-(--rule-strong) pb-6">
          <div>
            <div className="smallcaps text-(--muted-fg) mb-3">Section · 01</div>
            <h1 className="font-serif text-[3.25rem] leading-[0.95] tracking-[-0.015em]">
              The Archive
            </h1>
            <p className="font-serif italic mt-3 text-[1.05rem] text-(--ink-2) max-w-xl">
              {rows.length} published volumes catalogued across the years. Compose new entries, refine
              metadata, or retire records from the registry.
            </p>
          </div>
          <Link href="/admin/upload" className="btn-press shrink-0">
            <Plus className="h-4 w-4" />
            <span>Compose new entry</span>
          </Link>
        </div>

        {/* Stat strip — index-style */}
        <div className="mt-6 grid grid-cols-4 divide-x divide-(--rule) border border-(--rule) bg-(--paper)">
          <Stat label="Total" value={rows.length} />
          <Stat label="Ready" value={readyCount} />
          <Stat label="Draft" value={draftCount} />
          <Stat label="Legacy" value={legacyCount} />
        </div>
      </section>

      {/* Table */}
      <section className="admin-in admin-in-2 mt-12">
        <div className="flex items-baseline justify-between mb-4">
          <div className="smallcaps-lg text-(--ink-2)">Index of Issues</div>
          <div className="text-xs font-mono-tab text-(--muted-fg)">
            sorted · most recent first
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border border-dashed border-(--rule-strong) py-16 text-center">
            <p className="font-serif italic text-lg text-(--ink-2)">
              The registry stands empty.
            </p>
            <Link
              href="/admin/upload"
              className="btn-press mt-4 inline-flex"
            >
              <Plus className="h-4 w-4" />
              Compose the first entry
            </Link>
          </div>
        ) : (
          <div className="border border-(--rule) bg-(--paper)">
            <div className="archive-header smallcaps text-(--muted-fg)">
              <span>№</span>
              <span>Title</span>
              <span>Volume</span>
              <span>Status</span>
              <span>Assets</span>
              <span className="text-right">—</span>
            </div>
            {rows.map((r, i) => (
              <div key={r.id} className="archive-row">
                <span className="font-mono-tab text-[0.8125rem] text-(--muted-fg)">
                  {String(rows.length - i).padStart(3, "0")}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/issue/${r.slug}`}
                    target="_blank"
                    className="font-serif text-[1.05rem] leading-snug hover:text-(--accent-blue) transition-colors block truncate"
                  >
                    {r.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[0.75rem] text-(--muted-fg)">
                    <span className="font-mono-tab">{r.slug}</span>
                    {r.isLegacy && (
                      <span className="font-serif italic text-(--accent-blue)">
                        · legacy
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[0.8125rem] font-mono-tab text-(--ink-2)">
                  {r.volumeNum != null ? (
                    <>
                      Vol. <span className="font-serif">{toRoman(r.volumeNum)}</span>
                      {r.issueNum != null && (
                        <span className="text-(--muted-fg)"> · №{r.issueNum}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-(--muted-fg)">—</span>
                  )}
                  <div className="text-[0.6875rem] text-(--muted-fg) mt-0.5">
                    {formatDate(r.datePublished)}
                  </div>
                </div>
                <StatusLabel status={r.status} />
                <div className="flex flex-wrap gap-1">
                  {r.hasPdf && (
                    <span className="chip">
                      <FileText className="h-3 w-3" />
                      PDF
                    </span>
                  )}
                  {r.coverUploaded && (
                    <span className="chip">
                      <ImageIcon className="h-3 w-3" />
                      Cover
                    </span>
                  )}
                  {r.hasPages && (
                    <span className="chip">
                      <Layers className="h-3 w-3" />
                      {r.numPages}
                    </span>
                  )}
                  {!r.hasPdf && !r.coverUploaded && !r.hasPages && (
                    <span className="text-[0.75rem] text-(--muted-fg)">—</span>
                  )}
                </div>
                <div className="actions flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/issues/${r.id}/edit`}
                    aria-label="Edit"
                    className="btn-icon-edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <IssueDeleteButton
                    id={r.id}
                    title={r.title}
                    slug={r.slug}
                    assets={{
                      hasPdf: r.hasPdf,
                      coverUploaded: r.coverUploaded,
                      hasPages: r.hasPages,
                      numPages: r.numPages,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4">
      <div className="smallcaps text-(--muted-fg)">{label}</div>
      <div className="font-serif text-[2rem] leading-none mt-1.5 font-mono-tab tracking-tight">
        {value}
      </div>
    </div>
  );
}

function toRoman(n: number): string {
  if (n <= 0 || n >= 4000) return String(n);
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let rem = n;
  for (const [v, s] of map) {
    while (rem >= v) {
      out += s;
      rem -= v;
    }
  }
  return out;
}
