export const SITE_NAME = "BL-ASMR DB(仮)";

/** 本番ドメインは NEXT_PUBLIC_SITE_URL で上書きする(canonical / sitemap に使用) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
