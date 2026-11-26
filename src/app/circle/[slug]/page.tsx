import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkListing } from "@/components/WorkListing";
import {
  formatYen,
  getCircles,
  getCvs,
  getStats,
  getTagsOf,
  getWorksByCircle,
} from "@/lib/works";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCircles().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const works = getWorksByCircle(slug);
  const circle = works[0]?.circle;
  if (!circle) return {};

  const s = getStats(works);
  const saleLabel = s.onSale > 0 ? `【セール中${s.onSale}作品】` : "";

  return {
    title: `${circle.name}の同人音声・ASMR作品一覧${saleLabel}`,
    description: `サークル「${circle.name}」のゲイ・BL向け同人音声${s.total}作品を掲載。セール中${s.onSale}作品・最安${formatYen(s.minPrice)}から。値下げ・過去最安値の作品をまとめてチェックできます。`,
    alternates: { canonical: `/circle/${slug}` },
  };
}

export default async function CirclePage({ params }: Props) {
  const { slug } = await params;
  const works = getWorksByCircle(slug);
  const circle = works[0]?.circle;
  if (!circle) notFound();

  const s = getStats(works);

  return (
    <WorkListing
      eyebrow="サークル"
      title={`${circle.name}の同人音声・ASMR作品一覧`}
      lead={`サークル「${circle.name}」のゲイ・BL向け同人音声・ASMR作品を${s.total}作品まとめています。現在セール中は${s.onSale}作品(最大${s.maxDiscountRate}%OFF)、うち${s.atLowest}作品が当サイト観測上の過去最安値です。`}
      works={works}
      related={[
        {
          title: "起用しているCV",
          links: getCvs(works).map((c) => ({
            href: `/cv/${c.slug}`,
            label: c.name,
            count: c.count,
          })),
        },
        {
          title: "作品によく付くタグ",
          links: getTagsOf(works).map((t) => ({
            href: `/tag/${t.slug}`,
            label: t.label,
            count: t.count,
          })),
        },
      ]}
    />
  );
}
