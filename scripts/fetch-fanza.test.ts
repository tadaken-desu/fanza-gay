// 実行: npm run test:scripts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyTags,
  normalizeItem,
  resolvePrice,
  todayJst,
  type ApiItem,
} from "./fetch-fanza.ts";
import type { Work } from "../src/lib/types.ts";

const today = "2026-11-26";

const item: ApiItem = {
  content_id: "d_999999",
  title: "【耳舐め】先輩の囁き添い寝",
  affiliateURL: "https://al.dmm.co.jp/?lurl=x&af_id=test-990",
  prices: { price: "660", list_price: "1,320" },
  iteminfo: {
    maker: [{ id: 123, name: "テスト亭" }],
    actor: [{ id: 77, name: "テスト太郎" }],
    genre: [
      { id: 1, name: "試聴あり" },
      { id: 2, name: "BL" },
    ],
  },
};

test("classifyTags: タイトルからタグを付ける", () => {
  assert.deepEqual(
    classifyTags("《ノンケ》スパダリ彼氏とラブ甘メス堕ち【バイノーラル】NTR"),
    ["nonke", "supadari", "mesu-ochi", "binaural", "ntr"],
  );
});

test("normalizeItem: 初観測のセール作品は今日値下げ扱い", () => {
  const w = normalizeItem(item, undefined, today)!;
  assert.equal(w.price, 660);
  assert.equal(w.regularPrice, 1320);
  assert.equal(w.discountRate, 50);
  assert.equal(w.priceDroppedOn, today);
  assert.equal(w.priceDroppedDaysAgo, 0);
  assert.equal(w.circle.slug, "circle-123");
  assert.equal(w.cv?.slug, "cv-77");
  assert.equal(w.sampleAudioAvailable, true);
  assert.deepEqual(w.relationTags, ["senpai-kouhai"]);
  assert.deepEqual(w.situationTags, ["mimi-name", "sasayaki", "soine"]);
});

test("normalizeItem: 必須項目が欠けていれば null", () => {
  assert.equal(normalizeItem({ ...item, iteminfo: {} }, undefined, today), null);
});

test("resolvePrice: 値下げ日の維持・更新・クリア", () => {
  const first = normalizeItem(item, undefined, today)!;

  // 価格変わらず → 値下げ日を維持し、経過日数だけ進む
  const kept = resolvePrice(660, 1320, first, "2026-11-28");
  assert.equal(kept.priceDroppedOn, today);
  assert.equal(kept.priceDroppedDaysAgo, 2);

  // さらに値下げ → 今日に更新、過去最安値も更新
  const lower = resolvePrice(550, 1320, { ...first, ...kept } as Work, "2026-11-28");
  assert.equal(lower.priceDroppedDaysAgo, 0);
  assert.equal(lower.lowestPrice, 550);

  // セール終了 → クリア。過去最安値は維持
  const ended = resolvePrice(1320, 1320, { ...first, ...lower } as Work, "2026-11-30");
  assert.equal(ended.priceDroppedOn, null);
  assert.equal(ended.priceDroppedDaysAgo, null);
  assert.equal(ended.discountRate, 0);
  assert.equal(ended.lowestPrice, 550);
});

test("todayJst: UTC 15時以降は翌日になる", () => {
  assert.equal(todayJst(Date.parse("2026-11-25T16:00:00Z")), "2026-11-26");
});
