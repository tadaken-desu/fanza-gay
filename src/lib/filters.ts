import { RELATION_TAGS, SITUATION_TAGS } from "@/lib/tags";

/**
 * トップページの絞り込み条件。URL クエリと相互変換する
 * (サーバー/クライアント両方から使うため server-only なものを import しない)。
 *
 *   /?rel=nonke,supadari&sit=binaural&mode=any&max=1000&sale=1
 *     &quick=off50&sort=price&circle=circle-123&page=2
 */

export type MatchMode = "all" | "any";

/** クイックタブ(ワンタップの絞り込み。サイドバーの条件と AND で効く) */
export type QuickKey = "all" | "off50" | "under500" | "gay" | "today";

/** 並び順 */
export type SortKey = "discount" | "price" | "recent";

export type Filters = {
  /** 関係性・キャラ属性タグ */
  rel: string[];
  /** プレイ・音声シチュエーションタグ */
  sit: string[];
  /** all: 選んだタグを全て含む / any: いずれかを含む(各グループに適用) */
  mode: MatchMode;
  maxPrice: number | null;
  saleOnly: boolean;
  sampleOnly: boolean;
  quick: QuickKey;
  sort: SortKey;
  /** サークルの slug(作品が1件だけのサークルは /circle/[slug] を作らず、ここへ飛ばす) */
  circle: string | null;
  /** 1 始まり */
  page: number;
};

export const PRICE_LIMITS = [500, 1000, 1500] as const;

export const PAGE_SIZE = 36;

export const QUICK_TABS: readonly {
  key: QuickKey;
  label: string;
  /** 見出し用(絵文字なし) */
  plain: string;
}[] = [
  { key: "all", label: "すべて", plain: "すべて" },
  { key: "off50", label: "🔥 50%OFF以上", plain: "50%OFF以上" },
  { key: "under500", label: "🪙 500円以下", plain: "500円以下" },
  { key: "gay", label: "ゲイ向け", plain: "ゲイ向け" },
  { key: "today", label: "本日値下げ", plain: "本日値下げ" },
];

export const SORT_OPTIONS: readonly { key: SortKey; label: string }[] = [
  { key: "discount", label: "割引率が高い順" },
  { key: "price", label: "価格が安い順" },
  { key: "recent", label: "値下げが新しい順" },
];

export const EMPTY_FILTERS: Filters = {
  rel: [],
  sit: [],
  mode: "all",
  maxPrice: null,
  saleOnly: false,
  sampleOnly: false,
  quick: "all",
  sort: "discount",
  circle: null,
  page: 1,
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const relSlugs = new Set<string>(RELATION_TAGS.map((t) => t.slug));
const sitSlugs = new Set<string>(SITUATION_TAGS.map((t) => t.slug));
const quickKeys = new Set<string>(QUICK_TABS.map((t) => t.key));
const sortKeys = new Set<string>(SORT_OPTIONS.map((o) => o.key));

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseList(v: string | string[] | undefined, allowed: Set<string>) {
  const raw = first(v);
  if (!raw) return [];
  return [...new Set(raw.split(","))].filter((s) => allowed.has(s));
}

export function parseFilters(sp: RawSearchParams): Filters {
  const max = Number(first(sp.max));
  const quick = first(sp.quick) ?? "";
  const sort = first(sp.sort) ?? "";
  const circle = first(sp.circle) ?? "";
  const page = Number.parseInt(first(sp.page) ?? "", 10);

  return {
    rel: parseList(sp.rel, relSlugs),
    sit: parseList(sp.sit, sitSlugs),
    mode: first(sp.mode) === "any" ? "any" : "all",
    maxPrice: (PRICE_LIMITS as readonly number[]).includes(max) ? max : null,
    saleOnly: first(sp.sale) === "1",
    sampleOnly: first(sp.sample) === "1",
    quick: quickKeys.has(quick) ? (quick as QuickKey) : "all",
    sort: sortKeys.has(sort) ? (sort as SortKey) : "discount",
    // slug として妥当な文字だけ通す(画面に出す名前は作品データから引く)
    circle: /^[A-Za-z0-9_-]{1,64}$/.test(circle) ? circle : null,
    page: Number.isFinite(page) && page > 1 ? Math.min(page, 1000) : 1,
  };
}

export function filtersToQuery(f: Filters): string {
  const q = new URLSearchParams();
  if (f.rel.length) q.set("rel", f.rel.join(","));
  if (f.sit.length) q.set("sit", f.sit.join(","));
  if (f.mode === "any") q.set("mode", "any");
  if (f.maxPrice !== null) q.set("max", String(f.maxPrice));
  if (f.saleOnly) q.set("sale", "1");
  if (f.sampleOnly) q.set("sample", "1");
  if (f.quick !== "all") q.set("quick", f.quick);
  if (f.sort !== "discount") q.set("sort", f.sort);
  if (f.circle) q.set("circle", f.circle);
  if (f.page > 1) q.set("page", String(f.page));
  // カンマは読みやすさのためエンコードしない
  return q.toString().replace(/%2C/g, ",");
}

/** 条件に対応するトップページの URL */
export function filtersHref(f: Filters): string {
  const q = filtersToQuery(f);
  return q ? `/?${q}` : "/";
}

/** 絞り込み条件が1つでも効いているか(並び順・ページ番号は含めない) */
export function hasActiveFilters(f: Filters): boolean {
  return (
    f.rel.length > 0 ||
    f.sit.length > 0 ||
    f.maxPrice !== null ||
    f.saleOnly ||
    f.sampleOnly ||
    f.quick !== "all" ||
    f.circle !== null
  );
}
