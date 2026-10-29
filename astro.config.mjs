import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://sbravo.app",
  trailingSlash: "always",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "es", locales: { es: "es-CL", en: "en-US" } },
      filter: (page) => !page.includes("/404") && !page.includes("/admin/"),
    }),
  ],
  // passthrough evita depender de sharp (bun bloquea su postinstall)
  image: { service: { entrypoint: "astro/assets/services/noop" } },
  vite: { plugins: [tailwindcss()] },
});
