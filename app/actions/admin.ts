"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, type ProjectInput } from "@/lib/db";
import { assertAdmin } from "@/lib/session";
import { generatePassword, studentId } from "@/lib/passwords";
import { MAX_IMAGES, STARTING_BALANCE } from "@/lib/config";

export type FormState = { error?: string; message?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** 새로 올린 사진들을 저장하고 URL 목록을 돌려줍니다. */
async function uploadNewImages(form: FormData): Promise<string[]> {
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const db = await getDb();
  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error("사진은 한 장에 5MB 이하여야 합니다.");
    const ext = EXT[file.type];
    if (!ext) throw new Error("JPG, PNG, WEBP, GIF 사진만 올릴 수 있습니다.");
    const buf = Buffer.from(await file.arrayBuffer());
    urls.push(await db.uploadImage(buf, file.type, ext));
  }
  return urls;
}

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function parseProject(form: FormData): Omit<ProjectInput, "images"> {
  const title = text(form, "title");
  if (!title) throw new Error("상품명을 입력해 주세요.");
  return {
    title,
    summary: text(form, "summary"),
    creator: text(form, "creator"),
    specs: text(form, "specs"),
  };
}

function keptImages(form: FormData): string[] {
  return form
    .getAll("keep_images")
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function createProject(_prev: FormState, form: FormData): Promise<FormState> {
  await assertAdmin();
  try {
    const base = parseProject(form);
    const images = await uploadNewImages(form);
    if (images.length > MAX_IMAGES) throw new Error(`사진은 ${MAX_IMAGES}장까지 올릴 수 있습니다.`);
    await (await getDb()).createProject({ ...base, images });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "저장하지 못했습니다." };
  }
  revalidatePath("/projects");
  revalidatePath("/admin");
  redirect("/admin/projects");
}

export async function updateProject(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await assertAdmin();
  try {
    const base = parseProject(form);
    const images = [...keptImages(form), ...(await uploadNewImages(form))];
    if (images.length > MAX_IMAGES) throw new Error(`사진은 ${MAX_IMAGES}장까지 올릴 수 있습니다.`);
    await (await getDb()).updateProject(id, { ...base, images });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "저장하지 못했습니다." };
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${id}`);
  return { message: "저장했습니다." };
}

export async function deleteProject(form: FormData): Promise<void> {
  await assertAdmin();
  const id = String(form.get("id") ?? "");
  if (id) await (await getDb()).deleteProject(id);
  revalidatePath("/projects");
  revalidatePath("/admin");
  redirect("/admin/projects");
}

export async function setFundingOpen(form: FormData): Promise<void> {
  await assertAdmin();
  const open = String(form.get("open")) === "true";
  await (await getDb()).updateSettings({ funding_open: open });
  revalidatePath("/projects");
  revalidatePath("/me");
  revalidatePath("/admin");
}

export async function createStudents(_prev: FormState, form: FormData): Promise<FormState> {
  await assertAdmin();
  const grade = Number(form.get("grade"));
  const klass = Number(form.get("class"));
  const count = Number(form.get("count"));
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) return { error: "학년은 1에서 12 사이여야 합니다." };
  if (!Number.isInteger(klass) || klass < 1 || klass > 99) return { error: "반은 1에서 99 사이여야 합니다." };
  if (!Number.isInteger(count) || count < 1 || count > 60) return { error: "인원은 1에서 60 사이여야 합니다." };

  const rows = Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    return {
      id: studentId(grade, klass, number),
      grade,
      class: klass,
      number,
      password: generatePassword(),
      balance: STARTING_BALANCE,
    };
  });
  const { created, skipped } = await (await getDb()).createStudents(rows);
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return {
    message:
      skipped > 0
        ? `${grade}학년 ${klass}반 계정 ${created}개를 만들었습니다. 이미 있던 ${skipped}개는 그대로 두었습니다.`
        : `${grade}학년 ${klass}반 계정 ${created}개를 만들었습니다.`,
  };
}

export async function deleteStudents(form: FormData): Promise<void> {
  await assertAdmin();
  const grade = form.get("grade") ? Number(form.get("grade")) : undefined;
  const klass = form.get("class") ? Number(form.get("class")) : undefined;
  await (await getDb()).deleteStudents({ grade, class: klass });
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

export async function resetPledges(): Promise<void> {
  await assertAdmin();
  await (await getDb()).resetPledges(STARTING_BALANCE);
  revalidatePath("/projects");
  revalidatePath("/admin");
}
