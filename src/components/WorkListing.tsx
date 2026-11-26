import Link from "next/link";
import { LinkGroups, type LinkGroup } from "@/components/LinkGroups";
import { WorkCard } from "@/components/WorkCard";
import type { Work } from "@/lib/types";
import { formatYen, getStats, isOnSale, sortBySale } from "@/lib/works";

type Props = {
  /** 「CV」「サークル」「タグ」などの種別ラベル(パンくず・見出し用) */
  eyebrow: string;
  title: string;
  lead: string;
  works: Work[];
  related: LinkGroup[];
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-black tabular-nums">{value}</dd>
    </div>
  );
}

/** /cv/[slug]・/circle/[slug]・/tag/[slug] 共通の一覧ページ本体。 */
export function WorkListing({ eyebrow, title, lead, works, related }: Props) {
  const stats = getStats(works);
  const sale = sortBySale(works.filter(isOnSale));
  const all = [...works].sort(
    (a, b) => b.discountRate - a.discountRate || a.price - b.price,
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <nav aria-label="パンくず" className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-accent hover:underline">
          トップ
        </Link>
        <span className="mx-2">›</span>
        <span>{eyebrow}</span>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          {lead}
        </p>
      </header>

      <dl className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="作品数" value={`${stats.total}作品`} />
        <Stat label="セール中" value={`${stats.onSale}作品`} />
        <Stat label="過去最安値の作品" value={`${stats.atLowest}作品`} />
        <Stat label="最安価格" value={formatYen(stats.minPrice)} />
      </dl>

      <section aria-labelledby="sale-heading" className="mb-12">
        <h2 id="sale-heading" className="mb-4 text-xl font-black">
          セール中の作品
          <span className="ml-3 text-sm font-normal text-muted">
            {sale.length}件
          </span>
        </h2>
        {sale.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sale.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-10 text-center text-sm text-muted">
            現在セール中の作品はありません。値下げされ次第ここに表示されます。
          </p>
        )}
      </section>

      <section aria-labelledby="all-heading" className="mb-12">
        <h2 id="all-heading" className="mb-4 text-xl font-black">
          すべての作品
          <span className="ml-3 text-sm font-normal text-muted">
            {all.length}件
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {all.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      </section>

      <section aria-labelledby="related-heading">
        <h2 id="related-heading" className="mb-4 text-xl font-black">
          あわせてチェック
        </h2>
        <LinkGroups groups={related} />
      </section>
    </main>
  );
}
