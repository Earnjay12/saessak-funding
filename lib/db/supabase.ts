/**
 * Supabase 저장소. SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 있을 때 사용합니다.
 * 서버에서만 호출되므로 서비스 키가 브라우저로 나가지 않습니다.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { DB, Pledge, PledgeResult, Project, ProjectWithStats, Settings, Student } from "./types";
import { DEFAULT_SETTINGS, normalizeProject } from "./types";

const BUCKET = "photos";
const SETTINGS_KEY = "funding";

/**
 * SUPABASE_URL 을 "https://xxxx.supabase.co" 형태로 정리합니다.
 * 대시보드의 REST URL(…/rest/v1)을 복사해 넣어도 동작하도록 뒤에 붙은 경로와 공백을 떼어냅니다.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  try {
    return new URL(t).origin;
  } catch {
    return t;
  }
}

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(
      normalizeSupabaseUrl(process.env.SUPABASE_URL),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}

function fail(e: { message: string } | null, where: string): never {
  throw new Error(`[supabase:${where}] ${e?.message ?? "unknown error"}`);
}

async function statsMap(): Promise<Map<string, { raised: number; backers: number }>> {
  const { data, error } = await sb().from("project_stats").select("project_id, raised, backers");
  if (error) fail(error, "project_stats");
  const m = new Map<string, { raised: number; backers: number }>();
  for (const r of data ?? []) m.set(r.project_id, { raised: r.raised ?? 0, backers: r.backers ?? 0 });
  return m;
}

export const supabaseDb: DB = {
  async getStudent(id) {
    const { data, error } = await sb().from("students").select("*").eq("id", id).maybeSingle();
    if (error) fail(error, "getStudent");
    return (data as Student) ?? null;
  },
  async listStudents() {
    const { data, error } = await sb()
      .from("students")
      .select("*")
      .order("grade")
      .order("class")
      .order("number");
    if (error) fail(error, "listStudents");
    return (data ?? []) as Student[];
  },
  async createStudents(rows) {
    const { data, error } = await sb()
      .from("students")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      .select("id");
    if (error) fail(error, "createStudents");
    const created = data?.length ?? 0;
    return { created, skipped: rows.length - created };
  },
  async deleteStudents(filter) {
    let q = sb().from("students").delete();
    if (filter.grade !== undefined) q = q.eq("grade", filter.grade);
    if (filter.class !== undefined) q = q.eq("class", filter.class);
    if (filter.grade === undefined && filter.class === undefined) q = q.neq("id", "");
    const { data, error } = await q.select("id");
    if (error) fail(error, "deleteStudents");
    return data?.length ?? 0;
  },

  async listProjects() {
    const [{ data, error }, stats] = await Promise.all([
      sb().from("projects").select("*").order("created_at", { ascending: false }),
      statsMap(),
    ]);
    if (error) fail(error, "listProjects");
    return ((data ?? []) as Project[]).map((p) => ({
      ...normalizeProject(p),
      ...(stats.get(p.id) ?? { raised: 0, backers: 0 }),
    }));
  },
  async getProject(id) {
    const [{ data, error }, stats] = await Promise.all([
      sb().from("projects").select("*").eq("id", id).maybeSingle(),
      statsMap(),
    ]);
    if (error) fail(error, "getProject");
    if (!data) return null;
    return { ...normalizeProject(data as Project), ...(stats.get(id) ?? { raised: 0, backers: 0 }) } as ProjectWithStats;
  },
  async createProject(input) {
    const { data, error } = await sb().from("projects").insert(input).select("*").single();
    if (error) fail(error, "createProject");
    return normalizeProject(data as Project);
  },
  async updateProject(id, patch) {
    const { error } = await sb().from("projects").update(patch).eq("id", id);
    if (error) fail(error, "updateProject");
  },
  async deleteProject(id) {
    const { error } = await sb().rpc("delete_project_with_refund", { p_project_id: id });
    if (error) fail(error, "deleteProject");
  },

  async listPledges(filter = {}) {
    let q = sb().from("pledges").select("*").order("created_at", { ascending: false });
    if (filter.studentId) q = q.eq("student_id", filter.studentId);
    if (filter.projectId) q = q.eq("project_id", filter.projectId);
    const { data, error } = await q;
    if (error) fail(error, "listPledges");
    return (data ?? []) as Pledge[];
  },
  async makePledge(studentId, projectId, amount) {
    const { data, error } = await sb().rpc("make_pledge", {
      p_student_id: studentId,
      p_project_id: projectId,
      p_amount: amount,
    });
    if (error) fail(error, "makePledge");
    return data as PledgeResult;
  },
  async cancelPledge(studentId, pledgeId) {
    const { data, error } = await sb().rpc("cancel_pledge", {
      p_student_id: studentId,
      p_pledge_id: pledgeId,
    });
    if (error) fail(error, "cancelPledge");
    return data as PledgeResult;
  },
  async resetPledges(startingBalance) {
    const { error } = await sb().rpc("reset_pledges", { p_balance: startingBalance });
    if (error) fail(error, "resetPledges");
  },

  async getSettings() {
    const { data, error } = await sb().from("settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
    if (error) fail(error, "getSettings");
    return { ...DEFAULT_SETTINGS, ...((data?.value as Partial<Settings>) ?? {}) };
  },
  async updateSettings(patch) {
    const next = { ...(await this.getSettings()), ...patch };
    const { error } = await sb().from("settings").upsert({ key: SETTINGS_KEY, value: next }, { onConflict: "key" });
    if (error) fail(error, "updateSettings");
    return next;
  },

  async uploadImage(data, contentType, ext) {
    const name = `${randomUUID()}.${ext}`;
    const { error } = await sb().storage.from(BUCKET).upload(name, data, { contentType, upsert: false });
    if (error) fail(error, "uploadImage");
    return sb().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  },
};
