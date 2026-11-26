"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * お気に入り CV(声優)・サークル(localStorage)。
 * 保存形式は "cv:<slug>" / "circle:<slug>" の文字列配列(キーは favorite-keys.ts)。
 * ログイン機能ができるまでの暫定実装で、保存先を API に差し替えるときは
 * このファイルだけ直せばよい。
 */

// 保存形式を変えたときに古いデータを読まないよう、キー名にバージョンを入れる。
const STORAGE_KEY = "bl-asmr-db:favorites:v1";

/** 初回訪問時は未登録(トップに「ハートで登録してください」の案内が出る) */
const DEFAULT_SNAPSHOT = "[]";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// snapshot は文字列のまま返す(参照が安定するので無限ループにならない)。
function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SNAPSHOT;
}

function getServerSnapshot(): string {
  return DEFAULT_SNAPSHOT;
}

function parse(snapshot: string): string[] {
  try {
    const v: unknown = JSON.parse(snapshot);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const favorites = useMemo(() => parse(snapshot), [snapshot]);

  const toggle = useCallback((key: string) => {
    const current = parse(getSnapshot());
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  }, []);

  return { favorites, toggle };
}
