"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ExternalLink, FilePlus2 } from "lucide-react";

type Recent = { id: number; slug: string; title: string };

const C_HEADING = "#ffffff";
const C_BODY = "#dbe9f4";
const C_MUTED = "#9bb1cf";
const C_DIM = "#7a93b8";
const C_RULE = "#56729c";

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
      <Link href="/admin" className="block admin-in admin-in-1" style={{ color: C_HEADING }}>
        <div className="font-serif text-[1.65rem] leading-[0.95] tracking-[-0.01em]">
          <span className="block italic font-light opacity-90">The</span>
          <span className="block font-semibold">GUIDON</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="block h-px w-6" style={{ background: C_RULE }} />
          <span className="smallcaps" style={{ color: C_BODY }}>Archives</span>
        </div>
        <div className="mt-1 smallcaps" style={{ fontSize: "0.625rem", color: C_DIM }}>
          Est. MCMXXIX · Admin
        </div>
      </Link>

      <hr className="hairline-dark my-7" />

      {/* Primary nav */}
      <div className="admin-in admin-in-2">
        <div className="smallcaps mb-3" style={{ color: C_DIM }}>Workspace</div>
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
        <div className="smallcaps mb-3" style={{ color: C_DIM }}>Archive</div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <dt style={{ color: C_MUTED }}>Total entries</dt>
            <dd className="font-serif text-lg font-medium font-mono-tab" style={{ color: C_HEADING }}>
              {totalIssues}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt style={{ color: C_MUTED }}>Latest issue</dt>
            <dd className="text-[0.8125rem] font-mono-tab" style={{ color: C_BODY }}>
              {lastPublished ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      {recent.length > 0 && (
        <>
          <hr className="hairline-dark my-7" />
          <div className="admin-in admin-in-4">
            <div className="smallcaps mb-3" style={{ color: C_DIM }}>Recently edited</div>
            <ul className="space-y-2.5">
              {recent.map((r, i) => (
                <li key={r.id} className="text-sm leading-snug">
                  <Link
                    href={`/admin/issues/${r.id}/edit`}
                    className="group block transition-colors"
                    style={{ color: C_BODY }}
                  >
                    <span
                      className="font-mono-tab text-[0.6875rem] tracking-wider"
                      style={{ color: C_DIM }}
                    >
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
          className="group inline-flex items-center gap-2 text-[0.75rem] transition-colors"
          style={{ color: C_MUTED }}
        >
          <span className="smallcaps">View public site</span>
          <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100" />
        </Link>
      </div>
    </aside>
  );
}
