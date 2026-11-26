import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-black text-white">
            BL
          </span>
          <span className="font-black tracking-tight">
            BL-ASMR <span className="text-accent">DB</span>
            <span className="ml-1 text-xs font-normal text-muted">(仮)</span>
          </span>
        </Link>
        <p className="hidden text-xs text-muted sm:block">
          ゲイ・BL向け同人音声のセール追跡データベース
        </p>
      </div>
    </header>
  );
}
