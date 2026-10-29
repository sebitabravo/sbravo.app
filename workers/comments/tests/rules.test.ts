import { describe, expect, it } from "vitest";
import { corsHeaders, normalizeBody, normalizeName, parseThread, safeEqual, sqliteToIso, validateComment } from "../src/rules";

describe("normalizeName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeName("  Ana   María ")).toBe("Ana María");
  });

  it("returns an empty string for missing names", () => {
    expect(normalizeName(undefined)).toBe("");
  });

  it("strips control characters", () => {
    expect(normalizeName("Ana\u0000\u0007")).toBe("Ana");
  });
});

describe("normalizeBody", () => {
  it("keeps line breaks but trims edges", () => {
    expect(normalizeBody("  hola\n\nmundo  ")).toBe("hola\n\nmundo");
  });

  it("collapses runs of more than two blank lines", () => {
    expect(normalizeBody("a\n\n\n\n\nb")).toBe("a\n\nb");
  });
});

describe("validateComment", () => {
  const valid = { name: "Ana", body: "Funciona perfecto", website: "" };

  it("accepts a valid comment", () => {
    expect(validateComment(valid)).toEqual({ ok: true, name: "Ana", body: "Funciona perfecto" });
  });

  it("allows an empty name", () => {
    expect(validateComment({ ...valid, name: "" })).toMatchObject({ ok: true, name: "" });
  });

  it("rejects names longer than 40 characters", () => {
    expect(validateComment({ ...valid, name: "a".repeat(41) })).toEqual({ ok: false, error: "invalid_name" });
  });

  it("rejects bodies shorter than 2 or longer than 2000 characters", () => {
    expect(validateComment({ ...valid, body: "a" })).toEqual({ ok: false, error: "invalid_body" });
    expect(validateComment({ ...valid, body: "a".repeat(2001) })).toEqual({ ok: false, error: "invalid_body" });
  });

  it("reserves the author name for author comments", () => {
    expect(validateComment({ ...valid, name: "sbravo" })).toEqual({ ok: false, error: "invalid_name" });
    expect(validateComment({ ...valid, name: "SBravo oficial" })).toEqual({ ok: false, error: "invalid_name" });
    expect(validateComment({ ...valid, name: "sbravo" }, { author: true })).toMatchObject({ ok: true });
  });

  it("flags a filled honeypot as spam", () => {
    expect(validateComment({ ...valid, website: "http://spam.example" })).toEqual({ ok: false, error: "spam" });
  });

  it("rejects non-string input", () => {
    expect(validateComment({ ...valid, body: 42 as unknown as string })).toEqual({ ok: false, error: "invalid_body" });
  });
});

describe("parseThread", () => {
  it("accepts app threads", () => {
    expect(parseThread("app%3Awintune")).toBe("app:wintune");
  });

  it("rejects unknown shapes", () => {
    expect(parseThread("drop table")).toBeNull();
    expect(parseThread("app:")).toBeNull();
    expect(parseThread("%E0%A4%A")).toBeNull();
  });
});

describe("corsHeaders", () => {
  const allowed = ["https://sbravo.app", "http://localhost:4321"];

  it("echoes an allowed origin", () => {
    expect(corsHeaders("https://sbravo.app", allowed)["Access-Control-Allow-Origin"]).toBe("https://sbravo.app");
  });

  it("omits the allow-origin header for other origins", () => {
    expect(corsHeaders("https://evil.example", allowed)["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

describe("safeEqual", () => {
  it("matches identical strings and rejects different ones", () => {
    expect(safeEqual("token-123", "token-123")).toBe(true);
    expect(safeEqual("token-123", "token-124")).toBe(false);
    expect(safeEqual("short", "longer-token")).toBe(false);
  });
});

describe("sqliteToIso", () => {
  it("turns SQLite UTC datetimes into ISO strings every browser can parse", () => {
    expect(sqliteToIso("2026-10-29 12:44:57")).toBe("2026-10-29T12:44:57Z");
    expect(Number.isNaN(Date.parse(sqliteToIso("2026-10-29 12:44:57")))).toBe(false);
  });
});
