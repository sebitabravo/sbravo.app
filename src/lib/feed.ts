import type { NewsItem } from "./types";
import type { Locale } from "../i18n/ui";
import { localePath } from "../i18n/ui";

export interface FeedEntry {
  title: string;
  description: string;
  link: string;
  /** fecha ISO YYYY-MM-DD */
  date: string;
}

const ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => ESCAPES[character]);
}

/** RFC 822 es el formato que exige RSS 2.0 para pubDate */
export function rssDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toUTCString();
}

export function toFeedEntries(news: NewsItem[], locale: Locale, origin: URL): FeedEntry[] {
  return news.map((item) => {
    const path = localePath(locale, `/apps/${item.app}/`);
    return {
      title: item.title[locale],
      description: item.summary[locale],
      link: new URL(`${path}#v${item.version}`, origin).href,
      date: item.date,
    };
  });
}

export function buildRssFeed(options: {
  title: string;
  description: string;
  /** página del sitio que describe el canal */
  link: string;
  /** URL del propio feed, para atom:link rel="self" */
  feedUrl: string;
  language: string;
  entries: FeedEntry[];
}): string {
  const { title, description, link, feedUrl, language, entries } = options;
  const items = entries.map((entry) =>
    [
      "    <item>",
      `      <title>${escapeXml(entry.title)}</title>`,
      `      <description>${escapeXml(entry.description)}</description>`,
      `      <link>${escapeXml(entry.link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(entry.link)}</guid>`,
      `      <pubDate>${rssDate(entry.date)}</pubDate>`,
      "    </item>",
    ].join("\n"),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(title)}</title>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <link>${escapeXml(link)}</link>`,
    `    <language>${escapeXml(language)}</language>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
