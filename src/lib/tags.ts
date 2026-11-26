/**
 * タグマスタ。slug は URL(/tag/[slug] とクエリ)で使う識別子で、
 * 2グループ全体で一意にすること(/tag/[slug] が1つのルートで両方を扱うため)。
 *
 * scripts/fetch-fanza.ts もこのファイルを import してタグ付けするので、
 * タグを増やすときはここに追記し、スクリプト側のキーワード規則も合わせて更新する。
 */

/** 関係性・キャラ属性タグ */
export const RELATION_TAGS = [
  { slug: "nonke", label: "ノンケ" },
  { slug: "supadari", label: "スパダリ" },
  { slug: "toshishita-zeme", label: "年下攻め" },
  { slug: "senpai-kouhai", label: "先輩・後輩" },
  { slug: "gachimuchi", label: "体育会系・ガチムチ" },
  { slug: "riman", label: "リーマン" },
  { slug: "yandere", label: "ヤンデレ・執着" },
  { slug: "mesu-ochi", label: "メス堕ち" },
] as const;

/** プレイ・音声シチュエーションタグ */
export const SITUATION_TAGS = [
  { slug: "binaural", label: "バイノーラル" },
  { slug: "mimi-name", label: "耳舐め" },
  { slug: "sasayaki", label: "囁き・吐息" },
  { slug: "onasapo", label: "オナサポ" },
  { slug: "soine", label: "密着・添い寝" },
  { slug: "shukan", label: "主観" },
  { slug: "kotoba-zeme", label: "言葉責め" },
  { slug: "ntr", label: "NTR・寝取られ" },
  { slug: "kairaku-ochi", label: "快楽堕ち" },
  { slug: "fera-tekoki", label: "フェラ・手コキ音" },
] as const;

export type RelationTagSlug = (typeof RELATION_TAGS)[number]["slug"];
export type SituationTagSlug = (typeof SITUATION_TAGS)[number]["slug"];
export type TagSlug = RelationTagSlug | SituationTagSlug;

export type TagGroup = "relation" | "situation";

export type Tag = {
  slug: TagSlug;
  label: string;
  group: TagGroup;
};

export const ALL_TAGS: readonly Tag[] = [
  ...RELATION_TAGS.map((t) => ({ ...t, group: "relation" as const })),
  ...SITUATION_TAGS.map((t) => ({ ...t, group: "situation" as const })),
];

const tagMap = new Map<string, Tag>(ALL_TAGS.map((t) => [t.slug, t]));

export function findTag(slug: string): Tag | undefined {
  return tagMap.get(slug);
}

export function tagLabel(slug: string): string {
  return tagMap.get(slug)?.label ?? slug;
}
