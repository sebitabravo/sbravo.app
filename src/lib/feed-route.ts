import type { APIRoute } from "astro";
import { news, site } from "../data/catalog";
import { sortByDateDesc } from "./catalog";
import { buildRssFeed, toFeedEntries } from "./feed";
import { dateLocale, localePath, useTranslations, type Locale } from "../i18n/ui";

export function feedRoute(locale: Locale): APIRoute {
  return ({ site: base }) => {
    const origin = base ?? new URL("https://sbravo.app");
    const xml = buildRssFeed({
      title: site.name,
      description: useTranslations(locale)("meta.description"),
      link: new URL(localePath(locale), origin).href,
      feedUrl: new URL(localePath(locale, "/rss.xml"), origin).href,
      language: dateLocale[locale],
      entries: toFeedEntries(
        sortByDateDesc(news, (item) => item.date),
        locale,
        origin,
      ),
    });
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
  };
}
