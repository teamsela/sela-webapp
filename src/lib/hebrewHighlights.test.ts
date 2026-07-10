import { describe, expect, it } from "vitest";

import {
  buildHighlightedHebrewSegments,
  splitTransliterationSegments,
} from "@/lib/hebrewHighlights";

describe("highlight occurrence metadata", () => {
  it("preserves duplicate transliterated sounds when adjacent segments merge", () => {
    expect(splitTransliterationSegments("mm")).toEqual([
      { text: "mm", highlightId: "m", occurrences: 2 },
    ]);
  });

  it("preserves duplicate Hebrew letters when adjacent highlights merge", () => {
    expect(
      buildHighlightedHebrewSegments(
        "ממ",
        new Set(),
        new Set(["mem"]),
      ),
    ).toEqual([
      { text: "ממ", highlightId: "mem", occurrences: 2 },
    ]);
  });
});
