// Contenido editable del sitio. Cada app nueva genera su card y su página /apps/<slug>.
import type { App, NewsItem, Social, Site } from "../lib/types";

export const site: Site = {
  name: "sbravo",
  ticker: {
    es: "Herramientas gratis · Changelogs honestos · Descargas directas · En español e inglés",
    en: "Free tools · Honest changelogs · Direct downloads · In Spanish and English",
  },
  supportUrl: "https://github.com/sponsors/sebitabravo",
  notice: {
    es: "Si una descarga falla, vuelve a intentarlo en unos minutos.",
    en: "If a download fails, try again in a few minutes.",
  },
  updated: "2026-10-29",
  updateNote: {
    es: "Nuevo sitio: catálogo con changelog por versión, tamaño y plataformas de cada descarga.",
    en: "New site: a catalog with per-release changelogs, file size and platforms for every download.",
  },
};

// Plantilla para agregar una app (los binarios conviene alojarlos en GitHub Releases, no en el repo):
// {
//   slug: "my-tool",
//   title: "My Tool",
//   version: "1.0.0",
//   description: { es: "Una frase sobre lo que hace.", en: "One sentence about what it does." },
//   author: "sbravo",
//   uploaded: "2026-11-01",
//   category: { es: "Utilidad", en: "Utility" },
//   accent: "#7c5cff",
//   downloadUrl: "https://github.com/sebitabravo/my-tool/releases/download/v1.0.0/my-tool-setup.exe",
//   thumb: "/thumbs/my-tool.webp",
//   platforms: ["Windows 11"],
//   size: "5.0 MB",
//   sha256: "<sha256 del archivo publicado>",
//   virustotalUrl: "https://www.virustotal.com/gui/file/<sha256>",
//   sourceUrl: "https://github.com/sebitabravo/my-tool",
// },
export const apps: App[] = [];

// Cada noticia apunta a una app existente por slug y enlaza a su changelog (#v<version>).
// { date: "2026-11-01", app: "my-tool", version: "1.0.0", title: { es: "...", en: "..." }, summary: { es: "...", en: "..." } }
export const news: NewsItem[] = [];

// Agrega tus redes reales; la sección se oculta mientras esté vacía.
// { label: "YouTube", handle: "@tu-canal", url: "https://youtube.com/@tu-canal" }
export const socials: Social[] = [
  { label: "GitHub", handle: "sebitabravo", url: "https://github.com/sebitabravo" },
  { label: "YouTube", handle: "@sebitabravo", url: "https://www.youtube.com/@sebitabravo" },
  { label: "X", handle: "@sebitabrav0", url: "https://x.com/sebitabrav0" },
];
