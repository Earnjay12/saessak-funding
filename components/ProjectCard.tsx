import Link from "next/link";
import { Creator, SpecInline } from "./ProductInfo";
import { UNIT, UNIT_EMOJI } from "@/lib/config";
import type { ProjectWithStats } from "@/lib/db";
import { fmt, shareOfTop, stage } from "@/lib/format";

export function RankChip({ rank, className = "" }: { rank: number; className?: string }) {
  const tone =
    rank === 1
      ? "bg-amber-400 text-amber-950"
      : rank === 2
        ? "bg-slate-300 text-slate-900"
        : rank === 3
          ? "bg-orange-300 text-orange-950"
          : "bg-soil-100 text-soil-700";
  return <span className={`chip ${tone} ${className}`}>{rank}위</span>;
}

export function ProjectCard({
  project,
  rank,
  top,
}: {
  project: ProjectWithStats;
  /** 목록 안에서의 순위 */
  rank?: number;
  /** 1위의 펀딩 개수 (성장 단계 계산용) */
  top?: number;
}) {
  const st = stage(shareOfTop(project.raised, top ?? project.raised));
  const cover = project.images[0];

  return (
    <Link href={`/projects/${project.id}`} className="card flex gap-4 p-4 transition hover:border-leaf-300 hover:shadow-md">
      <div className="relative w-32 shrink-0 sm:w-44">
        <div className="aspect-square overflow-hidden rounded-lg bg-soil-100">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">{UNIT_EMOJI}</div>
          )}
        </div>
        {project.images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-soil-900/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            사진 {project.images.length}장
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {project.summary && <div className="text-sm font-bold text-tag">{project.summary}</div>}
        <h3 className="line-clamp-2 text-lg font-bold leading-snug">{project.title}</h3>
        <Creator creator={project.creator} />
        <SpecInline specs={project.specs} className="mt-1 line-clamp-2" />

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-soil-100 pt-3">
          <div>
            <div className="text-[11px] text-soil-700">총 펀딩</div>
            <div className="text-xl font-extrabold leading-tight text-leaf-700">
              {st.emoji} {fmt(project.raised)} <span className="text-sm font-semibold">{UNIT}</span>
            </div>
          </div>
          <div className="text-right">
            {rank !== undefined && project.raised > 0 && <RankChip rank={rank} />}
            <div className="mt-1 text-xs text-soil-700">{fmt(project.backers)}명이 심었어요</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
