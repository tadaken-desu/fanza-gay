import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { tagLabel } from "@/lib/tags";
import type { Work } from "@/lib/types";
import { formatYen, isAtLowestPrice, isDroppedToday, isOnSale } from "@/lib/works";

/** id から安定した数値を作る(プレースホルダーの色・波形用) */
function hashOf(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return h;
}

/** 画像が入るまでの代替ビジュアル。音声作品らしく波形風のバーを描く。 */
function Cover({ work }: { work: Work }) {
  const h = hashOf(work.id);
  const hue = h % 360;
  const bars = Array.from({ length: 28 }, (_, i) =>
    Math.round(18 + Math.abs(Math.sin((i + 1) * (h % 7 + 2) * 0.37)) * 62),
  );

  return (
    <div
      className="relative flex aspect-[16/9] items-end justify-center gap-[3px] overflow-hidden px-4 pb-4"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 24%), hsl(${(hue + 60) % 360} 55% 10%))`,
      }}
      aria-hidden="true"
    >
      <span className="absolute top-3 right-4 text-5xl font-black text-white/[0.06] select-none">
        {work.circle.name.charAt(0)}
      </span>
      {bars.map((height, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-white/25"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function dropLabel(days: number | null): string | null {
  if (days === null) return null;
  return days === 0 ? "本日値下げ" : `${days}日前に値下げ`;
}

export function WorkCard({ work }: { work: Work }) {
  const onSale = isOnSale(work);
  const label = dropLabel(work.priceDroppedDaysAgo);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-accent/40 hover:shadow-[0_0_32px_-12px_var(--color-accent)]">
      <div className="relative">
        <Cover work={work} />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
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
        {work.sampleAudioAvailable && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
            <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            試聴あり
          </span>
        )}
        {label && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-foreground/80 backdrop-blur">
            {label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm leading-snug font-bold">
          {work.title}
        </h3>

        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="w-14 shrink-0 text-xs text-muted">サークル</dt>
            <dd className="min-w-0 flex-1 truncate">
              <Link
                href={`/circle/${work.circle.slug}`}
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
