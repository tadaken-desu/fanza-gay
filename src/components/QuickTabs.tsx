import Link from "next/link";
import { QUICK_TABS, filtersHref, type Filters } from "@/lib/filters";

/**
 * ワンタップの絞り込みタブ。単なるリンクなので JS なしでも動き、クローラーにも辿れる。
 * サイドバーの条件とは AND で効き、切り替えると1ページ目に戻る。
 */
export function QuickTabs({ filters }: { filters: Filters }) {
  return (
    <nav aria-label="クイックフィルタ">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {QUICK_TABS.map((t) => {
          const active = filters.quick === t.key;
          return (
            <li key={t.key} className="shrink-0">
              <Link
                href={filtersHref({ ...filters, quick: t.key, page: 1 })}
                prefetch={false}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`block rounded-full border px-4 py-2 text-sm whitespace-nowrap transition ${
                  active
                    ? "border-accent bg-accent font-bold text-[#14101f]"
                    : "border-line bg-surface text-foreground/80 hover:border-accent/50"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
