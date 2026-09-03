const KST = "Asia/Seoul";

export const fmt = (n: number) => n.toLocaleString("ko-KR");

export function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function studentLabel(s: { grade: number; class: number; number: number }): string {
  return `${s.grade}학년 ${s.class}반 ${s.number}번`;
}

/** 1위 상품 대비 비율(%) */
export function shareOfTop(raised: number, top: number): number {
  if (top <= 0) return 0;
  return Math.round((raised / top) * 100);
}

/** 1위 대비 비율에 따른 성장 단계 */
export function stage(share: number): { emoji: string; label: string } {
  if (share >= 100) return { emoji: "🍎", label: "지금 1위예요!" };
  if (share >= 75) return { emoji: "🌳", label: "나무가 됐어요" };
  if (share >= 50) return { emoji: "🌿", label: "잎이 무성해요" };
  if (share >= 25) return { emoji: "🌱", label: "새싹이 자라요" };
  if (share > 0) return { emoji: "🌱", label: "싹이 텄어요" };
  return { emoji: "🌰", label: "아직 씨앗이에요" };
}

/** 총 펀딩 새싹 기준 순위. 같은 개수는 같은 순위. */
export function rankProjects<T extends { id: string; raised: number }>(list: T[]): Map<string, number> {
  const sorted = [...list].sort((a, b) => b.raised - a.raised);
  const ranks = new Map<string, number>();
  let rank = 0;
  let prev = -1;
  sorted.forEach((p, i) => {
    if (p.raised !== prev) {
      rank = i + 1;
      prev = p.raised;
    }
    ranks.set(p.id, rank);
  });
  return ranks;
}

export function topRaised(list: { raised: number }[]): number {
  return list.reduce((m, p) => Math.max(m, p.raised), 0);
}

/** "품종: 홍로" 형식의 줄들을 항목/값 쌍으로 나눕니다. */
export function parseSpecs(specs: string): { key: string; value: string }[] {
  return specs
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:：]+)[:：]\s*(.+)$/);
      return m ? { key: m[1].trim(), value: m[2].trim() } : { key: "", value: line };
    });
}
