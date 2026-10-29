import type { Localized } from "../i18n/ui";

export interface App {
  slug: string;
  title: string;
  /** SemVer, se permite prerelease: 1.2.0 o 1.2.0-beta.1 */
  version: string;
  description: Localized;
  author: string;
  /** Fecha ISO YYYY-MM-DD */
  uploaded: string;
  category: Localized;
  accent: string;
  downloadUrl: string;
  /** Imagen en public/thumbs, ej. "/thumbs/my-tool.webp"; sin ella se usa el arte generado */
  thumb?: string;
  platforms: string[];
  /** Tamaño legible del instalador, ej. "4.2 MB" */
  size: string;
  /** SHA-256 hex del archivo publicado; se omite hasta tener un build real */
  sha256?: string;
  virustotalUrl?: string;
  sourceUrl?: string;
}

export interface NewsItem {
  date: string;
  /** slug de la App a la que apunta */
  app: string;
  version: string;
  title: Localized;
  summary: Localized;
}

export interface Social {
  label: string;
  handle: string;
  url: string;
}

export interface Site {
  name: string;
  ticker: Localized;
  /** URL externa de donaciones (Ko-fi, PayPal, GitHub Sponsors); vacía oculta los CTA de apoyo */
  supportUrl: string;
  notice: Localized;
  updated: string;
  updateNote: Localized;
}
