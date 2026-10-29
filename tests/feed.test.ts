import { describe, expect, it } from "vitest";
import { buildRssFeed, escapeXml, rssDate, toFeedEntries } from "../src/lib/feed";
import type { NewsItem } from "../src/lib/types";

const item: NewsItem = {
  date: "2026-10-20",
  app: "demo",
  version: "1.2.0",
  title: { es: "Arregla <pegado> & formato", en: "Fixes <paste> & formatting" },
  summary: { es: "Resumen", en: "Summary" },
};

const origin = new URL("https://sbravo.app");

describe("escapeXml", () => {
  it("escapes the five XML entities", () => {
    expect(escapeXml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;");
  });

  it("leaves plain text untouched", () => {
    expect(escapeXml("sin caracteres especiales")).toBe("sin caracteres especiales");
  });
});

describe("rssDate", () => {
  it("returns an RFC 822 date without shifting the day", () => {
    expect(rssDate("2026-10-20")).toBe("Tue, 20 Oct 2026 12:00:00 GMT");
  });
});

describe("toFeedEntries", () => {
  it("builds an absolute link with the version anchor", () => {
    const [entry] = toFeedEntries([item], "es", origin);
    expect(entry.link).toBe("https://sbravo.app/apps/demo/#v1.2.0");
  });

  it("uses the requested locale for title and description", () => {
    const [entry] = toFeedEntries([item], "en", origin);
    expect(entry.title).toBe("Fixes <paste> & formatting");
    expect(entry.description).toBe("Summary");
  });

  it("returns no entries for an empty list", () => {
    expect(toFeedEntries([], "es", origin)).toEqual([]);
  });
});

describe("buildRssFeed", () => {
  const xml = buildRssFeed({
    title: "sbravo",
    description: "Herramientas",
    link: "https://sbravo.app/rss.xml",
    language: "es-CL",
    entries: toFeedEntries([item], "es", origin),
  });

  it("is a well-formed rss 2.0 document", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("escapes item content instead of emitting raw markup", () => {
    expect(xml).toContain("<title>Arregla &lt;pegado&gt; &amp; formato</title>");
    expect(xml).not.toContain("<pegado>");
  });

  it("declares the channel language and self link", () => {
    expect(xml).toContain("<language>es-CL</language>");
    expect(xml).toContain('href="https://sbravo.app/rss.xml" rel="self"');
  });

  it("renders a valid channel with no items", () => {
    const empty = buildRssFeed({
      title: "sbravo",
      description: "Herramientas",
      link: "https://sbravo.app/rss.xml",
      language: "es-CL",
      entries: [],
    });
    expect(empty).toContain("<channel>");
    expect(empty).not.toContain("<item>");
  });
});
