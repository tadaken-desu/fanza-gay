import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { WorkCard } from "@/components/WorkCard";
import { WorkCover } from "@/components/WorkCover";
import { tagLabel } from "@/lib/tags";
import type { Work } from "@/lib/types";
import {
  circleHref,
  formatYen,
  getAllWorks,
  getSameCircleWorks,
  getSameTagSaleWorks,
  getWorkById,
  isAtLowestPrice,
  isDroppedToday,
  isOnSale,
} from "@/lib/works";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getAllWorks().map((w) => ({ id: w.id }));
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n)}…` : s;

function priceSummary(w: Work): string {
  if (!isOnSale(w)) return `${formatYen(w.price)}`;
  const lowest = isAtLowestPrice(w) ? "・過去最安値" : "";
  return `${formatYen(w.price)}(通常${formatYen(w.regularPrice)}から${w.discountRate}%OFF${lowest})`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const work = getWorkById(id);
  if (!work) return {};

  const sale = isOnSale(work) ? ` ${work.discountRate}%OFF` : "";
  const tags = [...work.relationTags, ...work.situationTags]
    .slice(0, 5)
    .map(tagLabel)
    .join("・");

  return {
    title: `${truncate(work.title, 50)}【${formatYen(work.price)}${sale}】`,
    description: `${work.circle.name}${work.cv ? `(CV:${work.cv.name})` : ""}のゲイ・BL向け同人音声。現在${priceSummary(work)}。${tags ? `タグ: ${tags}。` : ""}セール情報・過去最安値をチェック。`,
    alternates: { canonical: `/work/${work.id}` },
    openGraph: {
      title: work.title,
      type: "website",
      ...(work.thumbnailUrl ? { images: [work.thumbnailUrl] } : {}),
    },
  };
}

function dropLabel(days: number | null): string | null {
  if (days === null) return null;
  return days === 0 ? "本日値下げ" : `${days}日前に値下げ`;
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const work = getWorkById(id);
  if (!work) notFound();

  const onSale = isOnSale(work);
  const atLowest = isAtLowestPrice(work);
  const label = dropLabel(work.priceDroppedDaysAgo);
  const sameCircle = getSameCircleWorks(work);
  const sameTag = getSameTagSaleWorks(work, sameCircle);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <nav aria-label="パンくず" className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-accent hover:underline">
          トップ
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={circleHref(work.circle.slug)}
          className="hover:text-accent hover:underline"
        >
          {work.circle.name}
        </Link>
        <span className="mx-2">›</span>
        <span>{truncate(work.title, 30)}</span>
      </nav>

      <article className="grid gap-8 md:grid-cols-[minmax(0,560px)_1fr]">
        <div className="group overflow-hidden rounded-xl border border-line">
          <WorkCover
            work={work}
            sizes="(min-width: 768px) 560px, 100vw"
            preload
          />
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            {onSale && (
              <span
                className={`rounded-md px-2.5 py-1 text-sm font-bold ${
                  isDroppedToday(work)
                    ? "bg-accent text-[#14101f]"
                    : "bg-surface text-accent ring-1 ring-accent/40"
                }`}
              >
                {work.discountRate}% OFF
              </span>
            )}
            {onSale && atLowest && (
              <span className="rounded-md bg-amber-400 px-2.5 py-1 text-sm font-bold text-black">
                過去最安値
              </span>
            )}
            {label && (
              <span className="rounded-md bg-surface px-2.5 py-1 text-sm text-foreground/80 ring-1 ring-line">
                {label}
              </span>
            )}
            {work.sampleAudioAvailable === true && (
              <span className="rounded-md bg-surface px-2.5 py-1 text-sm text-foreground/80 ring-1 ring-line">
                試聴あり
              </span>
            )}
          </div>

          <h1 className="text-xl leading-snug font-black sm:text-2xl">
            {work.title}
          </h1>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <dt className="w-16 shrink-0 text-xs text-muted">サークル</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <Link
                  href={circleHref(work.circle.slug)}
                  className="truncate hover:text-accent hover:underline"
                >
                  {work.circle.name}
                </Link>
                <FavoriteButton
                  kind="circle"
                  slug={work.circle.slug}
                  name={work.circle.name}
                />
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="w-16 shrink-0 text-xs text-muted">CV</dt>
              <dd className="flex min-w-0 items-center gap-2">
                {work.cv ? (
                  <>
                    <Link
                      href={`/cv/${work.cv.slug}`}
                      className="truncate hover:text-accent hover:underline"
                    >
                      {work.cv.name}
                    </Link>
                    <FavoriteButton
                      kind="cv"
                      slug={work.cv.slug}
                      name={work.cv.name}
                    />
                  </>
                ) : (
                  <span className="text-muted">情報なし</span>
                )}
              </dd>
            </div>
          </dl>

          <section
            aria-label="価格"
            className="mt-6 rounded-xl border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-3xl font-black tabular-nums">
                {formatYen(work.price)}
              </span>
              {onSale && (
                <>
                  <span className="text-sm text-muted line-through tabular-nums">
                    {formatYen(work.regularPrice)}
                  </span>
                  <span className="font-bold text-accent">
                    {work.discountRate}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-3 text-sm text-muted">
              当サイト観測の過去最安値:{" "}
              <span className="font-bold text-foreground tabular-nums">
                {formatYen(work.lowestPrice)}
              </span>
              {atLowest ? "(現在はこの価格です)" : ""}
            </p>
            {work.priceDroppedOn && (
              <p className="mt-1 text-xs text-muted">
                値下げを確認した日: {work.priceDroppedOn}
              </p>
            )}

            <a
              href={work.affiliateUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mt-5 block rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-4 text-center text-base font-black text-white shadow-[0_8px_32px_-8px_var(--color-accent)] transition hover:brightness-110"
            >
              FANZAで試聴・詳細を見る
              <span aria-hidden="true"> ›</span>
            </a>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              ※ 価格・セール情報は変動します。購入前に必ずFANZAの商品ページでご確認ください。
            </p>
          </section>

          <section aria-labelledby="tags-heading" className="mt-6">
            <h2
              id="tags-heading"
              className="mb-3 text-xs font-semibold tracking-wider text-muted"
            >
              タグ
            </h2>
            <ul className="flex flex-wrap gap-2">
              {work.relationTags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/tag/${t}`}
                    className="block rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/25"
                  >
                    {tagLabel(t)}
                  </Link>
                </li>
              ))}
              {work.situationTags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/tag/${t}`}
                    className="block rounded-full border border-line px-3 py-1 text-sm text-foreground/80 hover:border-accent/50 hover:text-accent"
                  >
                    {tagLabel(t)}
                  </Link>
                </li>
              ))}
              {work.relationTags.length + work.situationTags.length === 0 && (
                <li className="text-sm text-muted">タグ情報なし</li>
              )}
            </ul>
          </section>
        </div>
      </article>

      {sameCircle.length > 0 && (
        <RelatedSection
          id="same-circle"
          title="同じサークルの作品"
          more={{
            href: circleHref(work.circle.slug),
            label: `${work.circle.name}の作品をもっと見る`,
          }}
          works={sameCircle}
        />
      )}

      {sameTag.length > 0 && (
        <RelatedSection
          id="same-tag"
          title="同じタグのセール中作品"
          works={sameTag}
        />
      )}
    </main>
  );
}

function RelatedSection({
  id,
  title,
  works,
  more,
}: {
  id: string;
  title: string;
  works: Work[];
  more?: { href: string; label: string };
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-14">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id={`${id}-heading`} className="text-xl font-black">
          {title}
        </h2>
        {more && (
          <Link
            href={more.href}
            className="text-sm text-muted hover:text-accent hover:underline"
          >
            {more.label} ›
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>
    </section>
  );
}
