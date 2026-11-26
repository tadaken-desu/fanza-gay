"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  SORT_OPTIONS,
  filtersHref,
  type Filters,
  type SortKey,
} from "@/lib/filters";

/** 並び替えプルダウン。変更すると URL(?sort=)が変わり、1ページ目に戻る。 */
export function SortSelect({ filters }: { filters: Filters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="shrink-0 text-xs text-muted">並び替え</span>
      <select
        value={filters.sort}
        onChange={(e) =>
          startTransition(() => {
            router.push(
              filtersHref({ ...filters, sort: e.target.value as SortKey, page: 1 }),
              { scroll: false },
            );
          })
        }
        className={`rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground transition focus:border-accent focus:outline-none ${
          pending ? "opacity-60" : ""
        }`}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
