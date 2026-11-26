import worksJson from "@/data/works.json";
import type { Filters } from "@/lib/filters";
import { ALL_TAGS, findTag, type Tag } from "@/lib/tags";
import type { Person, Work } from "@/lib/types";

// JSON はタグが string[] として推論されるため、slug のユニオン型へキャストする。
// 型と中身のずれは fetch スクリプト側で検証している。
const works = worksJson as unknown as Work[];

export function getAllWorks(): Work[] {
  return works;
}

/* ---------- 価格・セール ---------- */

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

export function formatYen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

/** セール中の作品を割引率の高い順に */
export function sortBySale(list: Work[]): Work[] {
  return [...list].sort(
    (a, b) => b.discountRate - a.discountRate || a.price - b.price,
  );
}

/* ---------- トップページの絞り込み ---------- */

function matches(selected: string[], tags: string[], mode: Filters["mode"]) {
  if (selected.length === 0) return true;
  return mode === "all"
    ? selected.every((s) => tags.includes(s))
    : selected.some((s) => tags.includes(s));
}

export function filterWorks(all: Work[], f: Filters): Work[] {
  return all.filter(
    (w) =>
      matches(f.rel, w.relationTags, f.mode) &&
      matches(f.sit, w.situationTags, f.mode) &&
      (f.maxPrice === null || w.price <= f.maxPrice) &&
      (!f.saleOnly || isOnSale(w)) &&
      (!f.sampleOnly || w.sampleAudioAvailable === true),
  );
}

/** タグごとの作品数(サイドバーの件数表示用) */
export function countTags(
  all: Work[],
  key: "relationTags" | "situationTags",
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of all) {
    for (const t of w[key]) counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

/* ---------- pSEO ページ用: CV / サークル / タグ ---------- */

export type Entity = Person & { count: number };

function collect(list: Work[], pick: (w: Work) => Person | null): Entity[] {
  const map = new Map<string, Entity>();
  for (const w of list) {
    const p = pick(w);
    if (!p) continue;
    const cur = map.get(p.slug);
    if (cur) cur.count += 1;
    else map.set(p.slug, { ...p, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export const getCvs = (list: Work[] = works) => collect(list, (w) => w.cv);
export const getCircles = (list: Work[] = works) =>
  collect(list, (w) => w.circle);

export function getWorksByCv(slug: string): Work[] {
  return works.filter((w) => w.cv?.slug === slug);
}

export function getWorksByCircle(slug: string): Work[] {
  return works.filter((w) => w.circle.slug === slug);
}

export function getWorksByTag(slug: string): Work[] {
  return works.filter(
    (w) =>
      (w.relationTags as string[]).includes(slug) ||
      (w.situationTags as string[]).includes(slug),
  );
}

export type TagEntity = Tag & { count: number };

/** 与えた作品群に付いているタグ(件数順)。作品が1件もないタグは出さない。 */
export function getTagsOf(list: Work[]): TagEntity[] {
  return ALL_TAGS.map((t) => ({
    ...t,
    count: list.filter((w) =>
      ([...w.relationTags, ...w.situationTags] as string[]).includes(t.slug),
    ).length,
  }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function getTag(slug: string): Tag | undefined {
  return findTag(slug);
}

export type ListingStats = {
  total: number;
  onSale: number;
  /** セール中作品のうち、現在価格が過去最安値の作品数 */
  atLowest: number;
  /** 全作品中の最安価格 */
  minPrice: number;
  /** 最大割引率(%) */
  maxDiscountRate: number;
};

export function getStats(list: Work[]): ListingStats {
  const sale = list.filter(isOnSale);
  return {
    total: list.length,
    onSale: sale.length,
    atLowest: sale.filter(isAtLowestPrice).length,
    minPrice: list.length ? Math.min(...list.map((w) => w.price)) : 0,
    maxDiscountRate: sale.length
      ? Math.max(...sale.map((w) => w.discountRate))
      : 0,
  };
}
