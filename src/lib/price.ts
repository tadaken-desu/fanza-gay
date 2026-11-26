import type { Work } from "@/lib/types";

/**
 * 価格まわりの純粋ヘルパー。works.json を import しないので、
 * クライアントコンポーネントから使っても全作品データがバンドルに入らない。
 */

export function formatYen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function isOnSale(w: Work): boolean {
  return w.price < w.regularPrice;
}

export function isDroppedToday(w: Work): boolean {
  return w.priceDroppedDaysAgo === 0;
}

/** 現在価格が観測上の過去最安値と同じ(以下)か */
export function isAtLowestPrice(w: Work): boolean {
  return w.price <= w.lowestPrice;
}

/** ジャンル名またはタイトルに「ゲイ」を含む作品(「ゲイ向け」クイックフィルタ用) */
export function isGayWork(w: Work): boolean {
  return w.genres.some((g) => g.includes("ゲイ")) || w.title.includes("ゲイ");
}
