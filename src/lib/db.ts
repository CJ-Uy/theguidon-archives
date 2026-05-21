import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

type DbClient = ReturnType<typeof drizzleD1<typeof schema>>;

async function d1Fetch(
  accountId: string,
  databaseId: string,
  token: string,
  sql: string,
  params: unknown[],
  method: "run" | "all" | "values" | "get",
): Promise<{ rows: unknown[][] }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );

  if (!response.ok) {
    throw new Error(`D1 HTTP ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    result: Array<{ results: Record<string, unknown>[]; success: boolean }>;
    success: boolean;
    errors: { message: string }[];
  };

  if (!data.success) {
    throw new Error(`D1 query failed: ${data.errors?.[0]?.message ?? "unknown"}`);
  }

  if (method === "run") return { rows: [] };

  const result = data.result?.[0];
  if (!result?.results?.length) return { rows: [] };

  const cols = Object.keys(result.results[0]);
  const rows = result.results.map((row) => cols.map((col) => row[col]));

  return { rows: method === "get" ? (rows[0] as unknown as unknown[][]) : rows };
}

function createNativeClient(): DbClient | null {
  try {
    const ctx = getCloudflareContext();
    const d1 = (ctx.env as unknown as { DB: D1Database }).DB;
    if (d1) return drizzleD1(d1, { schema });
  } catch {
    // Context not available (e.g. dev mode race condition)
  }
  return null;
}

function createHttpClient(): DbClient {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  if (!accountId || !databaseId || !token) {
    throw new Error(
      "D1 binding unavailable and CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_D1_TOKEN env vars not set",
    );
  }

  return drizzleProxy(
    async (sql, params, method) =>
      d1Fetch(accountId, databaseId, token, sql, params, method),
    { schema },
  ) as unknown as DbClient;
}

const globalForDb = globalThis as unknown as { db: DbClient | undefined };
const isDev = process.env.NODE_ENV === "development";

export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    if (!globalForDb.db) {
      if (isDev) {
        globalForDb.db = createHttpClient();
      } else {
        globalForDb.db = createNativeClient() ?? createHttpClient();
      }
    }
    return (globalForDb.db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
