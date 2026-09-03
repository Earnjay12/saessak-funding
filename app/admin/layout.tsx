import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { LogoMark } from "@/components/Logo";
import { SCHOOL_NAME, SITE_NAME } from "@/lib/config";
import { usingSupabase } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto min-h-dvh max-w-6xl">
      <header className="print-hidden sticky top-0 z-10 border-b border-soil-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block text-[11px] font-semibold text-leaf-600">{SCHOOL_NAME}</span>
              <span className="block text-lg font-extrabold text-leaf-800">
                {SITE_NAME} <span className="text-xs font-semibold text-soil-700">관리자</span>
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="chip hidden bg-soil-100 text-soil-700 sm:inline-flex">
              {usingSupabase ? "Supabase 연결됨" : "로컬 파일 저장"}
            </span>
            <form action={logout}>
              <button type="submit" className="btn-ghost px-2 py-1.5 text-xs">
                나가기
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm">
          {[
            ["/admin", "현황"],
            ["/admin/projects", "상품"],
            ["/admin/students", "학생 계정"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-lg px-2.5 py-1 font-semibold text-soil-700 hover:bg-soil-100"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="px-4 pb-16 pt-5">{children}</main>
    </div>
  );
}
