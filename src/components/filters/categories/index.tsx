"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "./index.css";

// Tab labels intentionally diverge from URL_TO_TITLE: those are page-title
// strings ("Graduation Magazines"), these are the compact tab strip labels
// from the legacy UI ("GradMag", "All").
const CATEGORY_TABS: { slug: string; text: string }[] = [
  { slug: "recent", text: "All" },
  { slug: "press", text: "Press Issues" },
  { slug: "gradmag", text: "GradMag" },
  { slug: "freshmanual", text: "Freshmanual" },
  { slug: "uaap-primer", text: "UAAP Primers" },
  { slug: "legacy", text: "Over the Years" },
  { slug: "others", text: "Others" },
];

export default function CategoriesFilter({
  currentSlug,
}: {
  currentSlug: string;
}) {
  const searchParams = useSearchParams();

  const pageOneQuery = () => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    sp.set("page", "1");
    return sp.toString();
  };

  return (
    <div className="categ-filters">
      {CATEGORY_TABS.map((categ) => {
        const qs = pageOneQuery();
        const href = `/releases/${categ.slug}${qs ? `?${qs}` : ""}`;
        return (
          <Link
            key={`categ-filter-${categ.slug}`}
            href={href}
            className={categ.slug === currentSlug ? "active" : ""}
          >
            {categ.text}
          </Link>
        );
      })}
    </div>
  );
}
