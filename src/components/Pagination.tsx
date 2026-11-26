import Link from "next/link";
import { filtersHref, type Filters } from "@/lib/filters";

/** ページ送り(リンク)。トップに全作品を一度に描画しないための仕組み。 */
export function Pagination({
  filters,
  totalPages,
}: {
  filters: Filters;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const { page } = filters;
  const href = (p: number) => filtersHref({ ...filters, page: p });

  // 現在ページの前後2ページ + 先頭・末尾
  const pages = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const base = "grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm";

  return (
    <nav aria-label="ページ送り" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} prefetch={false} rel="prev" className={`${base} border-line hover:border-accent/50`}>
          ‹ 前へ
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - (pages[i - 1] ?? p) > 1 && <span className="text-muted">…</span>}
          <Link
            href={href(p)}
            prefetch={false}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${
              p === page
                ? "border-accent bg-accent font-bold text-[#14101f]"
                : "border-line hover:border-accent/50"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} prefetch={false} rel="next" className={`${base} border-line hover:border-accent/50`}>
          次へ ›
        </Link>
      )}
    </nav>
  );
}
