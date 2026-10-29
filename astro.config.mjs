import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://sbravo.app",
  // passthrough evita depender de sharp (bun bloquea su postinstall)
  image: { service: { entrypoint: "astro/assets/services/noop" } },
  vite: { plugins: [tailwindcss()] },
});
