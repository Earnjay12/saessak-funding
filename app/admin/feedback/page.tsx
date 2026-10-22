import Link from "next/link";
import { PledgeReasonList } from "@/components/PledgeReasonList";
import { RankChip } from "@/components/ProjectCard";
import { UNIT, UNIT_EMOJI } from "@/lib/config";
import { getDb, type Pledge } from "@/lib/db";
import { fmt, rankProjects } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function FeedbackPage() {
  await requireAdmin();
  const db = await getDb();
  const [projects, pledges] = await Promise.all([db.listProjects(), db.listPledges()]);
  const ranks = rankProjects(projects);
  const byProject = new Map<string, Pledge[]>();
  for (const p of pledges) byProject.set(p.project_id, [...(byProject.get(p.project_id) ?? []), p]);
  const ranked = projects.slice().sort((a, b) => b.raised - a.raised);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">상품별 심은 이유</h1>
          <p className="text-sm text-soil-700">
            상품마다 학생들이 {UNIT}을 몇 개 심었고 왜 그렇게 했는지 볼 수 있습니다. 총 {fmt(pledges.length)}건.
          </p>
        </div>
        <a href="/admin/feedback/export" className="btn-secondary">
          전체 CSV 내려받기
        </a>
      </div>

      {ranked.length === 0 ? (
        <div className="card p-10 text-center text-sm text-soil-700">
          아직 상품이 없습니다.{" "}
          <Link href="/admin/projects/new" className="font-semibold text-leaf-700 underline">
            첫 상품 올리기
          </Link>
        </div>
      ) : (
        ranked.map((p) => {
          const list = byProject.get(p.id) ?? [];
          const rank = ranks.get(p.id);
          return (
            <details key={p.id} open className="card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 hover:bg-soil-50">
                <div className="w-12 shrink-0 text-center">
                  {rank !== undefined && p.raised > 0 ? (
                    <RankChip rank={rank} />
                  ) : (
                    <span className="text-sm text-soil-700">-</span>
                  )}
                </div>
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-soil-100">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">{UNIT_EMOJI}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-bold">{p.title}</div>
                  {p.creator && <div className="text-xs text-soil-700">제작자 {p.creator}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xl font-extrabold text-leaf-700">
                    {fmt(p.raised)} <span className="text-xs font-semibold">{UNIT}</span>
                  </div>
                  <div className="text-xs text-soil-700">
                    {fmt(p.backers)}명 · {fmt(list.length)}건
                  </div>
                </div>
              </summary>
              <div className="border-t border-soil-100">
                <PledgeReasonList pledges={list} />
              </div>
            </details>
          );
        })
      )}
    </div>
  );
}
