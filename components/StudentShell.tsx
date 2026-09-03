import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { LogoMark } from "./Logo";
import { SCHOOL_NAME, SITE_NAME, UNIT, UNIT_EMOJI } from "@/lib/config";
import type { Student } from "@/lib/db";
import { fmt, studentLabel } from "@/lib/format";

const NAV = [
  ["/projects", "상품"],
  ["/me", "내 새싹 기록"],
] as const;

export function StudentShell({ student, children }: { student: Student; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-soil-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
          <Link href="/projects" className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block text-[11px] font-semibold text-leaf-600">{SCHOOL_NAME}</span>
              <span className="block text-lg font-extrabold text-leaf-800">{SITE_NAME}</span>
            </span>
          </Link>
          <nav className="hidden gap-1 text-sm sm:flex">
            {NAV.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 font-semibold text-soil-700 hover:bg-soil-100 hover:text-soil-900"
              >
                {label.replace("새싹", UNIT)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/me"
              className="inline-flex items-center gap-1 rounded-full bg-leaf-800 px-3 py-1.5 text-sm font-bold text-white"
              title={`${studentLabel(student)} · 내 기록 보기`}
            >
              {UNIT_EMOJI} {fmt(student.balance)}
            </Link>
            <span className="hidden text-xs text-soil-700 md:inline">{studentLabel(student)}</span>
            <form action={logout}>
              <button type="submit" className="btn-ghost px-2 py-1.5 text-xs">
                나가기
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 px-3 pb-2 text-sm sm:hidden">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg px-2.5 py-1 font-semibold text-soil-700 hover:bg-soil-100">
              {label.replace("새싹", UNIT)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">{children}</main>
    </div>
  );
}
