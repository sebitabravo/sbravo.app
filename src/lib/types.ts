export interface App {
  slug: string;
  title: string;
  version: string;
  description: string;
  author: string;
  /** Fecha ISO YYYY-MM-DD */
  uploaded: string;
  category: string;
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
  title: string;
  summary: string;
}

export interface Social {
  label: string;
  handle: string;
  url: string;
}

export interface Site {
  name: string;
  tagline: string;
  ticker: string;
  supportUrl: string;
  notice: string;
  updated: string;
  updateNote: string;
}
