import Link from "next/link";
import { cancelPledge } from "@/app/actions/pledges";
import { StudentShell } from "@/components/StudentShell";
import { STARTING_BALANCE, UNIT, UNIT_EMOJI } from "@/lib/config";
import { getDb } from "@/lib/db";
import { fmt, fmtDateTime, studentLabel } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function MePage() {
  const student = await requireStudent();
  const db = await getDb();
  const [pledges, projects, settings] = await Promise.all([
    db.listPledges({ studentId: student.id }),
    db.listProjects(),
    db.getSettings(),
  ]);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const planted = pledges.reduce((s, p) => s + p.amount, 0);
  const open = settings.funding_open;

  return (
    <StudentShell student={student}>
      <h1 className="mb-1 text-xl font-extrabold">내 {UNIT} 기록</h1>
      <p className="mb-4 text-sm text-soil-700">{studentLabel(student)}</p>

      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <div className="card p-4">
          <div className="text-xs text-soil-700">남은 {UNIT}</div>
          <div className="mt-1 text-2xl font-extrabold text-leaf-700">
            {UNIT_EMOJI} {fmt(student.balance)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-soil-700">심은 {UNIT}</div>
          <div className="mt-1 text-2xl font-extrabold">
            {fmt(planted)} <span className="text-sm font-normal text-soil-700">/ {STARTING_BALANCE}</span>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">펀딩 내역</h2>
        {!open && <p className="mb-2 text-xs text-soil-700">펀딩이 마감되어 취소할 수 없어요.</p>}
        {pledges.length === 0 ? (
          <div className="card p-8 text-center text-sm text-soil-700">
            아직 심은 {UNIT}이 없어요.{" "}
            <Link href="/projects" className="font-semibold text-leaf-700 underline">
              상품 보러 가기
            </Link>
          </div>
        ) : (
          <ul className="card divide-y divide-soil-100">
            {pledges.map((p) => {
              const project = byId.get(p.project_id);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${p.project_id}`}
                      className="line-clamp-1 text-sm font-semibold hover:underline"
                    >
                      {project?.title ?? "(삭제된 상품)"}
                    </Link>
                    <div className="text-xs text-soil-700">
                      {UNIT} {p.amount}개 · {fmtDateTime(p.created_at)}
                    </div>
                  </div>
                  {open && (
                    <form action={cancelPledge}>
                      <input type="hidden" name="pledge_id" value={p.id} />
                      <input type="hidden" name="project_id" value={p.project_id} />
                      <button type="submit" className="btn-ghost shrink-0 px-2 py-1 text-xs text-red-600">
                        취소
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </StudentShell>
  );
}
