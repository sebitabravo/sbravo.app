import "lenis/dist/lenis.css";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const body = document.body;

let lenis: Lenis | undefined;
let tickerAnimations: gsap.core.Tween[] = [];
let lenisTicker: ((time: number) => void) | undefined;
let started = false;

function revealStaticContent(): void {
  gsap.killTweensOf("[data-reveal], [data-split] > span, [data-parallax]");
  gsap.set("[data-reveal], [data-split] > span, [data-parallax]", {
    clearProps: "transform,opacity,visibility",
  });
  tickerAnimations.forEach((animation) => animation.kill());
  tickerAnimations = [];
  if (lenisTicker) gsap.ticker.remove(lenisTicker);
  lenisTicker = undefined;
  lenis?.destroy();
  lenis = undefined;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

function applyScrollMotion(): void {
  if (started || reducedMotion.matches) return;
  started = true;
  gsap.registerPlugin(ScrollTrigger);

  lenis = new Lenis({ autoRaf: false, smoothWheel: true, lerp: 0.1 });
  lenis.stop();
  lenis.on("scroll", (event) => {
    ScrollTrigger.update();
    const velocity = event.velocity;
    const strength = Math.min(Math.abs(velocity) / 160, 1.6);
    const skew = Math.max(-3.5, Math.min(3.5, velocity / 45));

    tickerAnimations.forEach((animation) => animation.timeScale(1 + strength));
    gsap.to("[data-ticker-row]", { skewX: skew, duration: 0.35, overwrite: true });
  });
  lenisTicker = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(lenisTicker);
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    gsap.fromTo(
      element,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: element, start: "top 91%", once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>("[data-split]").forEach((heading) => {
    const words = heading.querySelectorAll<HTMLElement>(":scope > span");
    if (words.length === 0) return;
    gsap.fromTo(
      words,
      { yPercent: 115, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.7,
        stagger: 0.045,
        ease: "power3.out",
        scrollTrigger: { trigger: heading, start: "top 92%", once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
    gsap.to(element, {
      yPercent: -12,
      ease: "none",
      scrollTrigger: {
        trigger: element.closest("section") ?? element,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  });

  document.querySelectorAll<HTMLElement>("[data-ticker-track]").forEach((track) => {
    const reverse = track.closest(".ticker__row")?.classList.contains("ticker__row--reverse") ?? false;
    tickerAnimations.push(
      gsap.fromTo(
        track,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration: reverse ? 34 : 28, ease: "none", repeat: -1 },
      ),
    );
  });

  if (finePointer.matches) {
    document.querySelectorAll<HTMLElement>("[data-app-card]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        const rotateX = ((y / bounds.height) - 0.5) * -7;
        const rotateY = ((x / bounds.width) - 0.5) * 7;

        card.style.setProperty("--pointer-x", `${x}px`);
        card.style.setProperty("--pointer-y", `${y}px`);
        gsap.to(card, {
          rotateX,
          rotateY,
          y: -5,
          duration: 0.35,
          ease: "power2.out",
          overwrite: true,
          transformPerspective: 900,
        });
      });
      card.addEventListener("pointerleave", () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true,
        });
      });
    });

    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((link) => {
      link.addEventListener("pointermove", (event) => {
        const bounds = link.getBoundingClientRect();
        const x = event.clientX - bounds.left - bounds.width / 2;
        const y = event.clientY - bounds.top - bounds.height / 2;
        gsap.to(link, { x: x * 0.08, y: y * 0.12, duration: 0.35, ease: "power2.out" });
      });
      link.addEventListener("pointerleave", () => {
        gsap.to(link, { x: 0, y: 0, duration: 0.45, ease: "power2.out" });
      });
    });
  }

  const start = () => {
    if (!body.classList.contains("is-loading")) lenis?.start();
  };

  window.addEventListener("intro:done", start, { once: true });
  if (!document.querySelector("[data-intro]") && !body.classList.contains("is-loading")) start();
}

if (reducedMotion.matches) {
  revealStaticContent();
} else {
  applyScrollMotion();
}

reducedMotion.addEventListener("change", (event) => {
  if (event.matches) revealStaticContent();
  else {
    started = false;
    applyScrollMotion();
  }
});
