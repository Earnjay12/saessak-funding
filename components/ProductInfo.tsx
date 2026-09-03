import { parseSpecs } from "@/lib/format";

/** 상품 정보를 "품종 : 홍로 | 무게 : 3kg" 처럼 한 줄로 */
export function SpecInline({ specs, className = "" }: { specs: string; className?: string }) {
  const rows = parseSpecs(specs);
  if (rows.length === 0) return null;
  return (
    <div className={`text-xs text-soil-700 ${className}`}>
      {rows.map((r, i) => (
        <span key={i} className="inline">
          {i > 0 && <span className="mx-1.5 text-soil-200">|</span>}
          {r.key && <span className="text-soil-700/80">{r.key} : </span>}
          <span className="font-medium text-soil-900">{r.value}</span>
        </span>
      ))}
    </div>
  );
}

/** 상품 정보를 표 형태로 */
export function SpecTable({ specs }: { specs: string }) {
  const rows = parseSpecs(specs);
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] border-t border-soil-200 text-sm">
      {rows.map((r, i) => (
        <div key={i} className="contents">
          <dt className="border-b border-soil-100 bg-soil-50 px-3 py-2 font-semibold text-soil-700">{r.key || "정보"}</dt>
          <dd className="border-b border-soil-100 px-3 py-2">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Creator({ creator, className = "" }: { creator: string; className?: string }) {
  if (!creator) return null;
  return (
    <div className={`text-sm text-soil-700 ${className}`}>
      <span className="text-soil-700/70">제작자</span> <span className="font-semibold text-soil-900">{creator}</span>
    </div>
  );
}
