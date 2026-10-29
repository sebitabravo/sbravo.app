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
  "nav.about": "Sobre",
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
  "notice.dismiss": "Cerrar aviso",
  "catalog.eyebrow": "Herramientas chicas, útiles a diario",
  "catalog.title.1": "El",
  "catalog.title.2": "catálogo.",
  "catalog.lead": "Cada app hace una cosa y la hace bien.",
  "catalog.empty.eyebrow": "Antes del primer release",
  "catalog.empty.title.1": "Cada ficha,",
  "catalog.empty.title.2": "por dentro.",
  "catalog.empty.lead": "Cuando salga la primera herramienta va a venir con esto, sin letra chica:",
  "catalog.empty.item1.title": "Changelog por versión",
  "catalog.empty.item1.body": "Cada cambio fechado y con su número de versión.",
  "catalog.empty.item2.title": "Ficha técnica",
  "catalog.empty.item2.body": "Tamaño, plataformas y hash SHA-256 antes de descargar.",
  "catalog.empty.item3.title": "Descarga directa",
  "catalog.empty.item3.body": "Desde acá o desde GitHub Releases. Sin intermediarios.",
  "catalog.empty.cta": "Ver el código en GitHub",
  "card.explore": "Explorar",
  "card.download": "Descargar",
  "update.eyebrow": "Nota del autor",
  "update.title.1": "Lo último",
  "update.title.2": "del taller.",
  "update.support.eyebrow": "Independiente",
  "update.support.title": "Gratis gracias a ti.",
  "update.support.body": "Tu aporte paga el hosting, la firma de código y el tiempo para mantener cada app.",
  "about.eyebrow": "Quién está detrás",
  "about.title.1": "Un taller",
  "about.title.2": "de una persona.",
  "about.body.1":
    "sbravo es un proyecto independiente. Cada herramienta la diseño, la programo y la mantengo yo, sin equipo y sin intermediarios.",
  "about.body.2":
    "Si algo no funciona, lo arreglo y queda escrito en el changelog. Si una app deja de tener sentido, la retiro y también lo digo.",
  "about.cta": "Ver el código en GitHub",
  "about.fact1.title": "Independiente",
  "about.fact1.body": "Sin anuncios ni cuentas.",
  "about.fact2.title": "Directo",
  "about.fact2.body": "El binario sale de acá o de GitHub Releases.",
  "about.fact3.title": "En público",
  "about.fact3.body": "Cada versión con su changelog, incluso las que arreglan algo mío.",
  "socials.eyebrow": "Sigue el proyecto",
  "socials.title.1": "Dónde",
  "socials.title.2": "publico.",
  "news.eyebrow": "Recién salido del taller",
  "news.title.1": "Últimas",
  "news.title.2": "novedades.",
  "news.lead": "Lanzamientos, arreglos y detalles que vale la pena saber.",
  "news.version": "Versión",
  "footer.top": "Volver arriba",
  "footer.home": "Inicio de sbravo",
  "footer.tagline": "Apps livianas, changelogs honestos y cero relleno.",
  "footer.sections": "Secciones",
  "footer.elsewhere": "En otros lados",
  "footer.nav": "Secciones del sitio",
  "footer.profiles": "Perfiles y apoyo",
  "footer.privacy": "Privacidad",
  "detail.setup": "Antes de instalar",
  "detail.requirements": "Requisitos",
  "detail.install": "Instalación",
  "comments.eyebrow": "Comunidad",
  "comments.title": "Comentarios",
  "comments.lead": "Reporta un bug, cuenta cómo te fue o pregunta. Se comenta con tu cuenta de GitHub.",
  "comments.noscript": "Los comentarios necesitan JavaScript. También puedes verlos en GitHub Discussions.",
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
  "nav.about": "About",
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
  "notice.dismiss": "Dismiss notice",
  "catalog.eyebrow": "Small tools, useful every day",
  "catalog.title.1": "The",
  "catalog.title.2": "catalog.",
  "catalog.lead": "Each app does one thing and does it well.",
  "catalog.empty.eyebrow": "Before the first release",
  "catalog.empty.title.1": "Every listing,",
  "catalog.empty.title.2": "up close.",
  "catalog.empty.lead": "When the first tool ships it comes with all of this, no fine print:",
  "catalog.empty.item1.title": "Per-version changelog",
  "catalog.empty.item1.body": "Every change dated and tied to a version number.",
  "catalog.empty.item2.title": "Full spec sheet",
  "catalog.empty.item2.body": "Size, platforms and SHA-256 hash before you download.",
  "catalog.empty.item3.title": "Direct download",
  "catalog.empty.item3.body": "From here or from GitHub Releases. No middlemen.",
  "catalog.empty.cta": "See the code on GitHub",
  "card.explore": "Explore",
  "card.download": "Download",
  "update.eyebrow": "A note from the maker",
  "update.title.1": "Latest from",
  "update.title.2": "the workshop.",
  "update.support.eyebrow": "Independent",
  "update.support.title": "Free because of you.",
  "update.support.body": "Your support pays for hosting, code signing and the time to keep every app maintained.",
  "about.eyebrow": "Behind this",
  "about.title.1": "A workshop",
  "about.title.2": "of one.",
  "about.body.1":
    "sbravo is an independent project. Every tool is designed, built and maintained by me, with no team and no middlemen.",
  "about.body.2":
    "If something breaks, I fix it and write it down in the changelog. If an app stops making sense, I retire it and say so too.",
  "about.cta": "See the code on GitHub",
  "about.fact1.title": "Independent",
  "about.fact1.body": "No ads, no accounts.",
  "about.fact2.title": "Direct",
  "about.fact2.body": "The binary comes from here or from GitHub Releases.",
  "about.fact3.title": "In public",
  "about.fact3.body": "Every release gets a changelog, even the ones fixing my own mistakes.",
  "socials.eyebrow": "Follow the project",
  "socials.title.1": "Where I",
  "socials.title.2": "post.",
  "news.eyebrow": "Fresh from the workshop",
  "news.title.1": "Latest",
  "news.title.2": "updates.",
  "news.lead": "Releases, fixes and details worth knowing.",
  "news.version": "Version",
  "footer.top": "Back to top",
  "footer.home": "sbravo home",
  "footer.tagline": "Lightweight apps, honest changelogs, zero bloat.",
  "footer.sections": "Sections",
  "footer.elsewhere": "Elsewhere",
  "footer.nav": "Site sections",
  "footer.profiles": "Profiles and support",
  "footer.privacy": "Privacy",
  "detail.setup": "Before installing",
  "detail.requirements": "Requirements",
  "detail.install": "Installation",
  "comments.eyebrow": "Community",
  "comments.title": "Comments",
  "comments.lead": "Report a bug, share how it went or ask a question. You comment with your GitHub account.",
  "comments.noscript": "Comments need JavaScript. You can also read them on GitHub Discussions.",
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

// rutas con slug propio por idioma; la clave es la ruta canónica (la española)
const localizedSlugs: Record<string, Partial<Record<Locale, string>>> = {
  "/privacidad/": { en: "/privacy/" },
};

/** Ruta pública para un locale: el español vive en la raíz, el resto bajo /<locale>/ */
export function localePath(locale: Locale, path = "/"): string {
  const canonical = path.startsWith("/") ? path : `/${path}`;
  const clean = localizedSlugs[canonical]?.[locale] ?? canonical;
  return locale === defaultLocale ? clean : `/${locale}${clean === "/" ? "/" : clean}`;
}

/** Quita el prefijo de locale y devuelve la ruta canónica, para encontrar la misma página en otro idioma */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first) || first === defaultLocale) return pathname;
  const path = `/${rest.join("/")}`;
  const canonical = Object.entries(localizedSlugs).find(([, slugs]) => slugs[first] === path)?.[0];
  return canonical ?? path;
}

export const dateLocale: Record<Locale, string> = { es: "es-CL", en: "en-US" };
