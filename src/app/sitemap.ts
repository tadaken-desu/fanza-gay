import type { MetadataRoute } from "next";
import { ALL_TAGS } from "@/lib/tags";
import { SITE_URL } from "@/lib/site";
import { getCircles, getCvs, getWorksByTag } from "@/lib/works";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path}`;

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    ...getCvs().map((c) => ({
      url: url(`/cv/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...getCircles().map((c) => ({
      url: url(`/circle/${c.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...ALL_TAGS.filter((t) => getWorksByTag(t.slug).length > 0).map((t) => ({
      url: url(`/tag/${t.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
