"use client";

import { favoriteKey, type FavoriteKind } from "@/lib/favorite-keys";
import { useFavorites } from "@/lib/favorites";

const KIND_LABEL: Record<FavoriteKind, string> = {
  cv: "CV",
  circle: "サークル",
};

export function FavoriteButton({
  kind,
  slug,
  name,
}: {
  kind: FavoriteKind;
  slug: string;
  name: string;
}) {
  const { favorites, toggle } = useFavorites();
  const key = favoriteKey(kind, slug);
  const active = favorites.includes(key);
  const label = `${KIND_LABEL[kind]}「${name}」`;

  return (
    <button
      type="button"
      onClick={() => toggle(key)}
      aria-pressed={active}
      aria-label={
        active ? `${label}をお気に入りから外す` : `${label}をお気に入りに追加`
      }
      title={active ? "お気に入り解除" : "お気に入りに追加"}
      className={`grid size-6 shrink-0 place-items-center rounded-full border transition ${
        active
          ? "border-accent/60 bg-accent/15 text-accent"
          : "border-line text-muted hover:border-accent/50 hover:text-accent"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 21s-7.5-4.6-9.5-9.2C1.1 8.5 3 5 6.4 5c2 0 3.5 1.1 4.3 2.4h2.6C14.1 6.1 15.6 5 17.6 5 21 5 22.9 8.5 21.5 11.8 19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
