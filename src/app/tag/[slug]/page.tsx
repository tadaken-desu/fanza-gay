import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkListing } from "@/components/WorkListing";
import { ALL_TAGS, findTag } from "@/lib/tags";
import {
  formatYen,
  getCircles,
  getCvs,
  getStats,
  getTagsOf,
  getWorksByTag,
} from "@/lib/works";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  // 作品が1件もないタグはページを作らない(薄いページを避ける)
  return ALL_TAGS.filter((t) => getWorksByTag(t.slug).length > 0).map((t) => ({
    slug: t.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = findTag(slug);
  const works = getWorksByTag(slug);
  if (!tag || works.length === 0) return {};

  const s = getStats(works);
  const saleLabel = s.onSale > 0 ? `【セール中${s.onSale}作品】` : "";

  return {
    title: `「${tag.label}」の同人音声・ASMR作品一覧${saleLabel}`,
    description: `「${tag.label}」のゲイ・BL向け同人音声${s.total}作品を掲載。セール中${s.onSale}作品・最安${formatYen(s.minPrice)}から。値下げ・過去最安値の作品をまとめてチェックできます。`,
    alternates: { canonical: `/tag/${slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = findTag(slug);
  const works = getWorksByTag(slug);
  if (!tag || works.length === 0) notFound();

  const s = getStats(works);
  const kind =
    tag.group === "relation" ? "関係性・キャラ属性" : "プレイ・音声シチュエーション";

  return (
    <WorkListing
      eyebrow={`タグ / ${kind}`}
      title={`「${tag.label}」の同人音声・ASMR作品一覧`}
      lead={`「${tag.label}」のゲイ・BL向け同人音声・ASMR作品を${s.total}作品まとめています。現在セール中は${s.onSale}作品(最大${s.maxDiscountRate}%OFF)、うち${s.atLowest}作品が当サイト観測上の過去最安値です。`}
      works={works}
      related={[
        {
          title: "一緒に付いているタグ",
          links: getTagsOf(works)
            .filter((t) => t.slug !== slug)
            .map((t) => ({
              href: `/tag/${t.slug}`,
              label: t.label,
              count: t.count,
            })),
        },
        {
          title: "このタグの作品に出演しているCV",
          links: getCvs(works).map((c) => ({
            href: `/cv/${c.slug}`,
            label: c.name,
            count: c.count,
          })),
        },
        {
          title: "このタグの作品があるサークル",
          links: getCircles(works).map((c) => ({
            href: `/circle/${c.slug}`,
            label: c.name,
            count: c.count,
          })),
        },
      ]}
    />
  );
}
