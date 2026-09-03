"use client";

import { useActionState, useEffect, useState } from "react";
import { pledge, type PledgeState } from "@/app/actions/pledges";

export function PledgeForm({
  projectId,
  balance,
  unit,
  emoji,
}: {
  projectId: string;
  balance: number;
  unit: string;
  emoji: string;
}) {
  const [state, action, pending] = useActionState<PledgeState, FormData>(pledge, {});
  const [amount, setAmount] = useState<number>(Math.min(10, balance));

  useEffect(() => {
    if (state.ok) setAmount(Math.min(10, state.balance ?? 0));
  }, [state]);

  const quick = [1, 5, 10, 20].filter((q) => q <= balance);
  const clamp = (n: number) => Math.max(0, Math.min(balance, Math.floor(n)));

  if (balance <= 0) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-soil-700">
          가진 {unit}을 모두 심었어요. 내 기록에서 취소하면 다시 심을 수 있어요.
        </p>
        {state.message && <p className="mt-2 text-sm font-semibold text-leaf-700">{state.message}</p>}
      </div>
    );
  }

  return (
    <form action={action} className="card p-5">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-base font-bold">
          {unit} 심기 {emoji}
        </span>
        <span className="text-sm text-soil-700">
          남은 {unit} <b className="text-leaf-700">{balance}</b>개
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary h-11 w-11 px-0 text-lg"
          onClick={() => setAmount((a) => clamp(a - 1))}
          aria-label="1개 줄이기"
        >
          −
        </button>
        <input
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={balance}
          value={amount}
          onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          className="input h-11 text-center text-xl font-bold"
          required
        />
        <button
          type="button"
          className="btn-secondary h-11 w-11 px-0 text-lg"
          onClick={() => setAmount((a) => clamp(a + 1))}
          aria-label="1개 늘리기"
        >
          +
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q}
            type="button"
            className={`chip border ${amount === q ? "border-leaf-600 bg-leaf-600 text-white" : "border-leaf-200 bg-white text-leaf-800"}`}
            onClick={() => setAmount(q)}
          >
            {q}개
          </button>
        ))}
        <button
          type="button"
          className={`chip border ${amount === balance ? "border-leaf-600 bg-leaf-600 text-white" : "border-leaf-200 bg-white text-leaf-800"}`}
          onClick={() => setAmount(balance)}
        >
          전부 ({balance}개)
        </button>
      </div>

      {state.message && (
        <p className={`mt-3 text-sm font-semibold ${state.ok ? "text-leaf-700" : "text-red-600"}`}>{state.message}</p>
      )}

      <button type="submit" className="btn-primary mt-4 w-full text-base" disabled={pending || amount < 1}>
        {pending ? "심는 중..." : `${unit} ${amount}개 심기`}
      </button>
    </form>
  );
}
