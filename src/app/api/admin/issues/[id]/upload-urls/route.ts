import { NextResponse } from "next/server";
import { getR2, getR2Credentials, presignPutUrl, r2Keys } from "@/lib/storage";

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

  const keys: { pdf?: string; cover?: string; pages?: string[] } = {};
  if (body.pdf) keys.pdf = r2Keys.pdf(id);
  if (body.cover) keys.cover = r2Keys.cover(id);
  if (body.pages && body.pages > 0) {
    keys.pages = [];
    for (let i = 1; i <= body.pages; i++) keys.pages.push(r2Keys.page(id, i));
  }

  const binding = getR2();
  if (binding) {
    const proxyUrl = (key: string) => `/api/admin/r2/${key}`;
    const result: { pdf?: string; cover?: string; pages?: string[] } = {};
    if (keys.pdf) result.pdf = proxyUrl(keys.pdf);
    if (keys.cover) result.cover = proxyUrl(keys.cover);
    if (keys.pages) result.pages = keys.pages.map(proxyUrl);
    return NextResponse.json(result);
  }

  const creds = getR2Credentials();
  if (!creds) {
    return NextResponse.json(
      { error: "R2 unavailable: no binding and no CLOUDFLARE_R2_* env vars" },
      { status: 500 },
    );
  }

  const common = { ...creds, expiresInSeconds: EXPIRES_SECONDS };
  const result: { pdf?: string; cover?: string; pages?: string[] } = {};
  if (keys.pdf) result.pdf = await presignPutUrl({ ...common, key: keys.pdf });
  if (keys.cover) result.cover = await presignPutUrl({ ...common, key: keys.cover });
  if (keys.pages) {
    result.pages = await Promise.all(
      keys.pages.map((key) => presignPutUrl({ ...common, key })),
    );
  }
  return NextResponse.json(result);
}
