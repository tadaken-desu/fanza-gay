import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkListing } from "@/components/WorkListing";
import {
  formatYen,
  getCircles,
  getCvs,
  getStats,
  getTagsOf,
  getWorksByCv,
} from "@/lib/works";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCvs().map((cv) => ({ slug: cv.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const works = getWorksByCv(slug);
  const cv = works[0]?.cv;
  if (!cv) return {};

  const s = getStats(works);
  const saleLabel = s.onSale > 0 ? `【セール中${s.onSale}作品】` : "";

  return {
    title: `${cv.name}の同人音声・ASMR作品一覧${saleLabel}`,
    description: `${cv.name}(CV)が出演するゲイ・BL向け同人音声${s.total}作品を掲載。セール中${s.onSale}作品・最安${formatYen(s.minPrice)}から。過去最安値の作品もまとめてチェックできます。`,
    alternates: { canonical: `/cv/${slug}` },
  };
}

export default async function CvPage({ params }: Props) {
  const { slug } = await params;
  const works = getWorksByCv(slug);
  const cv = works[0]?.cv;
  if (!cv) notFound();

  const s = getStats(works);

  return (
    <WorkListing
      eyebrow="CV(声優)"
      title={`${cv.name}の同人音声・ASMR作品一覧`}
      lead={`${cv.name}さんが出演するゲイ・BL向け同人音声・ASMR作品を${s.total}作品まとめています。現在セール中は${s.onSale}作品(最大${s.maxDiscountRate}%OFF)、うち${s.atLowest}作品が当サイト観測上の過去最安値です。`}
      works={works}
      related={[
        {
          title: "出演作のサークル",
          links: getCircles(works).map((c) => ({
            href: `/circle/${c.slug}`,
            label: c.name,
            count: c.count,
          })),
        },
        {
          title: "出演作によく付くタグ",
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
