import { NextResponse } from "next/server";
import { getR2Credentials, presignPutUrl, r2Keys } from "@/lib/storage";

const EXPIRES_SECONDS = 3600;

type UrlsBody = {
  pdf?: boolean;
  cover?: boolean;
  pages?: number;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await req.json()) as UrlsBody;

  const creds = getR2Credentials();
  if (!creds) {
    return NextResponse.json({ error: "R2 credentials not configured" }, { status: 500 });
  }

  const common = {
    ...creds,
    expiresInSeconds: EXPIRES_SECONDS,
  };

  const result: { pdf?: string; cover?: string; pages?: string[] } = {};

  if (body.pdf) {
    result.pdf = await presignPutUrl({ ...common, key: r2Keys.pdf(id) });
  }
  if (body.cover) {
    result.cover = await presignPutUrl({ ...common, key: r2Keys.cover(id) });
  }
  if (body.pages && body.pages > 0) {
    const urls: string[] = [];
    for (let i = 1; i <= body.pages; i++) {
      urls.push(await presignPutUrl({ ...common, key: r2Keys.page(id, i) }));
    }
    result.pages = urls;
  }

  return NextResponse.json(result);
}
