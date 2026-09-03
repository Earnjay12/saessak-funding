"use server";

import { revalidatePath } from "next/cache";
import { getDb, type PledgeError } from "@/lib/db";
import { assertStudent } from "@/lib/session";
import { UNIT } from "@/lib/config";

export type PledgeState = { ok?: boolean; message?: string; balance?: number };

const MESSAGES: Record<PledgeError, string> = {
  invalid_amount: "1개 이상의 정수로 입력해 주세요.",
  closed: "지금은 펀딩이 마감되어 심거나 취소할 수 없어요.",
  no_student: "계정을 찾을 수 없어요. 다시 로그인해 주세요.",
  insufficient: `가진 ${UNIT}보다 많이 심을 수는 없어요.`,
  not_found: "펀딩 기록을 찾을 수 없어요.",
};

export async function pledge(_prev: PledgeState, form: FormData): Promise<PledgeState> {
  const student = await assertStudent();
  const projectId = String(form.get("project_id") ?? "");
  const amount = Number(String(form.get("amount") ?? "").trim());
  if (!projectId) return { ok: false, message: "프로젝트 정보가 없어요." };

  const db = await getDb();
  const result = await db.makePledge(student.id, projectId, amount);
  if (!result.ok) return { ok: false, message: MESSAGES[result.error] };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/me");
  return { ok: true, message: `${UNIT} ${amount}개를 심었어요! 남은 ${UNIT}: ${result.balance}개`, balance: result.balance };
}

export async function cancelPledge(form: FormData): Promise<void> {
  const student = await assertStudent();
  const pledgeId = String(form.get("pledge_id") ?? "");
  const projectId = String(form.get("project_id") ?? "");
  const db = await getDb();
  await db.cancelPledge(student.id, pledgeId);
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  revalidatePath("/me");
}
