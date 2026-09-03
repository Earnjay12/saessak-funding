import Link from "next/link";
import { RankChip } from "@/components/ProjectCard";
import { UNIT, UNIT_EMOJI } from "@/lib/config";
import { getDb } from "@/lib/db";
import { fmt, rankProjects } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminProjects() {
  await requireAdmin();
  const projects = await (await getDb()).listProjects();
  const ranks = rankProjects(projects);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">상품</h1>
        <Link href="/admin/projects/new" className="btn-primary">
          + 새 상품
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card p-10 text-center text-sm text-soil-700">
          <div className="mb-2 text-3xl">{UNIT_EMOJI}</div>
          아직 상품이 없습니다. 사진과 설명을 넣어 첫 상품을 올려 보세요.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => {
            const rank = ranks.get(p.id);
            return (
              <li key={p.id}>
                <Link href={`/admin/projects/${p.id}`} className="card flex gap-4 p-3 transition hover:shadow-md">
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-soil-100">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">{UNIT_EMOJI}</div>
                    )}
                    {p.images.length > 1 && (
                      <span className="absolute bottom-1 right-1 rounded bg-soil-900/70 px-1 text-[10px] font-semibold text-white">
                        {p.images.length}장
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {p.summary && <div className="line-clamp-1 text-xs font-bold text-tag">{p.summary}</div>}
                      {rank !== undefined && p.raised > 0 && <RankChip rank={rank} className="ml-auto shrink-0" />}
                    </div>
                    <div className="line-clamp-1 font-bold">{p.title}</div>
                    {p.creator && <div className="text-xs text-soil-700">제작자 {p.creator}</div>}
                    <div className="mt-1 text-xs text-soil-700">
                      총 {fmt(p.raised)} {UNIT} · {fmt(p.backers)}명
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
