export function formatBylines(bylines: string[]): string {
  if (bylines.length === 0) return "";
  const spans = bylines.map((b) => `<span class="nowrap">${b}</span>`);
  const sep = spans.length >= 3 ? ", and " : spans.length > 1 ? " and " : "";
  return spans.slice(0, -1).join(", ") + sep + spans.slice(-1).join("");
}

export function calculatePageNums(maxPages: number, page: number): number[] {
  if (maxPages <= 0) return [1];
  let left = page - 2;
  let right = page + 2;
  if (right >= maxPages) {
    left -= right - maxPages;
    right -= right - maxPages;
  }
  if (left <= 0) {
    const excess = 1 - left;
    left += 1 - left;
    if (right < maxPages) right += Math.min(excess, maxPages - right);
  }
  const arr: number[] = [];
  for (let i = left; i <= right; i++) arr.push(i);
  return arr;
}

type SearchArticle = { title: string; bylines: string[] };
type SearchSection = { name: string; articles: SearchArticle[] };
type SearchPerson = { byline: string; title: string };
type SearchGroup = { name: string; people: SearchPerson[] };

export function findQuery(
  query: string,
  issueContentJson: string,
  contributorsJson: string,
  description: string,
): string {
  const q = query.toLowerCase();
  const content = JSON.parse(issueContentJson) as SearchSection[];
  const contributors = JSON.parse(contributorsJson) as SearchGroup[];

  const foundContent: string[] = [];
  outerContent: for (const section of content) {
    for (const article of section.articles) {
      const bylinesLow = article.bylines.map((b) => b.toLowerCase());
      if (article.title.toLowerCase().includes(q) || bylinesLow.some((b) => b.includes(q))) {
        const byList = article.bylines.slice(0, -1).join(", ");
        const sep = article.bylines.length >= 3 ? ", and " : article.bylines.length > 1 ? " and " : "";
        const lastByline = article.bylines.slice(-1);
        const bylineText = article.bylines.length > 0
          ? ` by ${byList}${sep}${lastByline}`
          : "";
        foundContent.push(`${article.title}${bylineText}`);
        if (foundContent.length >= 3) { foundContent.push("more"); break outerContent; }
      }
    }
  }

  const foundContribs: string[] = [];
  outerContrib: for (const group of contributors) {
    for (const person of group.people) {
      if (person.byline.toLowerCase().includes(q)) {
        const hasTitle = person.title.length > 0;
        foundContribs.push(`${person.byline}${hasTitle ? ", " + person.title : ""}`);
        if (foundContribs.length >= 3) { foundContribs.push("more"); break outerContrib; }
      }
    }
  }

  const parts: string[] = [];
  if (foundContent.length > 0) {
    const sep = foundContent.length >= 3 ? "; and " : foundContent.length > 1 ? "; and " : "";
    parts.push(`<strong>Contains:</strong> ${foundContent.slice(0, -1).join("; ")}${sep}${foundContent.slice(-1)}`);
  }
  if (foundContribs.length > 0) {
    const sep = foundContribs.length >= 3 ? ", and " : foundContribs.length > 1 ? " and " : "";
    parts.push(`<strong>Contains contributors:</strong> ${foundContribs.slice(0, -1).join(", ")}${sep}${foundContribs.slice(-1)}`);
  }
  return parts.length > 0 ? parts.join("<br />") : description;
}
