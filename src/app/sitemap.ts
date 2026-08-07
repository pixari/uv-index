import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://uvindex.pixari.dev";

// Real, indexable pages only — /privacy is intentionally left out (it's
// marked `robots: { index: false }` in its own metadata, legal boilerplate
// isn't worth ranking for) and everything else under [locale] is either an
// API route or a sheet reachable only from within the app, not a URL of
// its own.
const PATHS = ["", "/learn"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("daily" as const) : ("monthly" as const),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
