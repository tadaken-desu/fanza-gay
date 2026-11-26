import worksJson from "@/data/works.json";
import type { Filters, SortKey } from "@/lib/filters";
import {
  isAtLowestPrice,
  isDroppedToday,
  isGayWork,
  isOnSale,
} from "@/lib/price";
import { ALL_TAGS, findTag, type Tag } from "@/lib/tags";
import type { Person, Work } from "@/lib/types";

// このファイルは works.json 全体を読み込むので、サーバー側でだけ使うこと。
// クライアントコンポーネントからは lib/price.ts など data を持たないモジュールを使う。
export { formatYen, isAtLowestPrice, isDroppedToday, isGayWork, isOnSale } from "@/lib/price";

// JSON はタグが string[] として推論されるため、slug のユニオン型へキャストする。
// 型と中身のずれは fetch スクリプト側で検証している。
const works = worksJson as unknown as Work[];

export function getAllWorks(): Work[] {
  return works;
}

export function getWorkById(id: string): Work | undefined {
  return works.find((w) => w.id === id);
}

/* ---------- 並び替え ---------- */

/** セール中の作品を割引率の高い順に */
export function sortBySale(list: Work[]): Work[] {
  return sortWorks(list, "discount");
}

export function sortWorks(list: Work[], sort: SortKey): Work[] {
  const byDiscount = (a: Work, b: Work) =>
    b.discountRate - a.discountRate || a.price - b.price;

  const compare: Record<SortKey, (a: Work, b: Work) => number> = {
    discount: byDiscount,
    price: (a, b) => a.price - b.price || b.discountRate - a.discountRate,
    // 値下げ日が新しい順。値下げ日が不明(null)の作品は最後へ
    recent: (a, b) =>
      (a.priceDroppedDaysAgo ?? Infinity) - (b.priceDroppedDaysAgo ?? Infinity) ||
      byDiscount(a, b),
  };

  return [...list].sort((a, b) => compare[sort](a, b) || a.id.localeCompare(b.id));
}

/* ---------- トップページの絞り込み ---------- */

function matches(selected: string[], tags: string[], mode: Filters["mode"]) {
  if (selected.length === 0) return true;
  return mode === "all"
    ? selected.every((s) => tags.includes(s))
    : selected.some((s) => tags.includes(s));
}

function matchesQuick(w: Work, quick: Filters["quick"]): boolean {
  switch (quick) {
    case "off50":
      return w.discountRate >= 50;
    case "under500":
      return w.price <= 500;
    case "gay":
      return isGayWork(w);
    case "today":
      return isDroppedToday(w);
    case "all":
      return true;
  }
}

export function filterWorks(all: Work[], f: Filters): Work[] {
  return all.filter(
    (w) =>
      matches(f.rel, w.relationTags, f.mode) &&
      matches(f.sit, w.situationTags, f.mode) &&
      (f.maxPrice === null || w.price <= f.maxPrice) &&
      (!f.saleOnly || isOnSale(w)) &&
      (!f.sampleOnly || w.sampleAudioAvailable === true) &&
      (f.circle === null || w.circle.slug === f.circle) &&
      matchesQuick(w, f.quick),
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

/** /circle/[slug] を静的生成する最小作品数。これ未満のサークルは薄いページになるので作らない */
export const MIN_WORKS_FOR_CIRCLE_PAGE = 2;

/** 専用ページ(/circle/[slug])を持つサークル */
export function getCirclesWithPage(): Entity[] {
  return getCircles().filter((c) => c.count >= MIN_WORKS_FOR_CIRCLE_PAGE);
}

const circleCounts = new Map(getCircles().map((c) => [c.slug, c.count]));

export function hasCirclePage(slug: string): boolean {
  return (circleCounts.get(slug) ?? 0) >= MIN_WORKS_FOR_CIRCLE_PAGE;
}

/** サークルのリンク先。専用ページがなければトップの絞り込みへ */
export function circleHref(slug: string): string {
  return hasCirclePage(slug) ? `/circle/${slug}` : `/?circle=${slug}`;
}

export function getCircleBySlug(slug: string): Person | undefined {
  return works.find((w) => w.circle.slug === slug)?.circle;
}

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

/* ---------- 作品詳細ページ: 回遊用の関連作品 ---------- */

/** 同じサークルの他作品(セール中・割引率の高い順) */
export function getSameCircleWorks(work: Work, limit = 6): Work[] {
  return sortWorks(
    works.filter((w) => w.circle.slug === work.circle.slug && w.id !== work.id),
    "discount",
  ).slice(0, limit);
}

/**
 * 同じタグを持つセール中の作品。共通タグが多い順 → 割引率の高い順。
 * exclude に渡した作品(同じサークル欄に出したものなど)は除く。
 */
export function getSameTagSaleWorks(
  work: Work,
  exclude: Work[] = [],
  limit = 6,
): Work[] {
  const mine = new Set<string>([...work.relationTags, ...work.situationTags]);
  const skip = new Set([work.id, ...exclude.map((w) => w.id)]);

  return works
    .filter((w) => !skip.has(w.id) && isOnSale(w))
    .map((w) => ({
      w,
      shared: [...w.relationTags, ...w.situationTags].filter((t) => mine.has(t))
        .length,
    }))
    .filter((x) => x.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        b.w.discountRate - a.w.discountRate ||
        a.w.id.localeCompare(b.w.id),
    )
    .slice(0, limit)
    .map((x) => x.w);
}

/* ---------- 統計 ---------- */

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
