/**
 * FANZA(DMM) アフィリエイト WebサービスAPI(同人フロア)から作品を取得し、
 * src/data/works.json を更新するスクリプト。
 *
 *   node scripts/fetch-fanza.ts              # 取得して works.json を上書き
 *   node scripts/fetch-fanza.ts --dry-run    # 取得して結果を表示するだけ(書き込まない)
 *   node scripts/fetch-fanza.ts --floors     # FloorList API で同人フロアのコードを確認
 *
 * Node.js 22.18+ / 24 の TypeScript 型除去(type stripping)で直接実行する。
 *
 * 必須の環境変数:
 *   FANZA_API_ID        DMM アフィリエイトの API ID
 *   FANZA_AFFILIATE_ID  アフィリエイト ID(API 用は末尾が 990〜999 のもの)
 *
 * 任意の環境変数(括弧内は既定値):
 *   FANZA_SITE      (FANZA)
 *   FANZA_SERVICE   (doujin)
 *   FANZA_FLOOR     (digital_doujin)  ※要確認。--floors で正しいコードを調べられる
 *   FANZA_KEYWORDS  ("BL ボイス,ゲイ ボイス") カンマ区切り。各キーワードで検索して結果を統合する
 *   FANZA_PAGES     (3)    キーワードごとに取得するページ数
 *   FANZA_HITS      (100)  1ページあたりの件数(最大100)
 *
 * 未検証の前提(実 API のレスポンスで要確認):
 *   - prices.price / prices.list_price が現在価格 / 通常価格として返る
 *   - iteminfo.maker がサークル、iteminfo.actor(または actress)が CV に対応する
 *   - 試聴ボイスの有無を示すフィールドがないため、ジャンル名に「試聴」を含むかで暫定判定
 *   → レスポンスに合わせて normalizeItem() を調整すること。
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ALL_TAGS, type TagSlug } from "../src/lib/tags.ts";
import type { Work } from "../src/lib/types.ts";

const WORKS_PATH = fileURLToPath(
  new URL("../src/data/works.json", import.meta.url),
);

const API_BASE = "https://api.dmm.com/affiliate/v3";
const REQUEST_INTERVAL_MS = 1000; // API への負荷を抑える

/* ------------------------------------------------------------------ *
 * API レスポンス(使うフィールドだけ。すべて任意として扱う)
 * ------------------------------------------------------------------ */

type NamedRef = { id?: number | string; name?: string };

export type ApiItem = {
  content_id?: string;
  title?: string;
  URL?: string;
  affiliateURL?: string;
  prices?: { price?: string | number; list_price?: string | number };
  iteminfo?: {
    maker?: NamedRef[];
    actor?: NamedRef[];
    actress?: NamedRef[];
    genre?: NamedRef[];
  };
};

type ApiResponse = {
  result?: {
    status?: number | string;
    message?: string;
    total_count?: number;
    items?: ApiItem[];
  };
};

/* ------------------------------------------------------------------ *
 * タグ付け: タイトル + ジャンル名にキーワードが含まれるかで判定
 * Record<TagSlug, ...> なので、tags.ts にタグを足すとここも追記が必須になる(型エラーで気付ける)。
 * ------------------------------------------------------------------ */

export const TAG_KEYWORDS: Record<TagSlug, readonly string[]> = {
  nonke: ["ノンケ"],
  supadari: ["スパダリ"],
  "toshishita-zeme": ["年下攻め", "年下ワンコ", "ワンコ", "年下"],
  "senpai-kouhai": ["先輩", "後輩"],
  gachimuchi: ["ガチムチ", "体育会", "筋肉"],
  riman: ["リーマン", "サラリーマン", "上司", "社長", "同僚"],
  yandere: ["ヤンデレ", "執着", "監禁", "独占欲"],
  "mesu-ochi": ["メス堕ち", "メスオチ", "雌堕ち"],
  binaural: ["バイノーラル", "ダミヘ", "ダミーヘッド"],
  "mimi-name": ["耳舐め", "耳責め"],
  sasayaki: ["囁き", "ささやき", "吐息"],
  onasapo: ["オナサポ", "オナニーサポート"],
  soine: ["添い寝", "密着", "寝かしつけ"],
  shukan: ["主観"],
  "kotoba-zeme": ["言葉責め", "言葉攻め"],
  ntr: ["ntr", "寝取"],
  "kairaku-ochi": ["快楽堕ち", "快楽落ち"],
  "fera-tekoki": ["フェラ", "手コキ", "手こき"],
};

