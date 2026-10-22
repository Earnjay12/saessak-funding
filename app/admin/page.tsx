import Link from "next/link";
import { resetPledges, setFundingOpen } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ProgressBar } from "@/components/ProgressBar";
import { RankChip } from "@/components/ProjectCard";
import { STARTING_BALANCE, UNIT } from "@/lib/config";
import { getDb } from "@/lib/db";
import { fmt, rankProjects, shareOfTop, topRaised } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminHome() {
  await requireAdmin();
  const db = await getDb();
  const [students, projects, pledges, settings] = await Promise.all([
    db.listStudents(),
    db.listProjects(),
    db.listPledges(),
    db.getSettings(),
  ]);

  const participants = new Set(pledges.map((p) => p.student_id));
  const planted = pledges.reduce((s, p) => s + p.amount, 0);
  const rate = students.length ? Math.round((participants.size / students.length) * 100) : 0;

  const plantedBy = new Map<string, number>();
  for (const p of pledges) plantedBy.set(p.student_id, (plantedBy.get(p.student_id) ?? 0) + p.amount);

  const classes = new Map<string, { grade: number; class: number; total: number; joined: number; planted: number }>();
  for (const s of students) {
    const key = `${s.grade}-${s.class}`;
    const row = classes.get(key) ?? { grade: s.grade, class: s.class, total: 0, joined: 0, planted: 0 };
    row.total++;
    if (participants.has(s.id)) row.joined++;
    row.planted += plantedBy.get(s.id) ?? 0;
    classes.set(key, row);
  }
  const classRows = [...classes.values()].sort((a, b) => a.grade - b.grade || a.class - b.class);

  const ranks = rankProjects(projects);
  const top = topRaised(projects);
  const ranked = projects.slice().sort((a, b) => b.raised - a.raised);
  const open = settings.funding_open;

  return (
    <div className="space-y-8">
      <section
        className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${open ? "border-leaf-200 bg-leaf-50" : "border-amber-200 bg-amber-50"}`}
      >
        <div>
          <div className="text-base font-bold">{open ? "🟢 펀딩 받는 중" : "🏁 펀딩 마감"}</div>
          <p className="text-sm text-soil-700">
            {open
              ? "학생들이 새싹을 심고 취소할 수 있습니다. 결과를 발표할 때 마감하세요."
              : "학생들에게는 최종 순위만 보이고, 심기와 취소는 막혀 있습니다."}
          </p>
        </div>
        <form action={setFundingOpen}>
          <input type="hidden" name="open" value={open ? "false" : "true"} />
          {open ? (
            <ConfirmButton className="btn-primary" message="펀딩을 마감할까요? 학생들은 더 이상 심거나 취소할 수 없습니다.">
              펀딩 마감하기
            </ConfirmButton>
          ) : (
            <button type="submit" className="btn-secondary">
              펀딩 다시 열기
            </button>
          )}
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="학생 계정" value={fmt(students.length)} />
        <Stat label="참여한 학생" value={`${fmt(participants.size)}명 (${rate}%)`} />
        <Stat label={`심은 ${UNIT}`} value={`${fmt(planted)} / ${fmt(students.length * STARTING_BALANCE)}`} />
        <Stat label="상품" value={`${projects.length}개`} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">상품 순위</h2>
          <Link href="/admin/projects" className="text-sm font-semibold text-leaf-700 hover:underline">
            관리하기 →
          </Link>
        </div>
        {ranked.length === 0 ? (
          <Empty>
            아직 상품이 없습니다.{" "}
            <Link href="/admin/projects/new" className="font-semibold text-leaf-700 underline">
              첫 상품 올리기
            </Link>
          </Empty>
        ) : (
          <ol className="space-y-2">
            {ranked.map((p) => {
              const rank = ranks.get(p.id) ?? 0;
              return (
                <li key={p.id} className="card flex items-center gap-4 p-4">
                  <div className="w-12 shrink-0 text-center">
                    {p.raised > 0 ? <RankChip rank={rank} /> : <span className="text-sm text-soil-700">-</span>}
                  </div>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-soil-100">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/projects/${p.id}`} className="line-clamp-1 font-bold hover:underline">
                      {p.title}
                    </Link>
                    {p.creator && <div className="text-xs text-soil-700">제작자 {p.creator}</div>}
                    <div className="mt-2">
                      <ProgressBar pct={shareOfTop(p.raised, top)} size="sm" />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-extrabold text-leaf-700">
                      {fmt(p.raised)} <span className="text-xs font-semibold">{UNIT}</span>
                    </div>
                    <div className="text-xs text-soil-700">{fmt(p.backers)}명</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">반별 참여</h2>
        {classRows.length === 0 ? (
          <Empty>
            아직 학생 계정이 없습니다.{" "}
            <Link href="/admin/students" className="font-semibold text-leaf-700 underline">
              계정 만들기
            </Link>
          </Empty>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soil-100 text-left text-xs text-soil-700">
                <tr>
                  <th className="px-4 py-2">반</th>
                  <th className="px-4 py-2 text-right">학생</th>
                  <th className="px-4 py-2 text-right">참여</th>
                  <th className="px-4 py-2 text-right">참여율</th>
                  <th className="px-4 py-2 text-right">심은 {UNIT}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soil-100">
                {classRows.map((r) => (
                  <tr key={`${r.grade}-${r.class}`}>
                    <td className="px-4 py-2 font-semibold">
                      {r.grade}학년 {r.class}반
                    </td>
                    <td className="px-4 py-2 text-right">{r.total}</td>
                    <td className="px-4 py-2 text-right">{r.joined}</td>
                    <td className="px-4 py-2 text-right">{r.total ? Math.round((r.joined / r.total) * 100) : 0}%</td>
                    <td className="px-4 py-2 text-right">{fmt(r.planted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card border-red-100 p-5">
        <h2 className="text-base font-bold text-red-700">초기화</h2>
        <p className="mt-1 text-sm font-semibold text-red-700">
          지우기 전에 <a href="/admin/feedback/export" className="underline">심은 이유 CSV</a>를 내려받아 두세요.
        </p>
        <p className="mt-1 text-sm text-soil-700">
          모든 펀딩 기록(심은 이유 포함)을 지우고 학생 잔액을 {UNIT} {STARTING_BALANCE}개로 되돌립니다. 학생 계정과 상품은 그대로
          남습니다. 다음 학기나 다른 반에서 다시 쓸 때 사용하세요.
        </p>
        <form action={resetPledges} className="mt-3">
          <ConfirmButton message={`정말 모든 펀딩 기록을 지우고 잔액을 ${STARTING_BALANCE}개로 되돌릴까요?`}>
            펀딩 기록 초기화
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-soil-700">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-8 text-center text-sm text-soil-700">{children}</div>;
}
