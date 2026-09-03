import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const g = Number(url.searchParams.get("grade"));
  const c = Number(url.searchParams.get("class"));
  const students = (await (await getDb()).listStudents()).filter(
    (s) => (!g || s.grade === g) && (!c || s.class === c),
  );

  const lines = [
    "학년,반,번호,아이디,비밀번호",
    ...students.map((s) => `${s.grade},${s.class},${s.number},${s.id},${s.password}`),
  ];
  // 엑셀에서 한글이 깨지지 않도록 BOM을 붙입니다.
  const csv = String.fromCharCode(0xfeff) + lines.join("\r\n");
  const name = ["students", g || "all", c || ""].filter(Boolean).join("-");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
    },
  });
}
