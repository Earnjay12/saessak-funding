import type { DB } from "./types";
export * from "./types";

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let cached: DB | null = null;

export async function getDb(): Promise<DB> {
  if (cached) return cached;
  cached = usingSupabase ? (await import("./supabase")).supabaseDb : (await import("./local")).localDb;
  return cached;
}
