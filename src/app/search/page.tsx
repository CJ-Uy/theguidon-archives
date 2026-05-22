import { listIssues, getMinMaxDates } from "@/lib/queries";
import {
  validatePage,
  validateSortFilter,
  validateView,
  validateYearFilter,
  validateRangeFilter,
} from "@/lib/dates";
import { calculatePageNums } from "@/lib/format";
import IssueCard from "@/components/issue-card";
import Pagination from "@/components/pagination";
import FiltersGroup from "@/components/filters";
import "./search.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Search | The GUIDON Archives" };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = typeof sp.query === "string" ? sp.query : "";

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

  // "volume N" / "vol N" / "vol. N" routes to volume filter, not search
  const volumeMatch = query.match(/^(volume|vol|vol\.) ([0-9]+)/i);
  const volume = volumeMatch ? parseInt(volumeMatch[2], 10) : null;

  const result = await listIssues({
    search: volume == null ? query : null,
    volume,
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

  return (
    <div id="search-results" className="general-container general-padding-top">
      <p className="subheader">
        {result.found === 0
          ? "We couldn't find any matches for"
          : `Showing ${result.found} results for`}
      </p>
      <h2>{`“${query}”`}</h2>
      <hr />

      <FiltersGroup minDate={minmax.min} maxDate={minmax.max} hideCategories />

      {result.found === 0 ? (
        <ul>
          <li>Double-check the spelling or try using different keywords.</li>
          <li>Broaden your search query to include more general terms.</li>
          <li>
            Try refining your search with specific filters to narrow down the
            results.
          </li>
        </ul>
      ) : (
        <>
          <div className={`card-grid ${isGridView ? "" : "list"}`}>
            {result.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} query={query} />
            ))}
          </div>
          {result.maxPages > 1 && (
            <Pagination
              pageNums={calculatePageNums(result.maxPages, page)}
              page={page}
            />
          )}
        </>
      )}
    </div>
  );
}
