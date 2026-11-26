import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { WorkCover } from "@/components/WorkCover";
import { tagLabel } from "@/lib/tags";
import type { Work } from "@/lib/types";
import {
  circleHref,
  formatYen,
  isAtLowestPrice,
  isDroppedToday,
  isOnSale,
} from "@/lib/works";

function dropLabel(days: number | null): string | null {
  if (days === null) return null;
  return days === 0 ? "本日値下げ" : `${days}日前に値下げ`;
}

/**
 * 一覧用カード。
 *  - ジャケット画像・タイトル → 作品詳細ページ(/work/[id])
 *  - 「FANZAで見る」 → アフィリエイト URL へ直接
 * 一覧には大量に並ぶので、リンクは prefetch しない。
 */
export function WorkCard({ work }: { work: Work }) {
  const onSale = isOnSale(work);
  const label = dropLabel(work.priceDroppedDaysAgo);
  const detailHref = `/work/${work.id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-accent/40 hover:shadow-[0_0_32px_-12px_var(--color-accent)]">
      <div className="relative">
        <Link
          href={detailHref}
          prefetch={false}
          className="block"
          tabIndex={-1}
          aria-hidden="true"
        >
          <WorkCover
            work={work}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 100vw"
          />
        </Link>
        <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1.5">
          {onSale && (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                isDroppedToday(work)
                  ? "bg-accent text-[#14101f]"
                  : "bg-black/60 text-accent"
              }`}
            >
              {work.discountRate}% OFF
            </span>
          )}
          {onSale && isAtLowestPrice(work) && (
            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">
              過去最安値
            </span>
          )}
        </div>
        {work.sampleAudioAvailable === true && (
          <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
            <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            試聴あり
          </span>
        )}
        {label && (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-foreground/80 backdrop-blur">
            {label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm leading-snug font-bold">
          <Link
            href={detailHref}
            prefetch={false}
            className="hover:text-accent hover:underline"
          >
            {work.title}
          </Link>
        </h3>

        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="w-14 shrink-0 text-xs text-muted">サークル</dt>
            <dd className="min-w-0 flex-1 truncate">
              <Link
                href={circleHref(work.circle.slug)}
                prefetch={false}
                className="hover:text-accent hover:underline"
              >
                {work.circle.name}
              </Link>
            </dd>
            <FavoriteButton
              kind="circle"
              slug={work.circle.slug}
              name={work.circle.name}
            />
          </div>
          {work.cv && (
            <div className="flex items-center justify-between gap-2">
              <dt className="w-14 shrink-0 text-xs text-muted">CV</dt>
              <dd className="min-w-0 flex-1 truncate">
                <Link
                  href={`/cv/${work.cv.slug}`}
                  prefetch={false}
                  className="hover:text-accent hover:underline"
                >
                  {work.cv.name}
                </Link>
              </dd>
              <FavoriteButton
                kind="cv"
                slug={work.cv.slug}
                name={work.cv.name}
              />
            </div>
          )}
        </dl>

        <ul className="flex flex-wrap gap-1.5">
          {work.relationTags.map((t) => (
            <li key={t}>
              <Link
                href={`/tag/${t}`}
                prefetch={false}
                className="block rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent hover:bg-accent/25"
              >
                {tagLabel(t)}
              </Link>
            </li>
          ))}
          {work.situationTags.map((t) => (
            <li key={t}>
              <Link
                href={`/tag/${t}`}
                prefetch={false}
                className="block rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:border-accent/50 hover:text-accent"
              >
                {tagLabel(t)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black tabular-nums">
              {formatYen(work.price)}
            </span>
            {onSale && (
              <span className="text-xs text-muted line-through tabular-nums">
                {formatYen(work.regularPrice)}
              </span>
            )}
          </div>
          <a
            href={work.affiliateUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="shrink-0 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            FANZAで見る
            <span aria-hidden="true"> ›</span>
          </a>
        </div>
      </div>
    </article>
  );
}
