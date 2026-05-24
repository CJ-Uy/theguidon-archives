import { NextResponse } from "next/server";
import { getR2 } from "@/lib/storage";

export const runtime = "edge";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  const allowedPrefixes = ["pdfs/", "covers/", "pages/"];
  if (!allowedPrefixes.some((p) => key.startsWith(p))) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const r2 = getR2();
  if (!r2) {
    return NextResponse.json({ error: "R2 binding unavailable" }, { status: 500 });
  }

  if (!req.body) {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";

  await r2.put(key, req.body, { httpMetadata: { contentType } });

  return new NextResponse(null, { status: 204 });
}
