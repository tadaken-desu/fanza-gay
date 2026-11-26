import { RELATION_TAGS, SITUATION_TAGS } from "@/lib/tags";

/**
 * トップページの絞り込み条件。URL クエリと相互変換する
 * (サーバー/クライアント両方から使うため server-only なものを import しない)。
 *
 *   /?rel=nonke,supadari&sit=binaural&mode=any&max=1000&sale=1&sample=1
 */

export type MatchMode = "all" | "any";

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
};

export const PRICE_LIMITS = [500, 1000, 1500] as const;

export const EMPTY_FILTERS: Filters = {
  rel: [],
  sit: [],
  mode: "all",
  maxPrice: null,
  saleOnly: false,
  sampleOnly: false,
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const relSlugs = new Set<string>(RELATION_TAGS.map((t) => t.slug));
const sitSlugs = new Set<string>(SITUATION_TAGS.map((t) => t.slug));

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
  return {
    rel: parseList(sp.rel, relSlugs),
    sit: parseList(sp.sit, sitSlugs),
    mode: first(sp.mode) === "any" ? "any" : "all",
    maxPrice: (PRICE_LIMITS as readonly number[]).includes(max) ? max : null,
    saleOnly: first(sp.sale) === "1",
    sampleOnly: first(sp.sample) === "1",
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
  // カンマは読みやすさのためエンコードしない
  return q.toString().replace(/%2C/g, ",");
}

export function hasActiveFilters(f: Filters): boolean {
  return (
    f.rel.length > 0 ||
    f.sit.length > 0 ||
    f.maxPrice !== null ||
    f.saleOnly ||
    f.sampleOnly
  );
}
