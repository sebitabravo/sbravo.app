import type { APIRoute } from "astro";
import { news, site } from "../data/catalog";
import { sortByDateDesc } from "../lib/catalog";
import { buildRssFeed, toFeedEntries } from "../lib/feed";
import { useTranslations } from "../i18n/ui";

export const GET: APIRoute = ({ site: base }) => {
  const origin = base ?? new URL("https://sbravo.app");
  const entries = toFeedEntries(
    sortByDateDesc(news, (item) => item.date),
    "es",
    origin,
  );
  const xml = buildRssFeed({
    title: site.name,
    description: useTranslations("es")("meta.description"),
    link: new URL("/rss.xml", origin).href,
    language: "es-CL",
    entries,
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
