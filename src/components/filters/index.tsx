"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import CategoriesFilter from "./categories";
import AdvancedFilters from "./advanced";
import ViewsFilter from "./views";
import { useClickOutside } from "@/lib/use-click-outside";
import {
  validateRangeFilter,
  validateSortFilter,
  validateYearFilter,
} from "@/lib/dates";
import "./index.css";

export type FiltersGroupProps = {
  minDate: string; // ISO
  maxDate: string; // ISO
  hideCategories?: boolean;
};

export type FilterUpdate = { key: string; value?: string; delete?: boolean };

export type DateBound = { year: number; month: number; day: number };

function isoToBound(iso: string): DateBound {
  const d = new Date(iso);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

export default function FiltersGroup({
  minDate,
  maxDate,
  hideCategories,
}: FiltersGroupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ slug?: string | string[] }>();

  const [activeFilterPopup, setActiveFilterPopup] = useState<string | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(
    containerRef,
    () => setActiveFilterPopup(null),
    activeFilterPopup != null,
  );

  const minBound = useMemo(() => isoToBound(minDate), [minDate]);
  const maxBound = useMemo(() => isoToBound(maxDate), [maxDate]);

  function replace(updates: FilterUpdate[]) {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    for (const u of updates) {
      if (u.delete) sp.delete(u.key);
      else if (u.value != null) sp.set(u.key, u.value);
    }
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const currentSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const yearFilter = validateYearFilter(
    searchParams.get("year"),
    minBound.year,
    maxBound.year,
  );
  const rangeFilter = {
    from: validateRangeFilter(searchParams.get("from"), "from"),
    until: validateRangeFilter(searchParams.get("until"), "until"),
  };
  const sortOldestFilter = validateSortFilter(searchParams.get("sort"));

  return (
    <div className="filters" ref={containerRef}>
      {!hideCategories && (
        <CategoriesFilter currentSlug={currentSlug ?? "recent"} />
      )}

      <div className="advanced-group">
        <AdvancedFilters
          activeFilterPopup={activeFilterPopup}
          setActiveFilterPopup={setActiveFilterPopup}
          yearFilter={yearFilter}
          minDate={minBound}
          maxDate={maxBound}
          rangeFilter={rangeFilter}
          sortOldestFilter={sortOldestFilter}
          replace={replace}
        />

        <ViewsFilter replace={replace} />
      </div>
    </div>
  );
}
