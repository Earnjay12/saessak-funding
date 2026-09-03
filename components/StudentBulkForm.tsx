"use client";

import { useActionState } from "react";
import { createStudents, type FormState } from "@/app/actions/admin";

export function StudentBulkForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createStudents, {});
  return (
    <form action={action} className="card p-5">
      <h2 className="text-base font-bold">계정 만들기</h2>
      <p className="mt-1 text-sm text-soil-700">
        학년, 반, 인원을 넣으면 1번부터 순서대로 아이디와 비밀번호를 만듭니다. 이미 있는 번호는 그대로 둡니다.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="grade">
            학년
          </label>
          <input id="grade" name="grade" type="number" min={1} max={12} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="class">
            반
          </label>
          <input id="class" name="class" type="number" min={1} max={99} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="count">
            인원
          </label>
          <input id="count" name="count" type="number" min={1} max={60} className="input" required />
        </div>
      </div>
      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="mt-3 text-sm font-semibold text-leaf-700">{state.message}</p>}
      <button type="submit" className="btn-primary mt-4" disabled={pending}>
        {pending ? "만드는 중..." : "계정 만들기"}
      </button>
    </form>
  );
}
