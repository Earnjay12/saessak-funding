import Link from "next/link";
import { createProject } from "@/app/actions/admin";
import { ProjectForm } from "@/components/ProjectForm";
import { requireAdmin } from "@/lib/session";

export default async function NewProjectPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/projects" className="mb-3 inline-block text-sm text-soil-700 hover:underline">
        ← 상품 목록
      </Link>
      <h1 className="mb-4 text-xl font-extrabold">새 상품</h1>
      <ProjectForm action={createProject} submitLabel="상품 올리기" />
    </div>
  );
}
