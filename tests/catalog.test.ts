import { describe, expect, it } from "vitest";
import { findApp, formatDate, sortByDateDesc, validateCatalog, versionAnchor } from "../src/lib/catalog";
import { apps, news } from "../src/data/catalog";
import type { App } from "../src/lib/types";

const base: App = {
  slug: "demo",
  title: "Demo",
  version: "1.0.0",
  description: "",
  author: "x",
  uploaded: "2026-01-01",
  category: "Utility",
  accent: "#fff",
  downloadUrl: "#",
  platforms: ["Windows"],
  size: "1 MB",
};

describe("sortByDateDesc", () => {
  it("returns newest first without mutating input", () => {
    const input = [{ d: "2026-01-01" }, { d: "2026-03-01" }, { d: "2026-02-01" }];
    const sorted = sortByDateDesc(input, (x) => x.d);
    expect(sorted.map((x) => x.d)).toEqual(["2026-03-01", "2026-02-01", "2026-01-01"]);
    expect(input[0].d).toBe("2026-01-01");
  });

  it("returns empty array for empty input", () => {
    expect(sortByDateDesc([], () => "")).toEqual([]);
  });
});

describe("formatDate", () => {
  it("formats ISO date without timezone day shift", () => {
    expect(formatDate("2026-10-01")).toBe("Oct 01, 2026");
  });

  it("throws on invalid date", () => {
    expect(() => formatDate("10/01/2026")).toThrow("Invalid ISO date");
  });
});

describe("versionAnchor", () => {
  it("prefixes version with v", () => {
    expect(versionAnchor("1.4.0")).toBe("v1.4.0");
  });
});

describe("findApp", () => {
  it("returns app by slug", () => {
    expect(findApp([base], "demo")).toBe(base);
  });

  it("returns undefined when slug does not exist", () => {
    expect(findApp([base], "missing")).toBeUndefined();
  });
});

describe("validateCatalog", () => {
  it("reports duplicate slugs", () => {
    expect(validateCatalog([base, base], [])).toContain("Duplicate slug: demo");
  });

  it("reports invalid slug, version and date", () => {
    const errors = validateCatalog([{ ...base, slug: "Bad Slug", version: "1.0", uploaded: "2026/1/1" }], []);
    expect(errors).toHaveLength(3);
  });

  it("reports news pointing to unknown app", () => {
    const errors = validateCatalog([base], [{ date: "2026-01-01", app: "ghost", version: "1.0.0", title: "", summary: "" }]);
    expect(errors).toEqual(["News points to unknown app: ghost"]);
  });

  it("reports missing platforms", () => {
    expect(validateCatalog([{ ...base, platforms: [] }], [])).toEqual(["Missing platforms for demo"]);
  });

  it("rejects malformed sha256 and accepts a valid one", () => {
    expect(validateCatalog([{ ...base, sha256: "abc" }], [])).toEqual(["Invalid sha256 for demo"]);
    expect(validateCatalog([{ ...base, sha256: "a".repeat(64) }], [])).toEqual([]);
  });

  it("requires thumbs to live in /thumbs/", () => {
    expect(validateCatalog([{ ...base, thumb: "https://cdn.example/x.png" }], [])).toEqual(["Invalid thumb for demo"]);
    expect(validateCatalog([{ ...base, thumb: "/thumbs/demo.webp" }], [])).toEqual([]);
  });

  it("accepts the shipped catalog data", () => {
    expect(validateCatalog(apps, news)).toEqual([]);
  });
});
