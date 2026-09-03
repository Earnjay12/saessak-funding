"use client";

import { useActionState, useRef, useState } from "react";
import type { FormState } from "@/app/actions/admin";
import type { Project } from "@/lib/db/types";
import { MAX_IMAGES } from "@/lib/config";

const MAX_EDGE = 1280;

/** 큰 사진을 업로드 전에 브라우저에서 줄입니다. 실패하면 원본을 그대로 씁니다. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 800_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type NewImage = { file: File; url: string };

export function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  project?: Project;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [kept, setKept] = useState<string[]>(project?.images ?? []);
  const [added, setAdded] = useState<NewImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const total = kept.length + added.length;

  function syncInput(list: NewImage[]) {
    const dt = new DataTransfer();
    for (const n of list) dt.items.add(n.file);
    if (fileRef.current) fileRef.current.files = dt.files;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files ?? []);
    if (files.length === 0) return;
    const room = MAX_IMAGES - total;
    const picked = files.slice(0, Math.max(0, room));
    const shrunk = await Promise.all(picked.map(shrink));
    const next = [...added, ...shrunk.map((file) => ({ file, url: URL.createObjectURL(file) }))];
    setAdded(next);
    syncInput(next);
  }

  function removeAdded(i: number) {
    const next = added.filter((_, j) => j !== i);
    setAdded(next);
    syncInput(next);
  }

  function move(list: string[], from: number, to: number): string[] {
    const next = list.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  return (
    <form action={formAction} className="card space-y-5 p-5">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="label mb-0">사진 (여러 장 가능, {MAX_IMAGES}장까지)</label>
          <span className="text-xs text-soil-700">
            {total} / {MAX_IMAGES}장
          </span>
        </div>

        {kept.map((url) => (
          <input key={url} type="hidden" name="keep_images" value={url} />
        ))}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {kept.map((url, i) => (
            <Thumb key={url} src={url} index={i} first={i === 0}>
              <MiniButton label="◀" title="앞으로" disabled={i === 0} onClick={() => setKept(move(kept, i, i - 1))} />
              <MiniButton
                label="▶"
                title="뒤로"
                disabled={i === kept.length - 1}
                onClick={() => setKept(move(kept, i, i + 1))}
              />
              <MiniButton label="✕" title="지우기" danger onClick={() => setKept(kept.filter((_, j) => j !== i))} />
            </Thumb>
          ))}
          {added.map((n, i) => (
            <Thumb key={n.url} src={n.url} index={kept.length + i} first={kept.length + i === 0} badge="새 사진">
              <MiniButton label="✕" title="지우기" danger onClick={() => removeAdded(i)} />
            </Thumb>
          ))}
          {total < MAX_IMAGES && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-soil-200 text-soil-700 hover:border-leaf-400 hover:text-leaf-700">
              <span className="text-2xl">＋</span>
              <span className="text-xs font-semibold">사진 추가</span>
              <input
                ref={fileRef}
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="sr-only"
              />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-soil-700">
          첫 번째 사진이 목록에 보이는 대표 사진입니다. 큰 사진은 자동으로 줄여서 올립니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <label className="label" htmlFor="summary">
            홍보 문구
          </label>
          <input
            id="summary"
            name="summary"
            className="input"
            defaultValue={project?.summary}
            maxLength={40}
            placeholder="아삭하고! 달콤한!"
          />
        </div>
        <div>
          <label className="label" htmlFor="title">
            상품명
          </label>
          <input
            id="title"
            name="title"
            className="input"
            defaultValue={project?.title}
            required
            maxLength={80}
            placeholder="맛있는 홍로 경북 청송 꿀사과 3kg"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="creator">
          제작자
        </label>
        <input
          id="creator"
          name="creator"
          className="input"
          defaultValue={project?.creator}
          maxLength={60}
          placeholder="6학년 2반 김새싹, 이초록"
        />
      </div>

      <div>
        <label className="label" htmlFor="specs">
          상품 정보 (한 줄에 하나, &quot;항목: 내용&quot; 형식)
        </label>
        <textarea
          id="specs"
          name="specs"
          className="input min-h-32 font-mono text-sm"
          defaultValue={project?.specs}
          placeholder={"품종: 홍로\n무게: 3kg\n수확시기: 8월하순, 9월상순\n보관방법: 냉장보관"}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm font-semibold text-leaf-700">{state.message}</p>}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}

function Thumb({
  src,
  index,
  first,
  badge,
  children,
}: {
  src: string;
  index: number;
  first: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-soil-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <span className="absolute left-1 top-1 rounded bg-soil-900/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {first ? "대표" : index + 1}
      </span>
      {badge && (
        <span className="absolute right-1 top-1 rounded bg-leaf-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
        {children}
      </div>
    </div>
  );
}

function MiniButton({
  label,
  title,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-1.5 py-0.5 text-[11px] font-bold disabled:opacity-30 ${
        danger ? "bg-white text-red-600" : "bg-white text-soil-900"
      }`}
    >
      {label}
    </button>
  );
}
