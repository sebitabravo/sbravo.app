import { describe, expect, it } from "vitest";
import { splitWords } from "../src/scripts/split";

describe("splitWords", () => {
  it("preserves words, punctuation, and the original spacing", () => {
    const text = "Tools that  feel like magic.";
    const tokens = splitWords(text);

    expect(tokens).toEqual(["Tools", " ", "that", "  ", "feel", " ", "like", " ", "magic."]);
    expect(tokens.join("")).toBe(text);
  });

  it("returns an empty list for empty input", () => {
    expect(splitWords("")).toEqual([]);
  });

  it("preserves newlines, tabs, and Unicode text", () => {
    const text = "café\t你好\n🌱";

    expect(splitWords(text).join("")).toBe(text);
    expect(splitWords(text)).toEqual(["café", "\t", "你好", "\n", "🌱"]);
  });
});
