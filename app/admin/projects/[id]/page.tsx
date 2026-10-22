import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject, updateProject } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PledgeReasonList } from "@/components/PledgeReasonList";
import { ProjectForm } from "@/components/ProjectForm";
import { UNIT } from "@/lib/config";
import { getDb } from "@/lib/db";
import { fmt } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = await getDb();
  const [project, pledges] = await Promise.all([db.getProject(id), db.listPledges({ projectId: id })]);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/projects" className="mb-3 inline-block text-sm text-soil-700 hover:underline">
        ← 상품 목록
      </Link>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-xl font-extrabold">상품 수정</h1>
        <Link href={`/projects/${project.id}`} className="text-sm text-soil-700 hover:underline" target="_blank">
          학생 화면에서 보기 ↗
        </Link>
      </div>

      <section className="card mb-6 overflow-hidden">
        <div className="flex items-baseline justify-between p-4">
          <h2 className="text-base font-bold">펀딩 내역과 이유</h2>
          <span className="text-sm">
            총 <b className="text-leaf-700">{fmt(project.raised)}</b> {UNIT} · {fmt(project.backers)}명
          </span>
        </div>
        <div className="border-t border-soil-100">
          <PledgeReasonList pledges={pledges} />
        </div>
      </section>

      <ProjectForm action={updateProject.bind(null, project.id)} project={project} submitLabel="저장" />

      <section className="card mt-8 border-red-100 p-5">
        <h2 className="text-base font-bold text-red-700">상품 삭제</h2>
        <p className="mt-1 text-sm text-soil-700">
          이 상품에 심긴 {UNIT} {fmt(project.raised)}개는 학생들에게 돌려주고, 심은 이유 기록도 함께 지워집니다.
          되돌릴 수 없습니다.
        </p>
        <form action={deleteProject} className="mt-3">
          <input type="hidden" name="id" value={project.id} />
          <ConfirmButton message={`"${project.title}" 상품을 정말 삭제할까요?`}>삭제하기</ConfirmButton>
        </form>
      </section>
    </div>
  );
}
