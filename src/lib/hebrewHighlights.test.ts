import { describe, expect, it } from "vitest";

import {
  buildHighlightedHebrewSegments,
  expandHebrewLetterIds,
  LETTER_CHIP_GROUPS,
  LETTER_CHIP_MAP,
  normalizeHebrewLetterId,
  SOUND_CHIP_MAP,
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

    describe("grouped letter palette policy", () => {
      it("derives grouped-chip palettes from the individual letter definitions", () => {
        for (const group of LETTER_CHIP_GROUPS) {
          const sourceId = group.id === "shin-sin-group" ? "shin" : group.memberIds[0];
          expect(group.palette).toBe(LETTER_CHIP_MAP.get(sourceId)?.palette);
        }
      });

      it("shares palette objects between corresponding sound and letter chips", () => {
        const mappings = {
          bet: "b",
          qof: "k-q",
          resh: "r",
          "final-pe": "p",
          shin: "sh",
        };
        for (const [letterId, soundId] of Object.entries(mappings)) {
          expect(LETTER_CHIP_MAP.get(letterId)?.palette).toBe(
            SOUND_CHIP_MAP.get(soundId)?.palette,
          );
        }
      });
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
