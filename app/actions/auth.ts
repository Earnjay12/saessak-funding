"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ADMIN_ID } from "@/lib/config";
import { clearSession, createSession } from "@/lib/session";
import { studentId } from "@/lib/passwords";

export type LoginState = { error?: string };

function num(v: FormDataEntryValue | null): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function loginStudent(_prev: LoginState, form: FormData): Promise<LoginState> {
  const grade = num(form.get("grade"));
  const klass = num(form.get("class"));
  const number = num(form.get("number"));
  const password = String(form.get("password") ?? "").trim();
  if (!grade || !klass || !number) return { error: "학년, 반, 번호를 숫자로 입력해 주세요." };
  if (!password) return { error: "비밀번호를 입력해 주세요." };

  const db = await getDb();
  const student = await db.getStudent(studentId(grade, klass, number));
  if (!student || student.password !== password) {
    return { error: "학년·반·번호 또는 비밀번호가 맞지 않아요. 나눠받은 카드를 다시 확인해 주세요." };
  }
  await createSession({ role: "student", id: student.id });
  redirect("/projects");
}

export async function loginAdmin(_prev: LoginState, form: FormData): Promise<LoginState> {
  const id = String(form.get("id") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다." };
  if (id !== ADMIN_ID || password !== expected) return { error: "아이디 또는 비밀번호가 맞지 않습니다." };
  await createSession({ role: "admin", id: ADMIN_ID });
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/");
}
