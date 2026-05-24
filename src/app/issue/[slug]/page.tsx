import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getIssue } from "@/lib/queries";
import { formatDate } from "@/lib/dates";
import { formatBylines } from "@/lib/format";
import { coverKey, publicUrl, r2Keys } from "@/lib/storage";
import { ArchivesData } from "@/data/archives";
import Reader from "@/components/reader";
import "./issue.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

type ContentSection = { name: string; articles: { title: string; bylines: string[] }[] };
type ContributorGroup = { name: string; people: { byline: string; title: string }[] };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssue(slug);
  if (!issue) return { title: "Issue not found | The GUIDON Archives" };
  return {
    title: `${issue.title} | The GUIDON Archives`,
    description: issue.description ?? undefined,
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssue(slug);
  if (!issue) notFound();

  const issueContent: ContentSection[] = JSON.parse(issue.issueContent);
  const contributors: ContributorGroup[] = JSON.parse(issue.contributors);

  const ck = coverKey({
    id: issue.id,
    isLegacy: issue.isLegacy,
    coverUploaded: issue.coverUploaded,
    hasPages: issue.hasPages,
  });
  const coverSrc = ck ? publicUrl(ck) : null;
  const publicBaseUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  const shareUrl = `https://archives.theguidon.com/issue/${issue.slug}`;
  const archivesEntries = Object.entries(ArchivesData);

  return (
    <div id="issue">
      {issue.hasPages ? (
        <Suspense fallback={<div id="reader" className="loading" />}>
          <Reader
            issueId={issue.id}
            issueSlug={issue.slug}
            issueTitle={issue.title}
            numPages={issue.numPages}
            hasPdf={issue.hasPdf}
            publicBaseUrl={publicBaseUrl}
          />
        </Suspense>
      ) : (
        <div id="reader" className="empty">
          <p>
            No preview available
            {issue.hasPdf ? " — download the PDF below." : "."}
          </p>
          {issue.hasPdf && (
            <a href={publicUrl(r2Keys.pdf(issue.id))} download>
              Download PDF
            </a>
          )}
        </div>
      )}

      <section id="issue-metadata" className="general-container">
        {coverSrc ? (
          <div className="cover-container">
            <img className="cover" src={coverSrc} alt={issue.title} />
          </div>
        ) : (
          <div className="cover-container empty" />
        )}

        <div className="info">
          {issue.volumeNum != null && issue.issueNum != null && (
            <p className="vol-issue">Vol. {issue.volumeNum}, No. {issue.issueNum}</p>
          )}
          <h3 className="title">{issue.title}</h3>
          <p className="date">{formatDate(issue.datePublished)}</p>
          {issue.isLegacy ? (
            <>
              <p className="to-access">To access the complete issue, please visit:</p>
              <div className="rows-container">
                {archivesEntries.map(([key, entry]) => (
                  <div className="row" key={`metadata-${key}`}>
                    {entry.icon}
                    <p dangerouslySetInnerHTML={{ __html: entry.text }} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            issue.description && <p className="desc">{issue.description}</p>
          )}

          <p className="share">Share</p>
          <div className="socials">
            <Link
              href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" />
              </svg>
            </Link>
            <Link
              href={`https://x.com/share?text=${encodeURIComponent(`View the ${issue.title} release on The GUIDON Archives: ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.8998 11.1983L19.0923 4H17.6249L12.2479 10.2502L7.9533 4H3L9.49426 13.4514L3 21H4.46752L10.1458 14.3996L14.6812 21H19.6345L12.8994 11.1983H12.8998ZM10.8898 13.5347L10.2318 12.5936L4.99629 5.10473H7.25031L11.4754 11.1485L12.1334 12.0896L17.6256 19.9455H15.3715L10.8898 13.5351V13.5347Z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {(issueContent.length > 0 || (contributors.length > 0 && !issue.isLegacy)) && (
        <section id="issue-content">
          <div className="general-container">
            {issueContent.length > 0 && (
              <>
                <h4 id="in-this-issue">In this issue</h4>
                <div className="content-container">
                  {issueContent.map((section, idx) => (
                    <div className="section" key={`content-section-${idx}`}>
                      <p className="section-name">{section.name}</p>
                      <hr />
                      <div
                        className="articles-container"
                        style={{
                          gridTemplateRows: `repeat(${Math.ceil(section.articles.length / 2)}, auto)`,
                        }}
                      >
                        {section.articles.map((article, j) => (
                          <div className="article" key={`content-section-${idx}-${j}`}>
                            <p
                              className="title"
                              dangerouslySetInnerHTML={{ __html: article.title }}
                            />
                            {article.bylines.length > 0 && (
                              <p
                                className="bylines"
                                dangerouslySetInnerHTML={{ __html: `By ${formatBylines(article.bylines)}` }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {contributors.length > 0 && !issue.isLegacy && (
              <>
                <h4 id="contributors">Contributors</h4>
                <div className="contributors-container">
                  {contributors.map((group, idx) => {
                    const hasMultipleTitled =
                      group.people.filter((p) => p.title.length > 0).length > 1;
                    return (
                      <div className="group" key={`contribs-group-${idx}`}>
                        <p className="group-name">{group.name}</p>
                        <hr />
                        <div
                          className={`people-container ${hasMultipleTitled ? "" : "no-title"}`}
                          style={{
                            gridTemplateRows: `repeat(${Math.ceil(group.people.length / 2)}, auto)`,
                          }}
                        >
                          {group.people.map((person, j) =>
                            person.title.length > 0 ? (
                              <div className="person" key={`person-${idx}-${j}`}>
                                <p className="byline">{person.byline}</p>
                                <p className="title">{person.title}</p>
                              </div>
                            ) : (
                              <p className="byline" key={`person-${idx}-${j}`}>
                                {person.byline}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
