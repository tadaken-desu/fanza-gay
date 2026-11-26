/**
 * お気に入りの保存キー。"cv:<slug>" / "circle:<slug>"。
 * サーバーコンポーネントからも呼べるよう、"use client" の favorites.ts とは分けている。
 */

export type FavoriteKind = "cv" | "circle";

export function favoriteKey(kind: FavoriteKind, slug: string): string {
  return `${kind}:${slug}`;
}
