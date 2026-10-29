# sbravo

Sitio de [sbravo.app](https://sbravo.app): el catálogo de herramientas gratuitas que
construyo y mantengo yo. Cada app tiene su ficha con versión, plataformas, tamaño,
hash SHA-256, changelog por release y descarga directa.

Es un sitio estático, bilingüe (español en `/`, inglés en `/en/`) y sin analítica,
cookies ni scripts de terceros. El movimiento respeta `prefers-reduced-motion` y el
hero cae a un degradado estático cuando no hay WebGL.

## Capturas

| Portada | Catálogo |
|---|---|
| ![Portada con el titular, el orbe del hero y los accesos al catálogo y a GitHub Sponsors](docs/screenshots/home.webp) | ![Catálogo con el estado previo al primer release](docs/screenshots/catalog.webp) |

| Sobre el autor | Vista móvil |
|---|---|
| ![Sección con la explicación del proyecto y sus principios](docs/screenshots/about.webp) | ![Portada en un teléfono de 390 px](docs/screenshots/mobile.webp) |

## Stack

- **Framework:** Astro 7 con salida estática y ruteo i18n integrado
- **Estilos:** Tailwind CSS 4 con tokens de diseño en `src/styles/global.css`
- **3D y movimiento:** three.js 0.186 para la escena del hero, GSAP 3 y Lenis para el scroll
- **Lenguaje:** TypeScript en modo estricto
- **Tests:** Vitest sobre catálogo, i18n y feed RSS
- **Contenido:** catálogo tipado en `src/data/catalog.ts`, validado en cada build
