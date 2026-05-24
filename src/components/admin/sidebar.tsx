"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ExternalLink, FilePlus2, LayoutGrid } from "lucide-react";

type Recent = { id: number; slug: string; title: string };

export default function AdminSidebar({
  totalIssues,
  lastPublished,
  recent,
}: {
  totalIssues: number;
  lastPublished: string | null;
  recent: Recent[];
}) {
  const pathname = usePathname() ?? "";
  const isIssues = pathname === "/admin" || pathname.startsWith("/admin/issues");
  const isUpload = pathname.startsWith("/admin/upload");

  return (
    <aside className="admin-ink sticky top-0 flex h-screen flex-col px-6 py-7">
      {/* Masthead */}
      <Link href="/admin" className="block admin-in admin-in-1">
        <div className="font-serif text-[1.65rem] leading-[0.95] tracking-[-0.01em]">
          <span className="block italic font-light opacity-90">The</span>
          <span className="block font-semibold">GUIDON</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="block h-px w-6 bg-[oklch(0.45_0.012_70)]" />
          <span className="smallcaps text-[oklch(0.62_0.012_80)]">Archives</span>
        </div>
        <div className="mt-1 smallcaps text-[oklch(0.50_0.012_70)]" style={{ fontSize: "0.625rem" }}>
          Est. MCMXXIX · Admin
        </div>
      </Link>

      <hr className="hairline-dark my-7" />

      {/* Primary nav */}
      <div className="admin-in admin-in-2">
        <div className="smallcaps mb-3 text-[oklch(0.55_0.012_70)]">Workspace</div>
        <nav className="flex flex-col gap-0.5">
          <Link href="/admin" className="admin-nav-link" data-active={isIssues}>
            <Archive className="h-4 w-4" />
            <span>Issues</span>
            <span className="count">{totalIssues.toString().padStart(3, "0")}</span>
          </Link>
          <Link href="/admin/upload" className="admin-nav-link" data-active={isUpload}>
            <FilePlus2 className="h-4 w-4" />
            <span>New entry</span>
          </Link>
        </nav>
      </div>

      <hr className="hairline-dark my-7" />

      {/* Stats panel — newspaper-style key/value pairs */}
      <div className="admin-in admin-in-3">
        <div className="smallcaps mb-3 text-[oklch(0.55_0.012_70)]">Archive</div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[oklch(0.62_0.012_80)]">Total entries</dt>
            <dd className="font-serif text-lg font-medium text-[oklch(0.96_0.012_80)] font-mono-tab">
              {totalIssues}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[oklch(0.62_0.012_80)]">Latest issue</dt>
            <dd className="text-[oklch(0.92_0.012_80)] text-[0.8125rem] font-mono-tab">
              {lastPublished ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      {recent.length > 0 && (
        <>
          <hr className="hairline-dark my-7" />
          <div className="admin-in admin-in-4">
            <div className="smallcaps mb-3 text-[oklch(0.55_0.012_70)]">Recently edited</div>
            <ul className="space-y-2.5">
              {recent.map((r, i) => (
                <li key={r.id} className="text-sm leading-snug">
                  <Link
                    href={`/admin/issues/${r.id}/edit`}
                    className="group block text-[oklch(0.78_0.012_80)] hover:text-[oklch(0.98_0.012_80)] transition-colors"
                  >
                    <span className="font-mono-tab text-[0.6875rem] tracking-wider text-[oklch(0.5_0.012_70)] group-hover:text-[oklch(0.72_0.012_80)]">
                      №{String(i + 1).padStart(2, "0")}
                    </span>{" "}
                    <span className="font-serif italic">{r.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Bottom — link to public site */}
      <div className="mt-auto admin-in admin-in-4 pt-7">
        <Link
          href="/"
          target="_blank"
          className="group inline-flex items-center gap-2 text-[0.75rem] text-[oklch(0.62_0.012_80)] hover:text-[oklch(0.95_0.012_80)] transition-colors"
        >
          <span className="smallcaps">View public site</span>
          <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100" />
        </Link>
        <div className="mt-3 flex items-center gap-2 text-[0.625rem] text-[oklch(0.48_0.012_70)]">
          <LayoutGrid className="h-3 w-3" />
          <span className="smallcaps">v2 · cloudflare</span>
        </div>
      </div>
    </aside>
  );
}
