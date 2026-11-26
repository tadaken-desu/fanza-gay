import Link from "next/link";

export type LinkItem = { href: string; label: string; count?: number };
export type LinkGroup = { title: string; links: LinkItem[] };

/** 内部リンクの束(関連タグ・CV・サークルなど)。pSEO ページ同士の回遊用。 */
export function LinkGroups({ groups }: { groups: LinkGroup[] }) {
  return (
    <div className="space-y-6">
      {groups
        .filter((g) => g.links.length > 0)
        .map((g) => (
          <section key={g.title}>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted">
              {g.title}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-foreground/80 transition hover:border-accent/50 hover:text-accent"
                  >
                    {l.label}
                    {l.count !== undefined && (
                      <span className="text-xs text-muted">{l.count}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
