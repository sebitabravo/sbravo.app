export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

/** Texto traducible guardado junto a los datos */
export type Localized<T = string> = Record<Locale, T>;

const es = {
  "meta.description":
    "Herramientas gratis para el día a día: apps chicas y rápidas, changelogs honestos y descargas directas desde el sitio del autor.",
  "skip": "Saltar al contenido",
  "nav.catalog": "Catálogo",
  "nav.updates": "Novedades",
  "nav.support": "Apoyar",
  "nav.primary": "Principal",
  "nav.language": "Idioma",
  "intro.loading": "Cargando",
  "hero.eyebrow": "Hub de software gratis",
  "hero.tools.one": "herramienta",
  "hero.tools.other": "herramientas",
  "hero.title.1": "Herramientas",
  "hero.title.2": "que se sienten",
  "hero.title.3": "como magia.",
  "hero.lead": "Apps livianas, changelogs honestos y cero relleno.",
  "hero.browse": "Ver catálogo",
  "hero.support": "Apoyar el proyecto",
  "hero.updated": "Actualizado",
  "hero.scroll": "Scroll",
  "ticker.label": "Novedades del sitio",
  "ticker.pause": "Pausar texto en movimiento",
  "ticker.play": "Reanudar texto en movimiento",
  "notice.label": "Aviso de descargas",
  "notice.title": "Ojo",
  "catalog.eyebrow": "Herramientas chicas, útiles a diario",
  "catalog.title.1": "El",
  "catalog.title.2": "catálogo.",
  "catalog.lead": "Cada app hace una cosa y la hace bien.",
  "catalog.empty": "Las primeras herramientas vienen en camino.",
  "card.by": "Por",
  "card.explore": "Explorar",
  "update.eyebrow": "Nota del autor",
  "update.title.1": "Lo último",
  "update.title.2": "del taller.",
  "update.support.eyebrow": "Independiente",
  "update.support.title": "Gratis gracias a ti.",
  "update.support.body": "Tu aporte paga el hosting, la firma de código y el tiempo para mantener cada app.",
  "socials.eyebrow": "Sigue el proyecto",
  "socials.title.1": "Encuentra a tu",
  "socials.title.2": "gente.",
  "news.eyebrow": "Recién salido del taller",
  "news.title.1": "Últimas",
  "news.title.2": "novedades.",
  "news.lead": "Lanzamientos, arreglos y detalles que vale la pena saber.",
  "news.version": "Versión",
  "footer.top": "Volver arriba",
  "footer.home": "Inicio de sbravo",
  "detail.back": "Volver al catálogo",
  "detail.by": "por",
  "detail.uploaded": "subida el",
  "detail.download": "Descargar",
  "detail.platforms": "Plataformas",
  "detail.size": "Tamaño",
  "detail.version": "Versión",
  "detail.virustotal": "Análisis en VirusTotal",
  "detail.source": "Código fuente",
  "detail.changelog": "Changelog",
} as const;

// el inglés debe cubrir exactamente las mismas claves: si falta una, TypeScript falla el build
type Dict = { readonly [K in keyof typeof es]: string };

const en: Dict = {
  "meta.description":
    "Free tools for everyday work: small, fast apps with honest changelogs and direct downloads from the author's own site.",
  "skip": "Skip to content",
  "nav.catalog": "Catalog",
  "nav.updates": "Updates",
  "nav.support": "Support",
  "nav.primary": "Primary",
  "nav.language": "Language",
  "intro.loading": "Loading",
  "hero.eyebrow": "Free software hub",
  "hero.tools.one": "tool",
  "hero.tools.other": "tools",
  "hero.title.1": "Tools that",
  "hero.title.2": "feel like",
  "hero.title.3": "magic.",
  "hero.lead": "Lightweight apps, honest changelogs, zero bloat.",
  "hero.browse": "Browse catalog",
  "hero.support": "Support the project",
  "hero.updated": "Updated",
  "hero.scroll": "Scroll",
  "ticker.label": "Site updates",
  "ticker.pause": "Pause moving text",
  "ticker.play": "Resume moving text",
  "notice.label": "Download notice",
  "notice.title": "Heads up",
  "catalog.eyebrow": "Small tools, useful every day",
  "catalog.title.1": "The",
  "catalog.title.2": "catalog.",
  "catalog.lead": "Each app does one thing and does it well.",
  "catalog.empty": "The first tools are on the way.",
  "card.by": "By",
  "card.explore": "Explore",
  "update.eyebrow": "A note from the maker",
  "update.title.1": "Latest from",
  "update.title.2": "the workshop.",
  "update.support.eyebrow": "Independent",
  "update.support.title": "Free because of you.",
  "update.support.body": "Your support pays for hosting, code signing and the time to keep every app maintained.",
  "socials.eyebrow": "Follow the project",
  "socials.title.1": "Find your",
  "socials.title.2": "people.",
  "news.eyebrow": "Fresh from the workshop",
  "news.title.1": "Latest",
  "news.title.2": "updates.",
  "news.lead": "Releases, fixes and details worth knowing.",
  "news.version": "Version",
  "footer.top": "Back to top",
  "footer.home": "sbravo home",
  "detail.back": "Back to catalog",
  "detail.by": "by",
  "detail.uploaded": "uploaded",
  "detail.download": "Download",
  "detail.platforms": "Platforms",
  "detail.size": "File size",
  "detail.version": "Version",
  "detail.virustotal": "VirusTotal scan",
  "detail.source": "Source code",
  "detail.changelog": "Changelog",
};

export type UiKey = keyof typeof es;

const dictionaries: Record<Locale, Dict> = { es, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function useTranslations(locale: Locale) {
  return (key: UiKey): string => dictionaries[locale][key];
}

/** Ruta pública para un locale: el español vive en la raíz, el resto bajo /<locale>/ */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean === "/" ? "/" : clean}`;
}

/** Quita el prefijo de locale para encontrar la misma página en otro idioma */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  return isLocale(first) && first !== defaultLocale ? `/${rest.join("/")}` : pathname;
}

export const dateLocale: Record<Locale, string> = { es: "es-CL", en: "en-US" };
