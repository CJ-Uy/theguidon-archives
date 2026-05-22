import { redirect } from "next/navigation";
import { listIssues, getMinMaxDates } from "@/lib/queries";
import { dbCategoryFor, listingTitle } from "@/lib/category-slug";
import { calculatePageNums } from "@/lib/format";
import {
  validatePage,
  validateSortFilter,
  validateView,
  validateYearFilter,
  validateRangeFilter,
} from "@/lib/dates";
import IssueCard from "@/components/issue-card";
import Pagination from "@/components/pagination";
import FiltersGroup from "@/components/filters";
import "./browse.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrowsePage({ params, searchParams }: Props) {
  const { slug: slugParts } = await params;
  const sp = await searchParams;

  const slug = slugParts?.[0];
  if (!slug) redirect("/releases/recent");

  const sortRaw = typeof sp.sort === "string" ? sp.sort : null;
  const viewRaw = typeof sp.view === "string" ? sp.view : null;
  const yearRaw = typeof sp.year === "string" ? sp.year : null;
  const fromRaw = typeof sp.from === "string" ? sp.from : null;
  const untilRaw = typeof sp.until === "string" ? sp.until : null;
  const pageRaw = typeof sp.page === "string" ? sp.page : null;

  const minmax = await getMinMaxDates();
  const minYear = new Date(minmax.min).getFullYear();
  const maxYear = new Date(minmax.max).getFullYear();

  const yearFilter = validateYearFilter(yearRaw, minYear, maxYear);
  const fromFilter = validateRangeFilter(fromRaw, "from");
  const untilFilter = validateRangeFilter(untilRaw, "until");
  const isAscending = validateSortFilter(sortRaw);
  const isGridView = validateView(viewRaw);
  const page = validatePage(pageRaw);

  let categorySlug: string | null = null;
  let isLegacy: boolean | undefined = undefined;
  if (slug === "legacy") {
    isLegacy = true;
  } else if (slug !== "recent") {
    const db = dbCategoryFor(slug);
    if (db) categorySlug = db;
  }

  const result = await listIssues({
    categorySlug,
    isLegacy,
    year: yearFilter,
    from: fromFilter
      ? `${fromFilter.year}-${String(fromFilter.month).padStart(2, "0")}-${String(fromFilter.day).padStart(2, "0")}`
      : null,
    until: untilFilter
      ? `${untilFilter.year}-${String(untilFilter.month).padStart(2, "0")}-${String(untilFilter.day).padStart(2, "0")}`
      : null,
    page,
    order: isAscending ? "asc" : "desc",
  });

  // unused listing-title variable in legacy — keep behavior identical: only used internally if needed
  void listingTitle(slug);

  const subheader = slug === "recent" ? "Recently Uploaded" : "Browse";
  const heading = slug === "recent" ? "What's New on the Archive" : "The Archive";

  return (
    <div id="browse" className="general-container general-padding-top">
      <p className="subheader">{subheader}</p>
      <h2>{heading}</h2>
      <hr />
      <FiltersGroup minDate={minmax.min} maxDate={minmax.max} />

      <div className={`card-grid ${isGridView ? "" : "list"}`}>
        {result.issues.length === 0 ? (
          <p className="empty-row">No issues match these filters.</p>
        ) : (
          result.issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
        )}
      </div>

      {result.maxPages > 1 && (
        <Pagination
          pageNums={calculatePageNums(result.maxPages, page)}
          page={page}
        />
      )}
    </div>
  );
}
