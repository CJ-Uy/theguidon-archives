import Link from "next/link";
import { listIssues } from "@/lib/queries";
import { coverKey, publicUrl } from "@/lib/storage";
import { formatDate } from "@/lib/dates";
import IssueCard from "@/components/issue-card";
import "./home.css";

export const dynamic = "force-dynamic";

const chevronRight = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
    <path
      d="M14.5786 26.8126C13.9635 27.369 13.9146 28.32 14.4695 28.9367C15.0244 29.5535 15.9729 29.6025 16.588 29.0461L25.4248 21.0541C26.0867 20.4554 26.0849 19.4134 25.4209 18.8171L16.6613 10.9504C16.0442 10.3962 15.0959 10.4485 14.5432 11.0672C13.9904 11.6859 14.0426 12.6367 14.6597 13.1909L21.846 19.6447C22.0226 19.8033 22.0231 20.0798 21.8471 20.239L14.5786 26.8126Z"
      fill="#1C4480"
    />
  </svg>
);

const chevronRightSmall = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" fill="none">
    <path
      d="M8.7472 16.5876C8.37811 16.9214 8.3488 17.492 8.68173 17.862C9.01466 18.2321 9.58376 18.2615 9.95284 17.9277L15.2549 13.1324C15.6521 12.7732 15.651 12.1481 15.2525 11.7902L9.99678 7.07022C9.62653 6.73771 9.05755 6.7691 8.72591 7.14032C8.39428 7.51154 8.42558 8.08202 8.79582 8.41453L12.9755 12.1682C13.1521 12.3268 13.1526 12.6033 12.9766 12.7625L8.7472 16.5876Z"
      fill="#1C4480"
    />
  </svg>
);

export default async function HomePage() {
  const [latest, press, gradmag, fresh, uaap, others, legacy] =
    await Promise.all([
      listIssues({ pageSize: 5 }),
      listIssues({ categorySlug: "press-issue", pageSize: 3 }),
      listIssues({ categorySlug: "graduation-magazine", pageSize: 3 }),
      listIssues({ categorySlug: "freshmanual", pageSize: 3 }),
      listIssues({ categorySlug: "uaap-primer", pageSize: 3 }),
      listIssues({ categorySlug: "other", pageSize: 3 }),
      listIssues({ isLegacy: true, pageSize: 5 }),
    ]);

  const hero = latest.issues[0] ?? null;
  const heroCover = hero
    ? coverKey({
        id: hero.id,
        isLegacy: hero.isLegacy,
        coverUploaded: hero.coverUploaded,
        hasPages: hero.hasPages,
      })
    : null;
  const heroCoverUrl = heroCover ? publicUrl(heroCover) : null;

  const categoryCards = [
    { key: "press-issue", link: "/releases/press", title: "Press Issues", data: press },
    { key: "graduation-magazine", link: "/releases/gradmag", title: "Graduation Magazines", data: gradmag },
    { key: "freshmanual", link: "/releases/freshmanual", title: "Freshmanuals", data: fresh },
    { key: "uaap-primer", link: "/releases/uaap-primer", title: "UAAP Primers", data: uaap },
    { key: "other", link: "/releases/others", title: "Others", data: others },
  ];

  return (
    <div id="home">
      {hero ? (
        <div
          id="hero"
          style={
            heroCoverUrl ? { backgroundImage: `url(${heroCoverUrl})` } : undefined
          }
        >
          <div className="bg-tint" />

          <div className="general-container">
            <div className="info">
              <p className="badge">Latest Release</p>
              <h1 className="title">{hero.title}</h1>
              <p className="date">{formatDate(hero.datePublished)}</p>
              <p className="desc">{hero.description ?? ""}</p>

              <Link href={`/issue/${hero.slug}`} className="read-now">
                Read now
              </Link>
            </div>

            {heroCoverUrl ? (
              <img className="cover" src={heroCoverUrl} alt={hero.title} />
            ) : (
              <div className="cover empty" />
            )}
          </div>
        </div>
      ) : (
        <div id="hero" className="empty">
          <div className="bg-tint" />
          <div className="general-container">
            <div className="info">
              <p className="badge">The GUIDON Archives</p>
              <h1 className="title">No issues uploaded yet</h1>
              <p className="desc">
                Visit <Link href="/admin/upload">/admin/upload</Link> to add the
                first one.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="general-container general-padding-top">
        <p className="subheader">Recently Uploaded</p>
        <Link href="/releases/recent" className="row">
          <h3>New on the Archive</h3>
          {chevronRight}
        </Link>
        <hr />
        <div id="latest" className="card-grid mobile-list">
          {latest.issues.length === 0 ? (
            <p className="empty-row">No issues yet.</p>
          ) : (
            latest.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>

        <p className="subheader">Browse</p>
        <Link href="/releases/recent" className="row">
          <h3>The Archive</h3>
          {chevronRight}
        </Link>
        <hr />
        <div id="recently-uploaded" className="card-grid mobile-list">
          {categoryCards.map((cat) => (
            <Link key={cat.key} href={cat.link} className="categ-card">
              <div className="row">
                <h5 className="categ-name">{cat.title}</h5>
                {chevronRightSmall}
              </div>
              <div className="cover-container">
                {cat.data.issues.slice(0, 3).map((issue) => {
                  const k = coverKey({
                    id: issue.id,
                    isLegacy: issue.isLegacy,
                    coverUploaded: issue.coverUploaded,
                    hasPages: issue.hasPages,
                  });
                  return k ? (
                    <img
                      key={issue.id}
                      className="cover"
                      src={publicUrl(k)}
                      alt={cat.title}
                    />
                  ) : (
                    <div key={issue.id} className="cover empty" />
                  );
                })}
              </div>
            </Link>
          ))}
        </div>

        <p className="subheader">The GUIDON Through the Years</p>
        <Link href="/releases/legacy" className="row">
          <h3>Explore History</h3>
          {chevronRight}
        </Link>
        <hr />
        <div id="history" className="card-grid mobile-list">
          {legacy.issues.length === 0 ? (
            <p className="empty-row">No legacy issues yet.</p>
          ) : (
            legacy.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
