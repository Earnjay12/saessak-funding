"use client";

import { useEffect, useState } from "react";

/** public 폴더에 해당 그림 파일이 있는지 브라우저에서 확인합니다. */
function useImageExists(src: string): boolean {
  const [exists, setExists] = useState(false);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setExists(true);
    img.onerror = () => alive && setExists(false);
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return exists;
}

/**
 * 학교 로고 마크. public/logo-mark.png 가 있으면 그 파일을, 없으면 SVG 그림을 씁니다.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  const hasPng = useImageExists("/logo-mark.png");
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={hasPng ? "/logo-mark.png" : "/logo-mark.svg"} alt="" className={className} draggable={false} />;
}

/**
 * 가로형 전체 로고. public/logo-full.png 가 있으면 그 파일을 쓰고,
 * 없으면 마크 + "GrowUp 군위초" 글자로 대신합니다.
 */
export function LogoFull({ className = "h-14" }: { className?: string }) {
  const hasPng = useImageExists("/logo-full.png");
  if (hasPng) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo-full.png" alt="GrowUp 군위초" className={`${className} w-auto`} />;
  }
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark className="h-full w-auto" />
      <span className="flex items-baseline text-3xl font-extrabold tracking-tight">
        <span className="text-leaf-800">Grow</span>
        <span className="text-leaf-500">Up</span>
        <span className="ml-2 text-xl font-bold text-leaf-800">군위초</span>
      </span>
    </div>
  );
}
