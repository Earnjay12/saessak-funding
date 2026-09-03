import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelPledge } from "@/app/actions/pledges";
import { ImageCarousel } from "@/components/ImageCarousel";
import { PledgeForm } from "@/components/PledgeForm";
import { Creator, SpecTable } from "@/components/ProductInfo";
import { RankChip } from "@/components/ProjectCard";
import { StudentShell } from "@/components/StudentShell";
import { UNIT, UNIT_EMOJI } from "@/lib/config";
import { getDb } from "@/lib/db";
import { fmt, fmtDateTime, rankProjects, shareOfTop, stage, topRaised } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await requireStudent();
  const db = await getDb();
  const [project, all, settings, myPledgesRaw] = await Promise.all([
    db.getProject(id),
    db.listProjects(),
    db.getSettings(),
    db.listPledges({ studentId: student.id, projectId: id }),
  ]);
  if (!project) notFound();

  const open = settings.funding_open;
  const rank = rankProjects(all).get(project.id);
  const st = stage(shareOfTop(project.raised, topRaised(all)));
  const myPledges = myPledgesRaw.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const mine = myPledges.reduce((s, p) => s + p.amount, 0);

  return (
    <StudentShell student={student}>
      <Link href="/projects" className="mb-3 inline-block text-sm text-soil-700 hover:underline">
        ← 상품 목록
      </Link>

      <article className="card p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <ImageCarousel images={project.images} placeholder={UNIT_EMOJI} />

          <div className="flex flex-col gap-3">
            <div>
              {project.summary && <div className="text-base font-bold text-tag">{project.summary}</div>}
              <h1 className="text-2xl font-extrabold leading-snug">{project.title}</h1>
              <Creator creator={project.creator} className="mt-1 text-base" />
            </div>

            <SpecTable specs={project.specs} />

            <div className="mt-auto rounded-xl bg-leaf-50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{st.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-leaf-800">{st.label}</div>
                  <div className="text-xs text-soil-700">{fmt(project.backers)}명이 함께 심었어요</div>
                </div>
                {rank !== undefined && project.raised > 0 && (
                  <div className="text-right">
                    <RankChip rank={rank} />
                    <div className="mt-0.5 text-[11px] text-soil-700">{all.length}개 중</div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-leaf-100 pt-3">
                <span className="text-sm text-soil-700">총 펀딩</span>
                <span className="text-3xl font-extrabold text-leaf-700">
                  {fmt(project.raised)} <span className="text-base font-semibold">{UNIT}</span>
                </span>
              </div>
            </div>

            {open ? (
              <PledgeForm projectId={project.id} balance={student.balance} unit={UNIT} emoji={UNIT_EMOJI} />
            ) : (
              <div
                className={`rounded-xl p-5 text-center ${rank === 1 && project.raised > 0 ? "bg-amber-50" : "bg-soil-100"}`}
              >
                <div className="text-3xl">{rank === 1 && project.raised > 0 ? "🏆" : "🏁"}</div>
                <p className="mt-1 font-bold">
                  {rank === 1 && project.raised > 0 ? "펀딩 1위로 마감했어요!" : "펀딩이 마감됐어요"}
                </p>
                <p className="mt-1 text-sm text-soil-700">
                  {rank !== undefined && project.raised > 0 && `최종 ${rank}위 · `}
                  {fmt(project.backers)}명이 {UNIT} {fmt(project.raised)}개를 심었어요.
                </p>
              </div>
            )}
          </div>
        </div>
      </article>

      <section className="card mt-5 p-5">
        <h2 className="mb-3 text-base font-bold">
          내가 심은 {UNIT}: {fmt(mine)}개
        </h2>
        {myPledges.length === 0 ? (
          <p className="text-sm text-soil-700">
            아직 이 상품에 심은 {UNIT}이 없어요.
            {open && ` 마감 전에는 심은 ${UNIT}을 취소하고 다른 곳에 심을 수 있어요.`}
          </p>
        ) : (
          <ul className="divide-y divide-soil-100">
            {myPledges.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <b>{p.amount}개</b> <span className="text-soil-700">· {fmtDateTime(p.created_at)}</span>
                </span>
                {open && (
                  <form action={cancelPledge}>
                    <input type="hidden" name="pledge_id" value={p.id} />
                    <input type="hidden" name="project_id" value={project.id} />
                    <button type="submit" className="btn-ghost px-2 py-1 text-xs text-red-600">
                      취소
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </StudentShell>
  );
}
