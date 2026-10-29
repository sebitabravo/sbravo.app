// Contenido editable del sitio. Cada app nueva genera su card y su página /apps/<slug>.
import type { App, NewsItem, Social, Site } from "../lib/types";

export const site: Site = {
  name: "SBRAVO",
  tagline: "Free tools, crafted with care.",
  ticker: "Leave a comment · Support the project · New builds every month · Open source when possible",
  supportUrl: "#support",
  notice: "Some mirrors may be slow during peak hours. If a download fails, retry in a few minutes.",
  updated: "2026-10-28",
  updateNote:
    "New catalog design, faster downloads and changelogs per release. Thanks to everyone sending feedback.",
};

// Plantilla para agregar una app (los binarios conviene alojarlos en GitHub Releases, no en el repo):
// {
//   slug: "my-tool",
//   title: "My Tool",
//   version: "1.0.0",
//   description: "One sentence about what it does.",
//   author: "sbravo",
//   uploaded: "2026-11-01",
//   category: "Utility",
//   accent: "#7c5cff",
//   downloadUrl: "https://github.com/sebitabravo/my-tool/releases/download/v1.0.0/my-tool-setup.exe",
//   platforms: ["Windows 11"],
//   size: "5.0 MB",
//   sha256: "<sha256 del archivo publicado>",
//   virustotalUrl: "https://www.virustotal.com/gui/file/<sha256>",
//   sourceUrl: "https://github.com/sebitabravo/my-tool",
// },
export const apps: App[] = [];

// Cada noticia apunta a una app existente por slug y enlaza a su changelog (#v<version>).
export const news: NewsItem[] = [];

export const socials: Social[] = [
  { label: "YouTube", handle: "@your-channel", url: "#" },
  { label: "Community", handle: "Join the group", url: "#" },
];
