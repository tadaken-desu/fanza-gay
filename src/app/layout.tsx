import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import { Header } from "@/components/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ゲイ・BL向け同人音声のセール追跡データベース`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "ゲイ・BL向け同人音声・ASMRのセール追跡データベース。CV・サークル・シチュエーションタグで探せて、お気に入りの値下げ情報も毎日チェック。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        {children}
        <footer className="mt-16 border-t border-line px-4 py-8 text-center text-xs leading-relaxed text-muted">
          <p>
            当サイトはFANZAのアフィリエイトプログラムによる広告を利用しています。
          </p>
          <p>現在掲載中の作品情報・価格はすべてダミーデータです。</p>
        </footer>
      </body>
    </html>
  );
}
