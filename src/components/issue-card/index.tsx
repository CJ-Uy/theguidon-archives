import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { findQuery } from "@/lib/format";
import { coverKey, publicUrl } from "@/lib/storage";
import type { Issue } from "@/lib/schema";
import "./index.css";

type Props = { issue?: Issue; loading?: boolean; query?: string };

export default function IssueCard({ issue, loading, query }: Props) {
  if (loading || !issue) {
    return (
      <div className="issue-card loading-container">
        <div className="cover-container loading" />

        <div className="info">
          <div
            className="title loading"
            style={{ width: `${Math.random() * 25 + 75}%` }}
          />
          <div
            className="date loading"
            style={{ width: `${Math.random() * 25 + 50}%` }}
          />
          <div className="desc loading" />
        </div>
      </div>
    );
  }

  const key = coverKey({
    id: issue.id,
    isLegacy: issue.isLegacy,
    coverUploaded: issue.coverUploaded,
    hasPages: issue.hasPages,
  });
  const cover = key ? publicUrl(key) : null;

  const snippet =
    query == null
      ? (issue.description ?? "")
      : findQuery(
          query,
          issue.issueContent,
          issue.contributors,
          issue.description ?? "",
        );

  return (
    <Link href={`/issue/${issue.slug}`} className="issue-card">
      <div className="cover-container">
        {cover ? (
          <img src={cover} alt={issue.title} loading="lazy" />
        ) : null}
      </div>

      <div className="info">
        <h6 className="title">{issue.title}</h6>
        <p className="date">{formatDate(issue.datePublished)}</p>
        <p
          className="desc"
          dangerouslySetInnerHTML={{ __html: snippet }}
        />
      </div>
    </Link>
  );
}
