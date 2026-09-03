"use client";

import { useActionState, useState } from "react";
import { loginAdmin, loginStudent, type LoginState } from "@/app/actions/auth";

export function LoginForm({ defaultMode }: { defaultMode: "student" | "admin" }) {
  const [mode, setMode] = useState<"student" | "admin">(defaultMode);
  const [studentState, studentAction, studentPending] = useActionState<LoginState, FormData>(loginStudent, {});
  const [adminState, adminAction, adminPending] = useActionState<LoginState, FormData>(loginAdmin, {});

  if (mode === "admin") {
    return (
      <div className="card p-5">
        <h2 className="mb-4 text-lg font-bold">선생님 로그인</h2>
        <form action={adminAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="admin-id">
              아이디
            </label>
            <input id="admin-id" name="id" className="input" autoComplete="username" required />
          </div>
          <div>
            <label className="label" htmlFor="admin-pw">
              비밀번호
            </label>
            <input
              id="admin-pw"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          {adminState.error && <p className="text-sm text-red-600">{adminState.error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={adminPending}>
            {adminPending ? "확인 중..." : "로그인"}
          </button>
        </form>
        <button type="button" className="btn-ghost mt-3 w-full text-xs" onClick={() => setMode("student")}>
          학생 로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="mb-4 text-lg font-bold">학생 로그인</h2>
      <form action={studentAction} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <NumberField name="grade" label="학년" />
          <NumberField name="class" label="반" />
          <NumberField name="number" label="번호" />
        </div>
        <div>
          <label className="label" htmlFor="student-pw">
            비밀번호
          </label>
          <input
            id="student-pw"
            name="password"
            type="password"
            className="input tracking-widest"
            autoComplete="current-password"
            autoCapitalize="none"
            required
            placeholder="카드에 적힌 비밀번호"
          />
        </div>
        {studentState.error && <p className="text-sm text-red-600">{studentState.error}</p>}
        <button type="submit" className="btn-primary w-full text-base" disabled={studentPending}>
          {studentPending ? "확인 중..." : "들어가기"}
        </button>
      </form>
      <button type="button" className="btn-ghost mt-3 w-full text-xs" onClick={() => setMode("admin")}>
        선생님이신가요?
      </button>
    </div>
  );
}

function NumberField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="label" htmlFor={`f-${name}`}>
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type="number"
        inputMode="numeric"
        min={1}
        className="input text-center"
        required
      />
    </div>
  );
}
