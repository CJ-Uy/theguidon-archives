// URL slug <-> DB category slug
// URL slugs are the human-friendly names used in /releases/<slug>.
// DB category.slug is the WordPress-compatible form stored in D1.

export const URL_TO_DB_CATEGORY = {
  press: "press-issue",
  gradmag: "graduation-magazine",
  freshmanual: "freshmanual",
  "uaap-primer": "uaap-primer",
  others: "other",
} as const;

export type UrlCategorySlug = keyof typeof URL_TO_DB_CATEGORY;
export type DbCategorySlug = (typeof URL_TO_DB_CATEGORY)[UrlCategorySlug];

export const URL_TO_TITLE = {
  recent: "Recently Uploaded",
  press: "Press Issues",
  gradmag: "Graduation Magazines",
  freshmanual: "Freshmanuals",
  "uaap-primer": "UAAP Primers",
  legacy: "Over the Years",
  others: "Others",
} as const;

export type ListingSlug = keyof typeof URL_TO_TITLE | string;

export function listingTitle(slug: ListingSlug | undefined): string {
  if (!slug) return "Recently Uploaded";
  return URL_TO_TITLE[slug as keyof typeof URL_TO_TITLE] ?? "Recently Uploaded";
}

export function dbCategoryFor(urlSlug: string): DbCategorySlug | null {
  return (URL_TO_DB_CATEGORY[urlSlug as UrlCategorySlug] ?? null);
}
