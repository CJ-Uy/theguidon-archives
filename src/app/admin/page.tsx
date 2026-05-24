import Link from "next/link";
import { db } from "@/lib/db";
import { issues } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Plus } from "lucide-react";
import IssueDeleteButton from "@/components/admin/issue-delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Issues | Admin" };

export default async function AdminIssuesPage() {
  const rows = await db
    .select({
      id: issues.id,
      slug: issues.slug,
      title: issues.title,
      datePublished: issues.datePublished,
      status: issues.status,
      isLegacy: issues.isLegacy,
      hasPdf: issues.hasPdf,
      hasPages: issues.hasPages,
      coverUploaded: issues.coverUploaded,
      numPages: issues.numPages,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .orderBy(desc(issues.datePublished));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Issues</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            All releases in the archive. {rows.length} total.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/upload">
            <Plus className="h-4 w-4" />
            New issue
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All entries</CardTitle>
          <CardDescription>Edit metadata or remove the issue (and its R2 assets).</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
              No issues yet.{" "}
              <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin/upload">
                Upload your first one.
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <Link
                          href={`/issue/${r.slug}`}
                          className="truncate hover:underline"
                          target="_blank"
                        >
                          {r.title}
                        </Link>
                        <span className="truncate text-xs text-muted-foreground">{r.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(r.datePublished)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "ready" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                      {r.isLegacy && (
                        <Badge variant="outline" className="ml-1.5">
                          legacy
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-wrap gap-1.5">
                        {r.hasPdf && <Badge variant="outline">PDF</Badge>}
                        {r.coverUploaded && <Badge variant="outline">Cover</Badge>}
                        {r.hasPages && (
                          <Badge variant="outline">{r.numPages} pages</Badge>
                        )}
                        {!r.hasPdf && !r.coverUploaded && !r.hasPages && (
                          <span>—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/issues/${r.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <IssueDeleteButton id={r.id} title={r.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
