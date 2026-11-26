"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  EMPTY_FILTERS,
  PRICE_LIMITS,
  filtersToQuery,
  hasActiveFilters,
  type Filters,
} from "@/lib/filters";
import { RELATION_TAGS, SITUATION_TAGS } from "@/lib/tags";
import { formatYen } from "@/lib/works";

type Props = {
  filters: Filters;
  relCounts: Record<string, number>;
  sitCounts: Record<string, number>;
  resultCount: number;
  /** 試聴の有無が分かる作品が1件もないとき(API 未対応)は、試聴フィルタを出さない */
  showSampleFilter: boolean;
};

function toggleIn(list: string[], slug: string) {
  return list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
}

function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-accent bg-accent/15 font-bold text-accent"
          : "border-line text-foreground/80 hover:border-accent/50"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-xs ${active ? "text-accent/70" : "text-muted"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-line pt-4">
      <legend className="float-left mb-3 w-full text-xs font-semibold tracking-wider text-muted">
        {title}
      </legend>
      <div className="clear-both flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-accent)]"
      />
      {children}
    </label>
  );
}

export function FilterSidebar({
  filters,
  relCounts,
  sitCounts,
  resultCount,
  showSampleFilter,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = hasActiveFilters(filters);

  function apply(next: Filters) {
    const q = filtersToQuery(next);
    startTransition(() => {
      router.push(q ? `/?${q}` : "/", { scroll: false });
    });
  }

  return (
    <aside aria-label="絞り込み" className="lg:sticky lg:top-20 lg:self-start">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm font-bold lg:hidden"
      >
        <span>絞り込み{active && " (適用中)"}</span>
        <span className="text-muted">{mobileOpen ? "閉じる" : "開く"}</span>
      </button>

      <div
        className={`${mobileOpen ? "block" : "hidden"} space-y-4 rounded-xl border border-line bg-surface p-5 transition-opacity lg:block ${
          pending ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-black">絞り込み検索</h2>
          <button
            type="button"
            onClick={() => apply(EMPTY_FILTERS)}
            disabled={!active}
            className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline disabled:pointer-events-none disabled:opacity-30"
          >
            リセット
          </button>
        </div>

        <Group title="関係性・キャラ属性">
          {RELATION_TAGS.map((t) => (
            <Chip
              key={t.slug}
              active={filters.rel.includes(t.slug)}
              count={relCounts[t.slug] ?? 0}
              onClick={() =>
                apply({ ...filters, rel: toggleIn(filters.rel, t.slug) })
              }
            >
              {t.label}
            </Chip>
          ))}
        </Group>

        <Group title="プレイ・音声シチュエーション">
          {SITUATION_TAGS.map((t) => (
            <Chip
              key={t.slug}
              active={filters.sit.includes(t.slug)}
              count={sitCounts[t.slug] ?? 0}
              onClick={() =>
                apply({ ...filters, sit: toggleIn(filters.sit, t.slug) })
              }
            >
              {t.label}
            </Chip>
          ))}
        </Group>

        <Group title="タグの一致条件">
          <Chip
            active={filters.mode === "all"}
            onClick={() => apply({ ...filters, mode: "all" })}
          >
            すべて含む
          </Chip>
          <Chip
            active={filters.mode === "any"}
            onClick={() => apply({ ...filters, mode: "any" })}
          >
            いずれか含む
          </Chip>
        </Group>

        <Group title="価格">
          <Chip
            active={filters.maxPrice === null}
            onClick={() => apply({ ...filters, maxPrice: null })}
          >
            指定なし
          </Chip>
          {PRICE_LIMITS.map((p) => (
            <Chip
              key={p}
              active={filters.maxPrice === p}
              onClick={() => apply({ ...filters, maxPrice: p })}
            >
              {formatYen(p)}以下
            </Chip>
          ))}
        </Group>

        <div className="space-y-3 border-t border-line pt-4">
          <Check
            checked={filters.saleOnly}
            onChange={(v) => apply({ ...filters, saleOnly: v })}
          >
            セール中の作品のみ
          </Check>
          {(showSampleFilter || filters.sampleOnly) && (
            <Check
              checked={filters.sampleOnly}
              onChange={(v) => apply({ ...filters, sampleOnly: v })}
            >
              試聴ボイスありのみ
            </Check>
          )}
        </div>

        <p
          className="border-t border-line pt-4 text-xs text-muted"
          aria-live="polite"
        >
          <span className="text-base font-black text-foreground">
            {resultCount}
          </span>{" "}
          件の作品が見つかりました
        </p>
      </div>
    </aside>
  );
}
