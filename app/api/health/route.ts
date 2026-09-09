/**
 * 설정 점검 페이지. /api/health 로 열면 환경 변수와 데이터베이스 연결 상태를 보여줍니다.
 * 비밀 값은 노출하지 않고, 있는지 여부와 형태만 알려줍니다.
 */
import { getDb, usingSupabase } from "@/lib/db";
import { normalizeSupabaseUrl } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

function host(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** legacy JWT 키 안에 적힌 역할(anon / service_role)만 읽어냅니다. 키 자체는 노출하지 않습니다. */
function jwtRole(key: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function keyKind(key: string): string {
  if (!key) return "없음";
  if (key.startsWith("eyJ")) {
    const role = jwtRole(key);
    if (role === "service_role") return "legacy service_role key (정상)";
    if (role === "anon") return "legacy anon key (잘못됨: service_role 키가 필요)";
    return "legacy JWT (역할 불명)";
  }
  if (key.startsWith("sb_secret_")) return "secret key (정상)";
  if (key.startsWith("sb_publishable_")) return "publishable key (잘못됨: secret key 가 필요)";
  return "알 수 없는 형식";
}

export async function GET() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const normalized = normalizeSupabaseUrl(url);

  const info: Record<string, unknown> = {
    mode: usingSupabase ? "supabase" : "local-file",
    supabase_url_host: host(normalized),
    supabase_url_used: normalized,
    supabase_url_auto_fixed: normalized !== url.trim(),
    supabase_url_looks_ok: /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(normalized),
    key_present: key.length > 0,
    key_length: key.trim().length,
    key_kind: keyKind(key.trim()),
    key_has_whitespace: /\s/.test(key),
    session_secret_present: Boolean(process.env.SESSION_SECRET),
    admin_password_present: Boolean(process.env.ADMIN_PASSWORD),
  };

  try {
    const db = await getDb();
    const [students, projects, settings] = await Promise.all([db.listStudents(), db.listProjects(), db.getSettings()]);
    info.db = { ok: true, students: students.length, projects: projects.length, funding_open: settings.funding_open };
  } catch (e) {
    info.db = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return Response.json(info, { headers: { "Cache-Control": "no-store" } });
}
