import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, type Student } from "./db";

export type Session = { role: "student" | "admin"; id: string };

const COOKIE = "sf_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

declare global {
  // 서버 프로세스가 살아 있는 동안만 유지되는 임시 비밀키 (SESSION_SECRET 이 없을 때)
  // eslint-disable-next-line no-var
  var __sfSessionKey: Uint8Array | undefined;
}

function key(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (s) return new TextEncoder().encode(s);
  if (process.env.VERCEL) {
    throw new Error("SESSION_SECRET 환경 변수를 설정해야 합니다. (Vercel > Settings > Environment Variables)");
  }
  if (!globalThis.__sfSessionKey) globalThis.__sfSessionKey = new Uint8Array(randomBytes(32));
  return globalThis.__sfSessionKey;
}

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  const h = await headers();
  const secure = h.get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if ((payload.role === "student" || payload.role === "admin") && typeof payload.id === "string") {
      return { role: payload.role, id: payload.id };
    }
  } catch {
    // 만료되었거나 위조된 토큰
  }
  return null;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** 학생 페이지용. 로그인이 안 되어 있으면 첫 화면으로 보냅니다. */
export async function requireStudent(): Promise<Student> {
  const s = await getSession();
  if (!s || s.role !== "student") redirect("/");
  const student = await (await getDb()).getStudent(s.id);
  if (!student) redirect("/?expired=1");
  return student;
}

/** 관리자 페이지용. */
export async function requireAdmin(): Promise<void> {
  const s = await getSession();
  if (!s || s.role !== "admin") redirect("/?admin=1");
}

/** 서버 액션 안에서 쓰는 검사. 실패하면 예외를 던집니다. */
export async function assertAdmin(): Promise<void> {
  const s = await getSession();
  if (!s || s.role !== "admin") throw new Error("관리자만 할 수 있습니다.");
}

export async function assertStudent(): Promise<Student> {
  const s = await getSession();
  if (!s || s.role !== "student") throw new Error("로그인이 필요합니다.");
  const student = await (await getDb()).getStudent(s.id);
  if (!student) throw new Error("계정을 찾을 수 없습니다.");
  return student;
}
