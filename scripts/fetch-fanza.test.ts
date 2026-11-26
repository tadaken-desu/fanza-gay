// 実行: npm run test:scripts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  campaignStartJst,
  classifyTags,
  extractCv,
  isVoiceWork,
  normalizeItem,
  resolvePrice,
  todayJst,
  type ApiItem,
} from "./fetch-fanza.ts";
import type { Work } from "../src/lib/types.ts";

const today = "2026-11-26";

// 実 API のレスポンス(2026-11 時点)の形に合わせたフィクスチャ
const voiceItem: ApiItem = {
  content_id: "d_858402",
  title: "【BL音声】先輩の囁き添い寝【出演声優:立知鼎、霞一恵】",
  affiliateURL: "https://al.fanza.co.jp/?lurl=x&af_id=test-990&ch=api",
  imageURL: {
    list: "https://doujin-assets.dmm.co.jp/digital/voice/d_858402/d_858402pt.jpg",
    large: "https://doujin-assets.dmm.co.jp/digital/voice/d_858402/d_858402pl.jpg",
  },
  prices: { price: "55", list_price: "110" },
  campaign: [{ date_begin: "2026-11-25T16:00:00Z", date_end: "", title: "50%OFF" }],
  iteminfo: {
    maker: [{ id: 217668, name: "パラレル" }],
    genre: [
      { id: 1, name: "ゲイ" },
      { id: 2, name: "ガチムチ" },
      { id: 3, name: "同級生/同僚" },
    ],
  },
};

const comicItem: ApiItem = {
  ...voiceItem,
  content_id: "d_000001",
  imageURL: {
    large: "https://doujin-assets.dmm.co.jp/digital/comic/d_000001/d_000001pl.jpg",
  },
};

test("classifyTags: タイトルとジャンルからタグを付ける", () => {
  assert.deepEqual(
    classifyTags("《ノンケ》スパダリ彼氏とラブ甘メス堕ち【バイノーラル】NTR"),
    ["nonke", "supadari", "mesu-ochi", "binaural", "ntr"],
  );
  // 「同級生/同僚」だけでリーマン扱いにしない
  assert.deepEqual(classifyTags("同級生/同僚"), []);
});

test("isVoiceWork: 画像パスで音声作品だけを通す", () => {
  assert.equal(isVoiceWork(voiceItem), true);
  assert.equal(isVoiceWork(comicItem), false);
  assert.equal(isVoiceWork({}), false);
});

test("extractCv: タイトルの【出演声優:○○】から先頭1名を取り出す", () => {
  assert.equal(extractCv("【出演声優:立知鼎、霞一恵】")?.name, "立知鼎");
  assert.equal(extractCv("ボイスドラマ(CV：八十八エイト)")?.name, "八十八エイト");
  // 実データにある表記ゆれ
  assert.equal(extractCv("話【CV.一条ひらめ】")?.name, "一条ひらめ");
  assert.equal(extractCv("話【CV:日乃 ひかり様】")?.name, "日乃 ひかり");
  assert.equal(extractCv("話【CV:雨色オニオン様・刺草ネトル様】")?.name, "雨色オニオン");
  assert.equal(extractCv("欲しがる後輩』【出演:立知鼎、噛谷】")?.name, "立知鼎");
  assert.equal(extractCv("声優情報なしの作品"), null);
  // 同じ名前なら同じ slug になる
  assert.equal(extractCv("CV:立知鼎】")?.slug, extractCv("【出演声優:立知鼎】")?.slug);
});

test("campaignStartJst: UTC の開始時刻を JST の日付にする", () => {
  assert.equal(campaignStartJst(voiceItem), "2026-11-26");
  assert.equal(campaignStartJst({}), null);
});

test("normalizeItem: 実レスポンス形式の作品を変換する", () => {
  const w = normalizeItem(voiceItem, undefined, today)!;
  assert.equal(w.price, 55);
  assert.equal(w.regularPrice, 110);
  assert.equal(w.discountRate, 50);
  assert.equal(w.priceDroppedOn, "2026-11-26"); // campaign.date_begin(JST)
  assert.equal(w.priceDroppedDaysAgo, 0);
  assert.equal(w.circle.slug, "circle-217668");
  assert.equal(w.cv?.name, "立知鼎");
  assert.equal(
    w.thumbnailUrl,
    "https://doujin-assets.dmm.co.jp/digital/voice/d_858402/d_858402pl.jpg",
  );
  assert.equal(w.sampleAudioAvailable, null);
  assert.deepEqual(w.relationTags, ["senpai-kouhai", "gachimuchi"]);
  assert.deepEqual(w.situationTags, ["sasayaki", "soine"]);
});

test("normalizeItem: 音声以外・必須項目欠落は null", () => {
  assert.equal(normalizeItem(comicItem, undefined, today), null);
  assert.equal(
    normalizeItem({ ...voiceItem, iteminfo: {} }, undefined, today),
    null,
  );
});

test("normalizeItem: キャンペーン情報がなく初観測のセールは値下げ日を持たない", () => {
  const w = normalizeItem({ ...voiceItem, campaign: undefined }, undefined, today)!;
  assert.equal(w.discountRate, 50);
  assert.equal(w.priceDroppedOn, null);
  assert.equal(w.priceDroppedDaysAgo, null);
});

test("resolvePrice: 値下げ日の維持・更新・クリア", () => {
  const first = normalizeItem(voiceItem, undefined, today)!;

  // 価格変わらず → 値下げ日を維持し、経過日数だけ進む
  const kept = resolvePrice(55, 110, first, "2026-11-28", "2026-11-26");
  assert.equal(kept.priceDroppedOn, today);
  assert.equal(kept.priceDroppedDaysAgo, 2);

  // さらに値下げ → 今日に更新、過去最安値も更新
  const lower = resolvePrice(44, 110, { ...first, ...kept } as Work, "2026-11-28");
  assert.equal(lower.priceDroppedDaysAgo, 0);
  assert.equal(lower.lowestPrice, 44);

  // 未来日のキャンペーンは無視する
  const future = resolvePrice(55, 110, undefined, today, "2026-12-01");
  assert.equal(future.priceDroppedOn, null);

  // セール終了 → クリア。過去最安値は維持
  const ended = resolvePrice(110, 110, { ...first, ...lower } as Work, "2026-11-30");
  assert.equal(ended.priceDroppedOn, null);
  assert.equal(ended.priceDroppedDaysAgo, null);
  assert.equal(ended.discountRate, 0);
  assert.equal(ended.lowestPrice, 44);
});

test("todayJst: UTC 15時以降は翌日になる", () => {
  assert.equal(todayJst(Date.parse("2026-11-25T16:00:00Z")), "2026-11-26");
});
