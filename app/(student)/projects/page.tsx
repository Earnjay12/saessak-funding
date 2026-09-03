import { ProjectCard } from "@/components/ProjectCard";
import { StudentShell } from "@/components/StudentShell";
import { UNIT, UNIT_EMOJI } from "@/lib/config";
import { getDb } from "@/lib/db";
import { rankProjects, topRaised } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export default async function ProjectsPage() {
  const student = await requireStudent();
  const db = await getDb();
  const [projects, settings] = await Promise.all([db.listProjects(), db.getSettings()]);
  const ranks = rankProjects(projects);
  const top = topRaised(projects);

  return (
    <StudentShell student={student}>
      {!settings.funding_open && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          🏁 펀딩이 마감되었어요. 지금 보이는 순위가 최종 결과예요.
        </div>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-xl font-extrabold">{settings.funding_open ? "펀딩 중인 상품" : "최종 결과"}</h1>
          <span className="text-sm text-soil-700">{projects.length}개</span>
        </div>
        {projects.length === 0 ? (
          <div className="card p-10 text-center text-sm text-soil-700">
            <div className="mb-2 text-3xl">{UNIT_EMOJI}</div>
            아직 올라온 상품이 없어요. 조금만 기다려 주세요!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} rank={ranks.get(p.id)} top={top} />
            ))}
          </div>
        )}
        {settings.funding_open && (
          <p className="mt-3 text-xs text-soil-700">
            마음에 드는 상품을 골라 {UNIT}을 심어 보세요. 여러 상품에 나눠 심어도 괜찮아요. {UNIT}을 가장 많이 받은
            상품이 1위가 돼요.
          </p>
        )}
      </section>
    </StudentShell>
  );
}
