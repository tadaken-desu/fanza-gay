import Image from "next/image";
import type { Work } from "@/lib/types";

/** id から安定した数値を作る(プレースホルダーの色・波形用) */
function hashOf(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return h;
}

/**
 * ジャケット画像。サムネイルがある作品は実画像、ない作品のみ波形風の代替ビジュアル。
 * FANZA の画像は 560x420(4:3)なので、枠も 4:3 に揃える。
 */
export function WorkCover({
  work,
  sizes,
  preload = false,
  className = "",
}: {
  work: Work;
  sizes: string;
  /** 詳細ページのメイン画像など、LCP になる画像だけ true にする */
  preload?: boolean;
  className?: string;
}) {
  if (work.thumbnailUrl) {
    return (
      <div className={`relative aspect-[4/3] overflow-hidden bg-surface ${className}`}>
        <Image
          src={work.thumbnailUrl}
          alt={`${work.title} のジャケット画像`}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }
  return <WaveCover work={work} className={className} />;
}

function WaveCover({ work, className }: { work: Work; className: string }) {
  const h = hashOf(work.id);
  const hue = h % 360;
  const bars = Array.from({ length: 28 }, (_, i) =>
    Math.round(18 + Math.abs(Math.sin((i + 1) * ((h % 7) + 2) * 0.37)) * 62),
  );

  return (
    <div
      className={`relative flex aspect-[4/3] items-end justify-center gap-[3px] overflow-hidden px-4 pb-4 ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 24%), hsl(${(hue + 60) % 360} 55% 10%))`,
      }}
      role="img"
      aria-label={`${work.title} (画像なし)`}
    >
      <span
        className="absolute top-3 right-4 text-5xl font-black text-white/[0.06] select-none"
        aria-hidden="true"
      >
        {work.circle.name.charAt(0)}
      </span>
      {bars.map((height, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-white/25"
          style={{ height: `${height}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
