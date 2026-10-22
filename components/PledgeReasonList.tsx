import { UNIT } from "@/lib/config";
import { parseStudentId, type Pledge } from "@/lib/db";
import { fmt, fmtDateTime } from "@/lib/format";

function who(studentId: string): string {
  const s = parseStudentId(studentId);
  return s ? `${s.grade}학년 ${s.class}반 ${s.number}번` : studentId;
}

/** 교사용: 한 상품에 들어온 펀딩과 이유 목록 */
export function PledgeReasonList({ pledges }: { pledges: Pledge[] }) {
  if (pledges.length === 0) {
    return <p className="px-4 py-3 text-sm text-soil-700">아직 심은 학생이 없습니다.</p>;
  }
  const rows = pledges.slice().sort((a, b) => b.amount - a.amount || a.created_at.localeCompare(b.created_at));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-soil-100 text-left text-xs text-soil-700">
          <tr>
            <th className="whitespace-nowrap px-4 py-2">학생</th>
            <th className="whitespace-nowrap px-4 py-2 text-right">{UNIT}</th>
            <th className="px-4 py-2">심은 이유</th>
            <th className="whitespace-nowrap px-4 py-2 text-right">시간</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-soil-100 align-top">
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap px-4 py-2 font-semibold">{who(p.student_id)}</td>
              <td className="whitespace-nowrap px-4 py-2 text-right font-bold text-leaf-700">{fmt(p.amount)}</td>
              <td className="min-w-64 whitespace-pre-wrap px-4 py-2">
                {p.reason || <span className="text-soil-700/60">(이유 없음)</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right text-xs text-soil-700">
                {fmtDateTime(p.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
