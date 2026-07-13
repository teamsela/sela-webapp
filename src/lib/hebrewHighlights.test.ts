import { describe, expect, it } from "vitest";

import {
  buildHighlightedHebrewSegments,
  expandHebrewLetterIds,
  normalizeHebrewLetterId,
  splitTransliterationSegments,
} from "@/lib/hebrewHighlights";

describe("highlight occurrence metadata", () => {
  it("preserves duplicate transliterated sounds when adjacent segments merge", () => {
    expect(splitTransliterationSegments("mm")).toEqual([
      { text: "mm", highlightId: "m", occurrences: 2 },
    ]);
  });

  describe("Hebrew final-form helpers", () => {
    it("normalizes every final form from the shared letter-group metadata", () => {
      expect(
        ["final-kaf", "final-mem", "final-nun", "final-pe", "final-tsadi"].map(
          normalizeHebrewLetterId,
        ),
      ).toEqual(["kaf", "mem", "nun", "pe", "tsadi"]);
    });

    it("expands base ids for passage highlighting without duplicates", () => {
      expect(expandHebrewLetterIds(["pe", "qof", "pe"])).toEqual([
        "pe",
        "final-pe",
        "qof",
      ]);
    });
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
