"use client";

import { useEffect, useRef, useState } from "react";

/** 옆으로 넘겨 보는 사진 뷰어 (터치·트랙패드 스와이프, 화살표, 점 표시) */
export function ImageCarousel({ images, placeholder }: { images: string[]; placeholder: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-soil-100 text-7xl">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={track}
        className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto rounded-xl bg-soil-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div key={i} className="h-full w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="이전 사진"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-lg shadow disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === images.length - 1}
            aria-label="다음 사진"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-lg shadow disabled:opacity-30"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}번째 사진`}
                className={`h-2 w-2 rounded-full ${i === index ? "bg-leaf-700" : "bg-white/80"}`}
              />
            ))}
          </div>
          <span className="absolute right-2 top-2 rounded-md bg-soil-900/70 px-2 py-0.5 text-xs font-semibold text-white">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}
