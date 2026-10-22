import Link from "next/link";
import { headers } from "next/headers";
import { PrintButton } from "@/components/PrintButton";
import { SCHOOL_NAME, SITE_NAME, STARTING_BALANCE, UNIT, UNIT_EMOJI } from "@/lib/config";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function PrintCards({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; class?: string }>;
}) {
  await requireAdmin();
  const { grade, class: klass } = await searchParams;
  const g = Number(grade);
  const c = Number(klass);
  const students = (await (await getDb()).listStudents()).filter(
    (s) => (!g || s.grade === g) && (!c || s.class === c),
  );
  const url = await siteUrl();

  return (
    <div>
      <div className="print-hidden mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/students" className="text-sm text-soil-700 hover:underline">
            ← 학생 계정
          </Link>
          <h1 className="text-xl font-extrabold">
            {g ? `${g}학년 ` : ""}
            {c ? `${c}반 ` : ""}로그인 카드 ({students.length}장)
          </h1>
          <p className="text-sm text-soil-700">
            인쇄한 뒤 점선을 따라 잘라 학생들에게 나눠 주세요. 카드에 적힌 주소: <b>{url}</b>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 gap-3 print:grid-cols-2 print:gap-2">
        {students.map((s) => (
          <div
            key={s.id}
            className="break-inside-avoid rounded-xl border border-dashed border-soil-700/50 bg-white p-4 print:rounded-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-leaf-800">
                {UNIT_EMOJI} {SCHOOL_NAME} {SITE_NAME}
              </span>
              <span className="text-[11px] text-soil-700">{url.replace(/^https?:\/\//, "")}</span>
            </div>
            <div className="mt-3 text-base font-bold">
              {s.grade}학년 {s.class}반 {s.number}번
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xs text-soil-700">비밀번호</span>
              <span className="font-mono text-2xl font-bold tracking-widest">{s.password}</span>
            </div>
            <ol className="mt-3 space-y-0.5 text-[11px] leading-snug text-soil-700">
              <li>1. 위 주소로 들어가 학년·반·번호와 비밀번호를 입력해요.</li>
              <li>
                2. {UNIT} {STARTING_BALANCE}개를 받아요. 마음에 드는 상품에 나눠 심어요.
              </li>
              <li>3. 심을 때는 이유를 꼭 적어요. 마감 전에는 취소할 수 있어요.</li>
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
