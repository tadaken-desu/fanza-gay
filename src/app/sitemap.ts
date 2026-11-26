import type { MetadataRoute } from "next";
import { ALL_TAGS } from "@/lib/tags";
import { SITE_URL } from "@/lib/site";
import {
  getAllWorks,
  getCirclesWithPage,
  getCvs,
  getWorksByTag,
} from "@/lib/works";

/** generateStaticParams と同じ条件のページだけを載せる(404/リダイレクトのURLを出さない) */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path}`;

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    ...getCvs().map((c) => ({
      url: url(`/cv/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...getCirclesWithPage().map((c) => ({
      url: url(`/circle/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...ALL_TAGS.filter((t) => getWorksByTag(t.slug).length > 0).map((t) => ({
      url: url(`/tag/${t.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...getAllWorks().map((w) => ({
      url: url(`/work/${w.id}`),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
