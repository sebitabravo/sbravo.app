import { describe, expect, it } from "vitest";
import { isLocale, localePath, stripLocale, toLocale, useTranslations } from "../src/i18n/ui";

describe("localePath", () => {
  it("keeps Spanish at the root", () => {
    expect(localePath("es")).toBe("/");
    expect(localePath("es", "/apps/demo/")).toBe("/apps/demo/");
  });

  it("prefixes English with /en", () => {
    expect(localePath("en")).toBe("/en/");
    expect(localePath("en", "apps/demo/")).toBe("/en/apps/demo/");
  });
});

describe("localized slugs", () => {
  it("translates the privacy page slug per locale", () => {
    expect(localePath("es", "/privacidad/")).toBe("/privacidad/");
    expect(localePath("en", "/privacidad/")).toBe("/en/privacy/");
  });

  it("maps the English slug back to the canonical path", () => {
    expect(stripLocale("/en/privacy/")).toBe("/privacidad/");
  });
});

describe("stripLocale", () => {
  it("removes the English prefix", () => {
    expect(stripLocale("/en/apps/demo/")).toBe("/apps/demo/");
    expect(stripLocale("/en/")).toBe("/");
  });

  it("leaves Spanish and unknown prefixes untouched", () => {
    expect(stripLocale("/apps/demo/")).toBe("/apps/demo/");
    expect(stripLocale("/fr/x")).toBe("/fr/x");
  });
});

describe("toLocale / isLocale", () => {
  it("falls back to Spanish for missing or unknown values", () => {
    expect(toLocale(undefined)).toBe("es");
    expect(toLocale("de")).toBe("es");
    expect(toLocale("en")).toBe("en");
  });

  it("narrows only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale(42)).toBe(false);
  });
});

describe("useTranslations", () => {
  it("returns the string for each locale", () => {
    expect(useTranslations("es")("nav.catalog")).toBe("Catálogo");
    expect(useTranslations("en")("nav.catalog")).toBe("Catalog");
  });
});