const normalize = (s: string) => s.normalize("NFKC").toLowerCase();

export function classifyTags(text: string): TagSlug[] {
  const haystack = normalize(text);
  return ALL_TAGS.filter((t) =>
    TAG_KEYWORDS[t.slug].some((kw) => haystack.includes(normalize(kw))),
  ).map((t) => t.slug);
}

/* ------------------------------------------------------------------ *
 * 値下げ検知・価格履歴
 * ------------------------------------------------------------------ */

/** 今日の日付(JST, YYYY-MM-DD) */
export function todayJst(now: number = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

type PriceFields = Pick<
  Work,
  | "price"
  | "regularPrice"
  | "discountRate"
  | "lowestPrice"
  | "priceDroppedOn"
  | "priceDroppedDaysAgo"
>;

/**
 * 前回データ(prev)と今回価格から、割引率・過去最安値・値下げ日を決める。
 *  - 現在価格が前回より下がった → 今日値下げ
 *  - セール中で前回データがない(初観測) → 今日値下げ扱い
 *  - セール中で価格が変わらない → 値下げ日を維持
 *  - セール終了(現在価格 = 通常価格) → 値下げ日をクリア
 */
export function resolvePrice(
  price: number,
  regularPrice: number,
  prev: Work | undefined,
  today: string,
): PriceFields {
  const onSale = price < regularPrice;
  const dropped = !prev || price < prev.price;

  let priceDroppedOn: string | null = null;
  if (onSale) priceDroppedOn = dropped ? today : (prev?.priceDroppedOn ?? today);

  return {
    price,
    regularPrice,
    discountRate: onSale ? Math.round((1 - price / regularPrice) * 100) : 0,
    lowestPrice: Math.min(prev?.lowestPrice ?? price, price),
    priceDroppedOn,
    priceDroppedDaysAgo: priceDroppedOn
      ? daysBetween(priceDroppedOn, today)
      : null,
  };
}

/* ------------------------------------------------------------------ *
 * API アイテム → Work
 * ------------------------------------------------------------------ */

function toInt(v: string | number | undefined): number | null {
  if (v === undefined) return null;
  const n = Number.parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const hash8 = (s: string) =>
  createHash("sha1").update(s).digest("hex").slice(0, 8);

/** 名前しか手がかりのない CV などは、名前のハッシュから安定した slug を作る */
function personOf(ref: NamedRef | undefined, prefix: string) {
  const name = ref?.name?.trim();
  if (!name) return null;
  return { slug: `${prefix}-${ref?.id ?? hash8(name)}`, name };
}

export function normalizeItem(
  item: ApiItem,
  prev: Work | undefined,
  today: string,
): Work | null {
  const id = item.content_id;
  const title = item.title?.trim();
  const price = toInt(item.prices?.price);
  const circle = personOf(item.iteminfo?.maker?.[0], "circle");
  const affiliateUrl = item.affiliateURL ?? item.URL;
  if (!id || !title || price === null || !circle || !affiliateUrl) return null;

  const listPrice = toInt(item.prices?.list_price);
  const regularPrice = listPrice !== null && listPrice > price ? listPrice : price;

  const genres = (item.iteminfo?.genre ?? [])
    .map((g) => g.name ?? "")
    .filter(Boolean);
  const tags = classifyTags([title, ...genres].join(" "));

  const relation = new Set(
    ALL_TAGS.filter((t) => t.group === "relation").map((t) => t.slug),
  );

  return {
    id,
    title,
    circle,
    cv: personOf(item.iteminfo?.actor?.[0] ?? item.iteminfo?.actress?.[0], "cv"),
    ...resolvePrice(price, regularPrice, prev, today),
    affiliateUrl,
    // TODO: 試聴ボイスの有無を取れるフィールドが見つかったら置き換える
    sampleAudioAvailable: genres.some((g) => g.includes("試聴")),
    relationTags: tags.filter((t) => relation.has(t)) as Work["relationTags"],
    situationTags: tags.filter((t) => !relation.has(t)) as Work["situationTags"],
  };
}

/* ------------------------------------------------------------------ *
 * API 呼び出し
 * ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 未設定だけでなく空文字(GitHub Actions の未定義 vars)も既定値に倒す */
function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `環境変数 ${name} が設定されていません。DMMアフィリエイトの管理画面で取得した値を設定してください。`,
    );
  }
  return v;
}

