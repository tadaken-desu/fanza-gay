import Link from "next/link";
import { Suspense } from "react";
import { FavoriteDeals, type DealItem } from "@/components/FavoriteDeals";
import { FilterSidebar } from "@/components/FilterSidebar";
import { LinkGroups } from "@/components/LinkGroups";
import { Pagination } from "@/components/Pagination";
import { QuickTabs } from "@/components/QuickTabs";
import { SortSelect } from "@/components/SortSelect";
import { WorkCard } from "@/components/WorkCard";
import { favoriteKey } from "@/lib/favorite-keys";
import {
  PAGE_SIZE,
  QUICK_TABS,
  filtersHref,
  hasActiveFilters,
  parseFilters,
} from "@/lib/filters";
import { RELATION_TAGS, SITUATION_TAGS, tagLabel } from "@/lib/tags";
import {
  countTags,
  filterWorks,
  formatYen,
  getAllWorks,
  getCircleBySlug,
  getCirclesWithPage,
  getCvs,
  isDroppedToday,
  sortWorks,
} from "@/lib/works";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  // 本日値下げ作品のカードはサーバーで描画し、お気に入りの出し分けだけクライアントで行う
  const deals: DealItem[] = getAllWorks()
    .filter(isDroppedToday)
    .map((w) => ({
      id: w.id,
      keys: [
        favoriteKey("circle", w.circle.slug),
        ...(w.cv ? [favoriteKey("cv", w.cv.slug)] : []),
      ],
      card: <WorkCard work={w} />,
    }));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black sm:text-3xl">
          ゲイ・BL向け同人音声の
          <span className="text-accent">セール</span>を毎日チェック
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          CV・サークル・シチュエーションタグで探せる同人音声・ASMRのデータベース。お気に入りの値下げをトップでお知らせします。
        </p>
      </header>

      <FavoriteDeals items={deals} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* searchParams はリクエスト時データなので、読む部分を Suspense で囲む */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<ResultsSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>

      <Directory />
    </main>
  );
}

async function Sidebar({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const all = getAllWorks();

  return (
    <FilterSidebar
      filters={filters}
      relCounts={countTags(all, "relationTags")}
      sitCounts={countTags(all, "situationTags")}
      resultCount={filterWorks(all, filters).length}
      showSampleFilter={all.some((w) => w.sampleAudioAvailable === true)}
    />
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const results = sortWorks(filterWorks(getAllWorks(), filters), filters.sort);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = results.slice(start, start + PAGE_SIZE);

  const circle = filters.circle
    ? (getCircleBySlug(filters.circle)?.name ?? filters.circle)
    : null;
  const tags = [...filters.rel, ...filters.sit].map(tagLabel);
  const heading = [
    circle,
    tags.length > 0 ? tags.join(filters.mode === "any" ? " / " : " × ") : null,
    filters.quick !== "all"
      ? QUICK_TABS.find((t) => t.key === filters.quick)?.plain
      : null,
    filters.maxPrice !== null ? `${formatYen(filters.maxPrice)}以下` : null,
    filters.saleOnly ? "セール中" : null,
    filters.sampleOnly ? "試聴あり" : null,
  ]
    .filter(Boolean)
    .join(" ・ ");

  return (
    <section aria-labelledby="results-heading" className="min-w-0">
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          Browse
        </p>
        <h2 id="results-heading" className="text-xl font-black">
          {hasActiveFilters(filters) ? `${heading} の作品` : "すべての作品"}
          <span className="ml-3 text-sm font-normal text-muted">
            {results.length}件
            {totalPages > 1 &&
              `(${start + 1}〜${start + pageItems.length}件目を表示)`}
          </span>
        </h2>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <QuickTabs filters={filters} />
        <SortSelect filters={filters} />
      </div>

      {filters.circle && (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">サークルで絞り込み中:</span>
          <Link
            href={filtersHref({ ...filters, circle: null, page: 1 })}
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-accent hover:bg-accent/20"
          >
            {circle}
            <span aria-hidden="true">×</span>
            <span className="sr-only">絞り込みを解除</span>
          </Link>
        </p>
      )}

      {pageItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center text-sm text-muted">
          条件に一致する作品がありません。条件を緩めてみてください。
        </div>
      )}

      <Pagination filters={{ ...filters, page }} totalPages={totalPages} />
    </section>
  );
}

/** pSEO ページへの入口。クローラーとユーザー双方の回遊用。 */
function Directory() {
  return (
    <section aria-labelledby="directory-heading" className="mt-16">
      <h2 id="directory-heading" className="mb-6 text-xl font-black">
        CV・サークル・タグから探す
      </h2>
      <LinkGroups
        groups={[
          {
            title: "CV(声優)",
            links: getCvs().map((c) => ({
              href: `/cv/${c.slug}`,
              label: c.name,
              count: c.count,
            })),
          },
          {
            title: "サークル(2作品以上)",
            links: getCirclesWithPage().map((c) => ({
              href: `/circle/${c.slug}`,
              label: c.name,
              count: c.count,
            })),
          },
          {
            title: "関係性・キャラ属性",
            links: RELATION_TAGS.map((t) => ({
              href: `/tag/${t.slug}`,
              label: t.label,
            })),
          },
          {
            title: "プレイ・音声シチュエーション",
            links: SITUATION_TAGS.map((t) => ({
              href: `/tag/${t.slug}`,
              label: t.label,
            })),
          },
        ]}
      />
    </section>
  );
}

function SidebarSkeleton() {
  return (
    <div
      className="hidden h-96 animate-pulse rounded-xl border border-line bg-surface lg:block"
      aria-hidden="true"
    />
  );
}

function ResultsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}
