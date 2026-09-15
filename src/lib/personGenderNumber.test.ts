import { describe, expect, it } from "vitest";

import {
  getPersonGenderNumberCodes,
  getPersonGenderNumberHighlightCodes,
  getPersonGenderNumberHighlightState,
  PERSON_GENDER_NUMBER_CHIPS,
  setPersonGenderNumberHighlightScope,
} from "./personGenderNumber";
import { StudyMetadata, WordProps } from "./data";
import { clearAllFormattingState } from "./formatting";
import { deriveUniformFill, deriveUniformWordPalette } from "./utils";

describe("Person, Gender, Number specification (pages 121-126)", () => {
  it("keeps the ten chips in the mockup's row-major order with the exact fill/font hex values", () => {
    expect(PERSON_GENDER_NUMBER_CHIPS).toEqual([
      { code: "3ms", gloss: "He Him His", fill: "#BBDEFB", text: "#666666" },
      { code: "3mp", gloss: "They Them Their", fill: "#F8BBD0", text: "#666666" },
      { code: "2ms", gloss: "You Your", fill: "#3F51B5", text: "#FFFFFF" },
      { code: "2mp", gloss: "You Your", fill: "#E91E63", text: "#FFFFFF" },
      { code: "1cs", gloss: "I Me My", fill: "#FFF9C4", text: "#666666" },
      { code: "1cp", gloss: "We Us Our", fill: "#FFD54F", text: "#666666" },
      { code: "2fs", gloss: "You Your (f)", fill: "#9C27B0", text: "#FFFFFF" },
      { code: "2fp", gloss: "You Your (f)", fill: "#607D8B", text: "#FFFFFF" },
      { code: "3fs", gloss: "She Her Her", fill: "#E1BEE7", text: "#666666" },
      { code: "3fp", gloss: "They Them Their (f)", fill: "#CFD8DC", text: "#666666" },
    ]);
  });

  describe("saved Person, Gender, Number scope", () => {
    const word: WordProps = {
      wordId: 1, stanzaId: 1, stropheId: 1, lineId: 1, chapter: 1, verse: 1,
      strongNumber: 0, wlcWord: "", gloss: "", ETCBCgloss: undefined,
      morphology: "V-Piel-Imperf.h-1cs | 2ms", metadata: {},
      newLine: false, BSBnewLine: false, newVerse: false, showVerseNum: false,
      firstWordInStrophe: true, firstStropheInStanza: true, lastStropheInStanza: true,
      motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
    };
    const metadata = (): StudyMetadata => ({
      words: { 1: { indent: 2, color: { fill: "#FFF9C4", text: "#666666", border: "#D9D9D9" } } },
      personGenderNumberHighlights: { "0": ["2ms"], "1": ["3ms"] },
    });

    it("hydrates the selected chip scope separately from its word's primary color", () => {
      const state = getPersonGenderNumberHighlightState(metadata(), [word]);
      expect(state?.highlightId).toBe("person-gender-number__2ms");
      expect(state?.wordsColorMap.get(1)).toEqual({
        fill: "#FFF9C4", text: "#666666", border: "#D9D9D9", source: "syntax",
      });
      expect(state?.originalColors.has(1)).toBe(true);
      expect(state?.originalColors.get(1)).toBeUndefined();
    });

    it("never imports another layer's highlight scope", () => {
      const saved = metadata();
      saved.activeLayerId = 1;
      expect(getPersonGenderNumberHighlightState(saved, [word])).toBeUndefined();
      saved.activeLayerId = 2;
      expect(getPersonGenderNumberHighlightState(saved, [word])).toBeUndefined();
    });

    it("does not hydrate legacy colors without explicit scope", () => {
      const saved = metadata();
      delete saved.personGenderNumberHighlights;
      expect(getPersonGenderNumberHighlightState(saved, [word])).toBeUndefined();
    });

    it("does not claim subsequently edited or cleared word colors", () => {
      const saved = metadata();
      saved.words[1].color = { fill: "#000000", text: "#FFFFFF" };
      expect(getPersonGenderNumberHighlightState(saved, [word])).toBeUndefined();
      delete saved.words[1].color;
      expect(getPersonGenderNumberHighlightState(saved, [word])).toBeUndefined();
    });

    it("does not revive stale embedded colors when the authoritative word map was cleared", () => {
      const staleWord = { ...word, metadata: { color: { fill: "#FFF9C4", text: "#666666" } } };
      const options = { metadataMap: {}, colorMap: new Map() };
      expect(deriveUniformWordPalette([staleWord], options)).toBeUndefined();
      expect(deriveUniformFill([staleWord], options)).toBeUndefined();
    });

    it("does not revive cleared font or border fields from embedded word metadata", () => {
      const staleWord = { ...word, metadata: { color: { fill: "#FFF9C4", text: "#666666", border: "#000000" } } };
      expect(deriveUniformWordPalette([staleWord], {
        metadataMap: { 1: { color: { fill: "#FFFFFF" } } },
      })).toEqual({ fill: "#FFFFFF" });
    });

    it("still uses embedded colors when no authoritative metadata map is supplied", () => {
      const staleWord = { ...word, metadata: { color: { fill: "#FFF9C4", text: "#666666" } } };
      expect(deriveUniformWordPalette([staleWord])).toEqual(staleWord.metadata.color);
      expect(deriveUniformFill([staleWord])).toBe("#FFF9C4");
    });

    it("saves and clears only the active layer's scope", () => {
      const saved = metadata();
      setPersonGenderNumberHighlightScope(saved, ["1cs", "2ms"]);
      expect(saved.personGenderNumberHighlights).toEqual({ "0": ["1cs", "2ms"], "1": ["3ms"] });
      setPersonGenderNumberHighlightScope(saved, []);
      expect(saved.personGenderNumberHighlights).toEqual({ "1": ["3ms"] });
      saved.activeLayerId = 1;
      setPersonGenderNumberHighlightScope(saved, []);
      expect(saved).not.toHaveProperty("personGenderNumberHighlights");
    });

    it("clears the saved scope with formatting without altering other layers or structure", () => {
      const saved = metadata();
      expect(clearAllFormattingState(saved, new Map())).toBe(true);
      expect(saved.words[1]).toEqual({ indent: 2 });
      expect(saved.personGenderNumberHighlights).toEqual({ "1": ["3ms"] });
    });

    it("counts removing scope as a formatting change even when word colors are already empty", () => {
      const saved: StudyMetadata = { words: {}, personGenderNumberHighlights: { "0": ["2ms"] } };
      expect(clearAllFormattingState(saved, new Map())).toBe(true);
      expect(saved).toEqual({ words: {} });
    });

    it("recognizes only the new feature's scoped highlight IDs", () => {
      expect(getPersonGenderNumberHighlightCodes("person-gender-number__2ms,1cs")).toEqual(["2ms", "1cs"]);
      expect(getPersonGenderNumberHighlightCodes("parts-of-speech")).toEqual([]);
      expect(getPersonGenderNumberHighlightCodes(null)).toEqual([]);
    });
  });

  it.each(["3ms", "3mp", "2ms", "2mp", "1cs", "1cp", "2fs", "2fp", "3fs", "3fp"])(
    "matches only the complete %s morphology token",
    (code) => {
      expect(getPersonGenderNumberCodes(`V-Qal-Perf-${code}`)).toEqual([code]);
      expect(getPersonGenderNumberCodes(`V-Qal-Perf-${code}x`)).toEqual([]);
      expect(getPersonGenderNumberCodes(`V-Qal-Perf-x${code}`)).toEqual([]);
      expect(getPersonGenderNumberCodes(`V-Qal-Perf-${code}1`)).toEqual([]);
      expect(getPersonGenderNumberCodes(`V-Qal-Perf-${code}_extra`)).toEqual([]);
    },
  );

  it.each([undefined, null, "", "  |  ", "N-ms", "N-fp", "V-Qal-Inf", "3m", "1ms", "3cs", "2md"])(
    "does not infer person from missing, partial, or unsupported codes: %s",
    (morphology) => {
      expect(getPersonGenderNumberCodes(morphology)).toEqual([]);
    },
  );

  it("counts both alternatives and preserves their source order, not chip order", () => {
    expect(getPersonGenderNumberCodes("V-Piel-Imperf.h-1cs | 2ms")).toEqual(["1cs", "2ms"]);
    expect(getPersonGenderNumberCodes("V-Piel-Imperf.h-2ms | 1cs")).toEqual(["2ms", "1cs"]);
  });

  it("preserves the verb subject before the pronominal object suffix", () => {
    expect(getPersonGenderNumberCodes("V-Qal-Imperf-3ms + S-1cp")).toEqual(["3ms", "1cp"]);
  });

  it.each(["Pro-3fs", "Prep / S-3fs", "N-fs: S-3fs", "N-fs (3fs)", "V-Qal-Perf-3FS"])(
    "includes independent pronouns and suffixes: %s",
    (morphology) => {
      expect(getPersonGenderNumberCodes(morphology)).toEqual(["3fs"]);
    },
  );

  it("counts a word only once per code even if the code is repeated", () => {
    expect(getPersonGenderNumberCodes("V-Qal-Perf-3ms | 3ms + S-3ms")).toEqual(["3ms"]);
  });
});
