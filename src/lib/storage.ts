import { AwsClient } from "aws4fetch";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const r2Keys = {
  pdf: (id: number) => `pdfs/${id}.pdf`,
  page: (id: number, pageNum: number) => `pages/${id}/${pageNum}.webp`,
  cover: (id: number) => `covers/${id}.webp`,
} as const;

export type CoverInput = {
  id: number;
  isLegacy: boolean;
  coverUploaded: boolean;
  hasPages: boolean;
};

export function coverKey(input: CoverInput): string | null {
  if (input.coverUploaded) return r2Keys.cover(input.id);
  if (!input.isLegacy && input.hasPages) return r2Keys.page(input.id, 1);
  return null;
}

export function publicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!base) {
    if (typeof console !== "undefined") {
      console.warn("NEXT_PUBLIC_R2_PUBLIC_BASE_URL is not set; returning empty URL for", key);
    }
    return "";
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}

type PresignParams = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  key: string;
  expiresInSeconds: number;
};

export async function presignPutUrl(params: PresignParams): Promise<string> {
  const client = new AwsClient({
    accessKeyId: params.accessKeyId,
    secretAccessKey: params.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const url = new URL(
    `${params.endpoint.replace(/\/$/, "")}/${params.bucket}/${params.key}`,
  );
  url.searchParams.set("X-Amz-Expires", String(params.expiresInSeconds));

  const signed = await client.sign(
    new Request(url, { method: "PUT" }),
    { aws: { signQuery: true } },
  );

  return signed.url;
}

export type R2Binding = R2Bucket;

export function getR2(): R2Binding | null {
  try {
    const ctx = getCloudflareContext();
    const env = ctx.env as unknown as { R2?: R2Bucket };
    return env.R2 ?? null;
  } catch {
    return null;
  }
}

export async function deleteIssueAssets(id: number): Promise<void> {
  const binding = getR2();
  if (binding) {
    const keys = [r2Keys.pdf(id), r2Keys.cover(id)];
    const pageList = await binding.list({ prefix: `pages/${id}/` });
    for (const obj of pageList.objects) keys.push(obj.key);
    if (keys.length > 0) await binding.delete(keys);
    return;
  }

  const creds = getR2Credentials();
  if (!creds) {
    throw new Error("R2 unavailable: no binding and no CLOUDFLARE_R2_* env vars");
  }

  const client = new AwsClient({
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const baseUrl = `${creds.endpoint.replace(/\/$/, "")}/${creds.bucket}`;
  const targets = [r2Keys.pdf(id), r2Keys.cover(id)];

  const listUrl = new URL(baseUrl);
  listUrl.searchParams.set("list-type", "2");
  listUrl.searchParams.set("prefix", `pages/${id}/`);
  const listResp = await client.fetch(listUrl.toString());
  if (listResp.ok) {
    const text = await listResp.text();
    const matches = text.matchAll(/<Key>([^<]+)<\/Key>/g);
    for (const m of matches) targets.push(m[1]);
  }

  await Promise.all(
    targets.map((key) =>
      client.fetch(`${baseUrl}/${key}`, { method: "DELETE" }),
    ),
  );
}

export type R2Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
};

export const R2_BUCKET = "theguidon-archives";

export function getR2Credentials(): R2Credentials | null {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  if (!accessKeyId || !secretAccessKey || !endpoint) return null;
  return { accessKeyId, secretAccessKey, endpoint, bucket: R2_BUCKET };
}
