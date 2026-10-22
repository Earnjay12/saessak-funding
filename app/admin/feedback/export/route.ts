import { getDb, parseStudentId } from "@/lib/db";
import { rankProjects } from "@/lib/format";
import { getSession } from "@/lib/session";

/** 엑셀에서 쉼표·따옴표·줄바꿈이 깨지지 않도록 감쌉니다. */
function cell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function kst(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Unauthorized", { status: 401 });

  const db = await getDb();
  const [projects, pledges] = await Promise.all([db.listProjects(), db.listPledges()]);
  const ranks = rankProjects(projects);
  const byId = new Map(projects.map((p) => [p.id, p]));

  const rows = pledges
    .map((pl) => ({ pl, p: byId.get(pl.project_id) }))
    .sort(
      (a, b) =>
        (ranks.get(a.pl.project_id) ?? 999) - (ranks.get(b.pl.project_id) ?? 999) ||
        (a.p?.title ?? "").localeCompare(b.p?.title ?? "") ||
        b.pl.amount - a.pl.amount,
    );

  const lines = [
    ["순위", "상품명", "제작자", "상품 총 펀딩", "학년", "반", "번호", "심은 수", "심은 이유", "시간"].join(","),
    ...rows.map(({ pl, p }) => {
      const s = parseStudentId(pl.student_id);
      return [
        ranks.get(pl.project_id) ?? "",
        p?.title ?? "(삭제된 상품)",
        p?.creator ?? "",
        p?.raised ?? "",
        s?.grade ?? "",
        s?.class ?? "",
        s?.number ?? "",
        pl.amount,
        pl.reason,
        kst(pl.created_at),
      ]
        .map(cell)
        .join(",");
    }),
  ];
  const csv = String.fromCharCode(0xfeff) + lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pledge-reasons.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
