import { ArchivesData } from "@/data/archives";
import { listIssues } from "@/lib/queries";
import { coverKey, publicUrl } from "@/lib/storage";
import "./about.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "About | The GUIDON Archives" };

export default async function AboutPage() {
  // Decorative cover wall: 36 random covers, 6 per group, 3 groups per column, 2 columns.
  // Pulls from any issues with a resolvable cover. Falls back to empty when D1 is empty.
  const sample = await listIssues({ pageSize: 36 });
  const covers = sample.issues
    .map((issue) => {
      const key = coverKey({
        id: issue.id,
        isLegacy: issue.isLegacy,
        coverUploaded: issue.coverUploaded,
        hasPages: issue.hasPages,
      });
      return key ? publicUrl(key) : null;
    })
    .filter((url): url is string => url != null);

  const archivesEntries = Object.entries(ArchivesData);

  return (
    <div id="about">
      {covers.length > 0 && (
        <div className="covers">
          {[0, 1].map((colIdx) => (
            <div className={`col ${colIdx === 0 ? "left" : "right"}`} key={`col-${colIdx}`}>
              {[0, 1, 2].map((groupIdx) => (
                <div className="group" key={`col-${colIdx}-group-${groupIdx}`}>
                  {covers.map((url, i) => (
                    <div className="cover-container" key={`col-${colIdx}-group-${groupIdx}-img-${i}`}>
                      <img src={url} className="cover" alt="" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <main className="content general-padding-top">
        <p className="subheader first">About</p>
        <h2>The GUIDON Archives</h2>
        <hr className="first" />

        <div className="text-content">
          <p className="text">
            The Archives is a collection of{" "}
            <span className="nowrap">The GUIDON&apos;s</span> published content
            since 1929, chronicling its history as the official student
            publication of the Ateneo de Manila University. It contains
            physical broadsheets, magazines, and primers all in one place.
          </p>
          <p className="text">
            In this increasingly digitized sphere,{" "}
            <span className="nowrap">The GUIDON</span> is ensuring that its
            rich historical and contemporary publications remain easily
            accessible to all. Through a digital platform, students and alumni
            can explore the journalism of{" "}
            <span className="nowrap">The GUIDON</span> with just a few clicks.
          </p>
          <p className="text">
            Email <a href="mailto:desk@theguidon.com">desk@theguidon.com</a>{" "}
            for any comments, suggestions, or inquiries.
          </p>
        </div>

        <p className="subheader second">
          In partnership with the University Archives
        </p>
        <hr className="second" />
        <p className="text about-ua">
          The University Archives (UA) safeguards the institutional memory of
          the Ateneo de Manila University as the central repository of
          official and historical records and other related materials.
        </p>

        <div className="rows-container">
          {archivesEntries.map(([key, entry]) => (
            <div className="row" key={`row-${key}`}>
              {entry.icon}
              <p dangerouslySetInnerHTML={{ __html: entry.text }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