async function getJson(url: URL, attempts = 3): Promise<unknown> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastError = e;
      if (i < attempts) await sleep(REQUEST_INTERVAL_MS * i * 2);
    }
  }
  // API ID がログに残らないよう URL は出さない
  throw new Error(`API リクエストに失敗しました: ${String(lastError)}`);
}

function apiUrl(endpoint: string, params: Record<string, string>): URL {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set("api_id", requireEnv("FANZA_API_ID"));
  url.searchParams.set("affiliate_id", requireEnv("FANZA_AFFILIATE_ID"));
  url.searchParams.set("output", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

async function listFloors() {
  const json = (await getJson(apiUrl("FloorList", {}))) as {
    result?: {
      site?: {
        code?: string;
        name?: string;
        service?: { code?: string; name?: string; floor?: { code?: string; name?: string }[] }[];
      }[];
    };
  };
  for (const site of json.result?.site ?? []) {
    for (const service of site.service ?? []) {
      for (const floor of service.floor ?? []) {
        if (/doujin/i.test(`${service.code}${floor.code}`)) {
          console.log(
            `site=${site.code} service=${service.code} floor=${floor.code}  (${site.name} / ${service.name} / ${floor.name})`,
          );
        }
      }
    }
  }
}

async function fetchItems(): Promise<ApiItem[]> {
  const site = envOr("FANZA_SITE", "FANZA");
  const service = envOr("FANZA_SERVICE", "doujin");
  const floor = envOr("FANZA_FLOOR", "digital_doujin");
  const keywords = envOr("FANZA_KEYWORDS", "BL ボイス,ゲイ ボイス")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const pages = Number(envOr("FANZA_PAGES", "3"));
  const hits = Math.min(Number(envOr("FANZA_HITS", "100")), 100);

  const byId = new Map<string, ApiItem>();

  for (const keyword of keywords) {
    for (let page = 0; page < pages; page++) {
      const json = (await getJson(
        apiUrl("ItemList", {
          site,
          service,
          floor,
          keyword,
          hits: String(hits),
          offset: String(1 + page * hits),
          sort: "date",
        }),
      )) as ApiResponse;

      const result = json.result;
      if (String(result?.status) !== "200") {
        throw new Error(
          `API エラー: status=${result?.status} message=${result?.message ?? "(なし)"}`,
        );
      }

      const items = result?.items ?? [];
      for (const it of items) if (it.content_id) byId.set(it.content_id, it);
      console.log(
        `[${keyword}] page ${page + 1}: ${items.length}件 (total ${result?.total_count ?? "?"})`,
      );

      if (items.length < hits) break;
      await sleep(REQUEST_INTERVAL_MS);
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  return [...byId.values()];
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

function loadPrevious(): Map<string, Work> {
  try {
    const list = JSON.parse(readFileSync(WORKS_PATH, "utf8")) as Work[];
    return new Map(list.map((w) => [w.id, w]));
  } catch {
    return new Map();
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has("--floors")) {
    await listFloors();
    return;
  }

  const items = await fetchItems();
  const previous = loadPrevious();
  const today = todayJst();

  const works: Work[] = [];
  let skipped = 0;
  for (const item of items) {
    const w = normalizeItem(item, previous.get(item.content_id ?? ""), today);
    if (w) works.push(w);
    else skipped++;
  }

  // 取得失敗でサイトのデータが空になる事故を防ぐ
  if (works.length === 0) {
    throw new Error(
      `有効な作品が0件でした(取得${items.length}件 / 変換失敗${skipped}件)。works.json は更新しません。`,
    );
  }

  works.sort((a, b) => a.id.localeCompare(b.id));
  const droppedToday = works.filter((w) => w.priceDroppedDaysAgo === 0).length;
  console.log(
    `作品 ${works.length}件 (変換失敗 ${skipped}件 / 本日値下げ ${droppedToday}件)`,
  );

  if (args.has("--dry-run")) {
    console.log("--dry-run のため書き込みません。先頭3件:");
    console.log(JSON.stringify(works.slice(0, 3), null, 2));
    return;
  }

  writeFileSync(WORKS_PATH, `${JSON.stringify(works, null, 2)}\n`);
  console.log(`更新しました: ${WORKS_PATH}`);
}

// テストから import できるよう、直接実行されたときだけ main を走らせる
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
