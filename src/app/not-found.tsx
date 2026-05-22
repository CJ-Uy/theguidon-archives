import { listIssues } from "@/lib/queries";
import IssueCard from "@/components/issue-card";
import "./not-found.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "Page not found | The GUIDON Archives" };

export default async function NotFound() {
  const latest = await listIssues({ pageSize: 5 });

  return (
    <div id="page-404" className="general-container general-padding-top">
      <p className="subheader">Error 404</p>
      <h2>Page not found.</h2>
      <hr />

      <p className="text">
        Try searching for it again. It may have been removed or there might
        have been a typo in the URL.
      </p>

      {latest.issues.length > 0 && (
        <>
          <p className="subheader">Our latest releases</p>
          <h4>You might be interested in these instead.</h4>

          <div className="card-grid mobile-list">
            {latest.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
