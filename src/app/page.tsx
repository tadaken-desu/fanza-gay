import { Suspense } from "react";
import { FavoriteDeals } from "@/components/FavoriteDeals";
import { FilterSidebar } from "@/components/FilterSidebar";
import { LinkGroups } from "@/components/LinkGroups";
import { WorkCard } from "@/components/WorkCard";
import { hasActiveFilters, parseFilters } from "@/lib/filters";
import { RELATION_TAGS, SITUATION_TAGS, tagLabel } from "@/lib/tags";
import {
  countTags,
  filterWorks,
  getAllWorks,
  getCircles,
  getCvs,
  formatYen,
  isDroppedToday,
} from "@/lib/works";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  const all = getAllWorks();

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

      <FavoriteDeals droppedToday={all.filter(isDroppedToday)} />

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
  const results = filterWorks(getAllWorks(), filters);
  const tags = [...filters.rel, ...filters.sit].map(tagLabel);
  const joiner = filters.mode === "any" ? " / " : " × ";
  const heading = [
    tags.length > 0 ? tags.join(joiner) : null,
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
          </span>
        </h2>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center text-sm text-muted">
          条件に一致する作品がありません。条件を緩めてみてください。
        </div>
      )}
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
            title: "サークル",
            links: getCircles().map((c) => ({
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
