# sbravo

Source of [sbravo.app](https://sbravo.app), a small catalog of free tools built and maintained by
[@sebitabravo](https://github.com/sebitabravo). Every tool gets its own page with a per-version changelog,
platforms, file size and checksum, and a direct download.

The site is static, bilingual (Spanish at `/`, English at `/en/`) and ships no analytics or cookies.

## Stack

- [Astro](https://astro.build) 7, static output with built-in i18n routing
- [Tailwind CSS](https://tailwindcss.com) 4 with design tokens in `src/styles/global.css`
- [three.js](https://threejs.org) for the hero scene, loaded as a separate chunk
- [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering) for scroll motion
- [Vitest](https://vitest.dev) for the data, i18n and feed helpers
- [Bun](https://bun.sh) as package manager and script runner

Motion respects `prefers-reduced-motion`, and the hero falls back to a static gradient without WebGL.

## Development

```sh
bun install --frozen-lockfile
bun run dev       # http://localhost:4321
bun run test      # unit tests
bun run check     # astro + TypeScript diagnostics
bun run build     # static site in dist/
```

## Adding a tool

All content lives in `src/data/catalog.ts`. Each app has its text in both languages:

```ts
{
  slug: "my-tool",
  title: "My Tool",
  version: "1.0.0",
  description: { es: "Qué hace.", en: "What it does." },
  author: "sbravo",
  uploaded: "2026-11-01",
  category: { es: "Utilidad", en: "Utility" },
  accent: "#c8b487",
  downloadUrl: "https://github.com/sebitabravo/my-tool/releases/download/v1.0.0/my-tool-setup.exe",
  thumb: "/thumbs/my-tool.webp",
  platforms: ["Windows 11"],
  size: "5.0 MB",
  sha256: "<sha256 of the published file>",
  virustotalUrl: "https://www.virustotal.com/gui/file/<sha256>",
  sourceUrl: "https://github.com/sebitabravo/my-tool",
}
```

- Binaries belong in GitHub Releases, not in this repository.
- Thumbnails go in `public/thumbs/`.
- A news entry with the same `slug` shows up in the changelog, the home timeline and the RSS feeds.

The build validates the catalog (slugs, SemVer, dates, translations, hashes) and fails on bad data.

## Project layout

```text
src/
  components/   header, hero, intro, logo and page sections
  data/         catalog content
  i18n/         typed dictionaries and locale helpers
  lib/          catalog validation, RSS feed
  pages/        routes for both locales, feeds and 404
  scenes/       three.js hero scene
  scripts/      scroll motion
  views/        page templates shared by both locales
docs/og/        HTML sources used to render the Open Graph images
tests/          unit tests
```

## Support

If these tools are useful to you, you can support their maintenance through
[GitHub Sponsors](https://github.com/sponsors/sebitabravo).
