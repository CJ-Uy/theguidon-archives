"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./sidebar";

type Recent = { id: number; slug: string; title: string };

export default function AdminShell({
  totalIssues,
  lastPublished,
  recent,
  children,
}: {
  totalIssues: number;
  lastPublished: string | null;
  recent: Recent[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
      <div className="admin-topbar admin-ink md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="admin-topbar-btn"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="admin-topbar-brand">
          <span className="font-serif italic font-light opacity-90">The </span>
          <span className="font-serif font-semibold">GUIDON</span>
          <span className="smallcaps ml-2 opacity-70">Archives</span>
        </div>
        <div className="w-9" aria-hidden />
      </div>

      {/* Sidebar — static on md+, drawer on mobile */}
      <div
        className={`admin-sidebar-slot ${drawerOpen ? "is-open" : ""}`}
        aria-hidden={!drawerOpen ? undefined : false}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="admin-drawer-close md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        <AdminSidebar
          totalIssues={totalIssues}
          lastPublished={lastPublished}
          recent={recent}
        />
      </div>

      {/* Scrim */}
      <button
        type="button"
        aria-hidden={!drawerOpen}
        tabIndex={-1}
        className={`admin-scrim ${drawerOpen ? "is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      <div className="admin-paper relative">{children}</div>
    </div>
  );
}
