"use client";

import { useActionState, useEffect, useState } from "react";
import { pledge, type PledgeState } from "@/app/actions/pledges";
import { REASON_MAX, REASON_MIN } from "@/lib/config";

/** 남은 개수가 적으면 1개부터 전부까지 버튼을 다 보여주고, 많으면 자주 쓰는 개수만 보여줍니다. */
function quickAmounts(balance: number): number[] {
  if (balance <= 10) return Array.from({ length: balance }, (_, i) => i + 1);
  return [1, 5, 10, 20].filter((q) => q <= balance);
}

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
  const [amount, setAmount] = useState<number>(Math.min(1, balance));
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (state.ok) {
      setAmount(Math.min(1, state.balance ?? 0));
      setReason("");
    }
  }, [state]);

  const quick = quickAmounts(balance);
  const showAll = balance > 10;
  const clamp = (n: number) => Math.max(0, Math.min(balance, Math.floor(n)));
  const reasonLen = reason.trim().length;
  const reasonOk = reasonLen >= REASON_MIN;

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

  const chip = (selected: boolean) =>
    `chip border px-3 py-1.5 text-sm ${selected ? "border-leaf-600 bg-leaf-600 text-white" : "border-leaf-200 bg-white text-leaf-800"}`;

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
          onClick={() => setAmount((a) => Math.max(1, clamp(a - 1)))}
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
          <button key={q} type="button" className={chip(amount === q)} onClick={() => setAmount(q)}>
            {q}개
          </button>
        ))}
        {showAll && (
          <button type="button" className={chip(amount === balance)} onClick={() => setAmount(balance)}>
            전부 ({balance}개)
          </button>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor={`reason-${projectId}`} className="label">
          왜 {amount > 0 ? `${amount}개를` : "이만큼"} 심나요? <span className="text-red-600">(꼭 적어요)</span>
        </label>
        <textarea
          id={`reason-${projectId}`}
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
          className="input min-h-24 text-[15px]"
          placeholder="예: 우리 반 친구들이 꼭 쓸 것 같은 물건이라서 많이 심어요. 사진도 눈에 잘 띄어요."
          required
          minLength={REASON_MIN}
          maxLength={REASON_MAX}
        />
        <div className={`mt-1 text-right text-xs ${reasonOk ? "text-soil-700" : "text-red-600"}`}>
          {reasonOk ? `${reasonLen} / ${REASON_MAX}자` : `${REASON_MIN}자 이상 적어 주세요 (지금 ${reasonLen}자)`}
        </div>
      </div>

      {state.message && (
        <p className={`mt-2 text-sm font-semibold ${state.ok ? "text-leaf-700" : "text-red-600"}`}>{state.message}</p>
      )}

      <button
        type="submit"
        className="btn-primary mt-3 w-full text-base"
        disabled={pending || amount < 1 || !reasonOk}
      >
        {pending ? "심는 중..." : `${unit} ${amount}개 심기`}
      </button>
    </form>
  );
}
