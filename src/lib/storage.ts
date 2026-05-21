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
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_BASE_URL is not set");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}

type PresignParams = {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
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
    `https://${params.accountId}.r2.cloudflarestorage.com/${params.bucket}/${params.key}`,
  );
  url.searchParams.set("X-Amz-Expires", String(params.expiresInSeconds));

  const signed = await client.sign(
    new Request(url, { method: "PUT" }),
    { aws: { signQuery: true } },
  );

  return signed.url;
}

export type R2Binding = R2Bucket;

export function getR2(): R2Binding {
  const ctx = getCloudflareContext();
  const env = ctx.env as unknown as { R2: R2Bucket };
  if (!env.R2) {
    throw new Error("R2 binding not available on Cloudflare context");
  }
  return env.R2;
}
