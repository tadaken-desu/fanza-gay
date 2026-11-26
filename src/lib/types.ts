import type { RelationTagSlug, SituationTagSlug } from "@/lib/tags";

/** サークル / 声優(CV)。slug は /circle/[slug]・/cv/[slug] の URL に使う。 */
export type Person = {
  slug: string;
  name: string;
};

export type Work = {
  /** FANZA の content_id(ダミーは d_dummyNNN) */
  id: string;
  title: string;
  circle: Person;
  /** CV 情報が取れない作品は null */
  cv: Person | null;

  /** 現在価格(税込・円) */
  price: number;
  /** 通常価格(税込・円)。セールでなければ price と同じ */
  regularPrice: number;
  /** 割引率(%)。(1 - price / regularPrice) を四捨五入した値 */
  discountRate: number;
  /** 当サイトが観測した過去最安値(円) */
  lowestPrice: number;

  /** 値下げを検知した日(YYYY-MM-DD, JST)。セールでなければ null。fetch スクリプトが管理 */
  priceDroppedOn: string | null;
  /**
   * 値下げから何日経ったか。0 = 今日、null = セールなし。
   * priceDroppedOn から fetch スクリプトが毎回再計算する(ダミーデータは固定値)。
   */
  priceDroppedDaysAgo: number | null;

  /** FANZA 作品ページへのアフィリエイトリンク */
  affiliateUrl: string;
  /** 作品サムネイル画像(https)。ない場合は null(UI は波形カバーを表示) */
  thumbnailUrl: string | null;
  /**
   * 試聴ボイスの有無。FANZA API には対応フィールドがないため、
   * 実データでは null(不明)。UI は true のときだけ「試聴あり」を出す。
   */
  sampleAudioAvailable: boolean | null;

  /** FANZA のジャンル名(「ゲイ」「BL（ボーイズラブ）」など)。「ゲイ向け」判定に使う */
  genres: string[];

  relationTags: RelationTagSlug[];
  situationTags: SituationTagSlug[];
};
