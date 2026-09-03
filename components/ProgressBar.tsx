export function ProgressBar({ pct, size = "md" }: { pct: number; size?: "sm" | "md" | "lg" }) {
  const width = Math.max(0, Math.min(100, pct));
  const h = size === "lg" ? "h-4" : size === "sm" ? "h-2" : "h-3";
  const done = pct >= 100;
  return (
    <div className={`${h} w-full overflow-hidden rounded-full bg-leaf-100`} role="progressbar" aria-valuenow={width}>
      <div
        className={`${h} rounded-full transition-[width] duration-700 ${done ? "bg-gradient-to-r from-leaf-500 to-amber-400" : "bg-leaf-500"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
