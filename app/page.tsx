import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LogoFull } from "@/components/Logo";
import { SCHOOL_NAME, SITE_NAME, STARTING_BALANCE, UNIT } from "@/lib/config";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string; expired?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "student") {
    const student = await (await getDb()).getStudent(session.id);
    if (student) redirect("/projects");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
      <header className="mb-8 flex flex-col items-center text-center">
        <LogoFull className="h-14" />
        <p className="mt-5 text-sm font-semibold text-leaf-600">{SCHOOL_NAME}</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-leaf-800">{SITE_NAME}</h1>
        <p className="mt-2 text-sm text-soil-700">우리 학교 모의 크라우드펀딩</p>
      </header>

      <section className="card mb-6 p-5">
        <h2 className="mb-2 text-base font-bold">어떻게 하는 거예요?</h2>
        <ol className="space-y-1.5 text-sm leading-relaxed text-soil-700">
          <li>
            <span className="font-semibold text-leaf-700">1.</span> 로그인하면 {UNIT} {STARTING_BALANCE}개를
            받아요.
          </li>
          <li>
            <span className="font-semibold text-leaf-700">2.</span> 마음에 드는 상품을 골라 {UNIT}을 심어요. 여러
            곳에 나눠 심어도 돼요.
          </li>
          <li>
            <span className="font-semibold text-leaf-700">3.</span> {UNIT}을 가장 많이 받은 상품이 1위가 돼요!
          </li>
        </ol>
      </section>

      {params.expired && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          계정 정보가 바뀌어 다시 로그인해야 해요.
        </p>
      )}

      <LoginForm defaultMode={params.admin ? "admin" : "student"} />
    </main>
  );
}
