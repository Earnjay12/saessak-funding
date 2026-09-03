import Link from "next/link";
import { deleteStudents } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StudentBulkForm } from "@/components/StudentBulkForm";
import { UNIT } from "@/lib/config";
import { getDb, type Student } from "@/lib/db";
import { fmt } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminStudents() {
  await requireAdmin();
  const students = await (await getDb()).listStudents();

  const groups = new Map<string, Student[]>();
  for (const s of students) {
    const key = `${s.grade}-${s.class}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">학생 계정</h1>
      <StudentBulkForm />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">반별 목록 ({fmt(students.length)}명)</h2>
          {students.length > 0 && (
            <form action={deleteStudents}>
              <ConfirmButton
                className="btn-danger px-3 py-1.5 text-xs"
                message="정말 모든 학생 계정과 펀딩 기록을 삭제할까요? 되돌릴 수 없습니다."
              >
                전체 삭제
              </ConfirmButton>
            </form>
          )}
        </div>

        {groups.size === 0 ? (
          <div className="card p-8 text-center text-sm text-soil-700">아직 만든 계정이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {[...groups.entries()].map(([key, list]) => {
              const { grade, class: klass } = list[0];
              const q = `grade=${grade}&class=${klass}`;
              return (
                <div key={key} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <span className="font-bold">
                      {grade}학년 {klass}반 <span className="text-sm font-normal text-soil-700">{list.length}명</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/students/print?${q}`} className="btn-secondary px-3 py-1.5 text-xs">
                        카드 인쇄
                      </Link>
                      <a href={`/admin/students/export?${q}`} className="btn-secondary px-3 py-1.5 text-xs">
                        CSV 내려받기
                      </a>
                      <form action={deleteStudents}>
                        <input type="hidden" name="grade" value={grade} />
                        <input type="hidden" name="class" value={klass} />
                        <ConfirmButton
                          className="btn-danger px-3 py-1.5 text-xs"
                          message={`${grade}학년 ${klass}반 계정 ${list.length}개와 펀딩 기록을 삭제할까요?`}
                        >
                          삭제
                        </ConfirmButton>
                      </form>
                    </span>
                  </div>
                  <details className="border-t border-soil-100">
                    <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-soil-700 hover:bg-soil-50">
                      아이디·비밀번호 보기
                    </summary>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-soil-100 text-left text-xs text-soil-700">
                          <tr>
                            <th className="px-4 py-2">번호</th>
                            <th className="px-4 py-2">아이디</th>
                            <th className="px-4 py-2">비밀번호</th>
                            <th className="px-4 py-2 text-right">남은 {UNIT}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-soil-100">
                          {list.map((s) => (
                            <tr key={s.id}>
                              <td className="px-4 py-1.5">{s.number}번</td>
                              <td className="px-4 py-1.5 font-mono">{s.id}</td>
                              <td className="px-4 py-1.5 font-mono">{s.password}</td>
                              <td className="px-4 py-1.5 text-right">{s.balance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
