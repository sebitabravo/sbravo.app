import { locales, type Localized } from "../i18n/ui";
import type { App, NewsItem } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sortByDateDesc<T>(items: T[], getDate: (item: T) => string): T[] {
  return [...items].sort((a, b) => getDate(b).localeCompare(getDate(a)));
}

export function formatDate(iso: string, locale = "en-US"): string {
  if (!ISO_DATE.test(iso)) throw new Error(`Invalid ISO date: ${iso}`);
  // mediodía UTC evita que la zona horaria corra el día
  const date = new Date(`${iso}T12:00:00Z`);
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" });
}

export function versionAnchor(version: string): string {
  return `v${version}`;
}

export function findApp(apps: App[], slug: string): App | undefined {
  return apps.find((app) => app.slug === slug);
}

function missingLocales(value: Localized): string[] {
  return locales.filter((locale) => value[locale].trim() === "");
}

export function validateCatalog(apps: App[], news: NewsItem[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const app of apps) {
    if (!SLUG.test(app.slug)) errors.push(`Invalid slug: ${app.slug}`);
    if (seen.has(app.slug)) errors.push(`Duplicate slug: ${app.slug}`);
    seen.add(app.slug);
    if (!SEMVER.test(app.version)) errors.push(`Invalid version for ${app.slug}: ${app.version}`);
    if (!ISO_DATE.test(app.uploaded)) errors.push(`Invalid date for ${app.slug}: ${app.uploaded}`);
    for (const locale of missingLocales(app.description)) errors.push(`Missing ${locale} description for ${app.slug}`);
    if (app.platforms.length === 0) errors.push(`Missing platforms for ${app.slug}`);
    if (app.thumb !== undefined && !app.thumb.startsWith("/thumbs/")) errors.push(`Invalid thumb for ${app.slug}`);
    if (app.sha256 !== undefined && !SHA256.test(app.sha256)) errors.push(`Invalid sha256 for ${app.slug}`);
  }

  for (const item of news) {
    if (!ISO_DATE.test(item.date)) errors.push(`Invalid news date: ${item.date}`);
    if (!seen.has(item.app)) errors.push(`News points to unknown app: ${item.app}`);
    for (const locale of missingLocales(item.title)) errors.push(`Missing ${locale} news title for ${item.app}`);
  }

  return errors;
}
