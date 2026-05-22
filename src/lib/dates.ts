const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export type DatePart = {
  str: string;
  step: 1 | 2 | 3;
  year: number;
  month: number;
  day: number;
};

export function validateYearFilter(
  raw: string | null,
  minYear: number,
  maxYear: number,
): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  if (n < minYear || n > maxYear) return null;
  return n;
}

export function validatePage(raw: string | null): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}

export function validateSortFilter(raw: string | null): boolean {
  return raw === "oldest";
}

export function validateView(raw: string | null): boolean {
  return raw !== "list";
}

export function validateRangeFilter(
  raw: string | null,
  mode: "from" | "until",
): DatePart | null {
  if (!raw || raw.trim().length === 0) return null;
  const parts = raw.split("-");
  if (parts.length > 3) return null;
  if (parts.some((p) => Number.isNaN(Number(p)))) return null;
  const nums = parts.map((p) => parseInt(p, 10));

  if (nums.length === 1) {
    return {
      str: `${nums[0]}`,
      step: 1,
      year: nums[0],
      month: mode === "from" ? 1 : 12,
      day: mode === "from" ? 1 : new Date(nums[0], 1, 0).getDate(),
    };
  }
  if (nums.length === 2) {
    return {
      str: `${nums[0]}-${String(nums[1]).padStart(2, "0")}`,
      step: 2,
      year: nums[0],
      month: nums[1],
      day: mode === "from" ? 1 : new Date(nums[0], nums[1], 0).getDate(),
    };
  }
  return {
    str: `${nums[0]}-${String(nums[1]).padStart(2, "0")}-${String(nums[2]).padStart(2, "0")}`,
    step: 3,
    year: nums[0],
    month: nums[1],
    day: nums[2],
  };
}
