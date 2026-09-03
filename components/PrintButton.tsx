"use client";

export function PrintButton({ className = "btn-primary" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      인쇄하기
    </button>
  );
}
