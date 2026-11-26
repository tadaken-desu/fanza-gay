"use client";

import type { ReactNode } from "react";
import { useFavorites } from "@/lib/favorites";

export type DealItem = {
  id: string;
  /** この作品に紐づくお気に入りキー(CV・サークル。favorite-keys.ts の形式) */
  keys: string[];
  /** サーバーで描画済みのカード */
  card: ReactNode;
};

/**
 * お気に入り CV・サークルの「今日値下げされた作品」。
 * お気に入りはブラウザ側(localStorage)にあるため、サーバーから
 * 「今日値下げされた全作品のカード」を受け取り、ここで出し分ける。
 * (カードをサーバーで描画することで、作品データ全体をクライアントに送らない)
 */
export function FavoriteDeals({ items }: { items: DealItem[] }) {
  const { favorites } = useFavorites();
  const deals = items.filter((it) => it.keys.some((k) => favorites.includes(k)));

  return (
    <section aria-labelledby="fav-deals-heading" className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            Today&apos;s Price Drop
          </p>
          <h2 id="fav-deals-heading" className="text-xl font-black">
            お気に入りCV・サークルの本日値下げ作品
          </h2>
        </div>
        <span className="text-xs text-muted">
          お気に入り {favorites.length}件 / 該当 {deals.length}作品
        </span>
      </div>

      {deals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((d) => (
            <div key={d.id} className="contents">
              {d.card}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-10 text-center text-sm text-muted">
          {favorites.length === 0
            ? "作品カードのハートでCVやサークルをお気に入り登録すると、本日の値下げ情報がここに表示されます。"
            : "お気に入りのCV・サークルの作品で、本日値下げされたものはまだありません。"}
        </div>
      )}
    </section>
  );
}
