import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues } from "@/lib/schema";
import { eq } from "drizzle-orm";

type FinalizeBody = {
  hasPdf?: boolean;
  hasPages?: boolean;
  coverUploaded?: boolean;
  numPages?: number;
  status?: "draft" | "processing" | "ready";
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await req.json()) as FinalizeBody;

  await db.update(issues).set({
    hasPdf: body.hasPdf ?? undefined,
    hasPages: body.hasPages ?? undefined,
    coverUploaded: body.coverUploaded ?? undefined,
    numPages: body.numPages ?? undefined,
    status: body.status ?? undefined,
    updatedAt: new Date(),
  }).where(eq(issues.id, id));

  return NextResponse.json({ ok: true });
}
