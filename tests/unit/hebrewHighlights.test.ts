import { describe, it, expect } from "vitest";
import {
  SOUND_CHIPS,
  LETTER_CHIPS,
  LETTER_CHIP_GROUPS,
  SOUND_CHIP_MAP,
  LETTER_CHIP_MAP,
  splitTransliterationSegments,
  splitHebrewClusters,
  countSoundOccurrences,
  countLetterOccurrences,
  wordContainsSound,
  wordContainsLetter,
  buildHighlightedTransliterationSegments,
  buildHighlightedHebrewSegments,
  transliterateHebrew,
} from "@/lib/hebrewHighlights";
import type { WordProps } from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Build a minimal WordProps for testing. */
const makeWord = (opts: {
  hebrew?: string;
  transliteration?: string;
  wlcWord?: string;
}): WordProps =>
  ({
    wordId: 1,
    stanzaId: 1,
    stropheId: 1,
    lineId: 1,
    chapter: 23,
    verse: 1,
    strongNumber: 1,
    wlcWord: opts.wlcWord ?? "",
    gloss: "test",
    ETCBCgloss: undefined,
    metadata: {},
    newLine: false,
    showVerseNum: false,
    firstWordInStrophe: false,
    firstStropheInStanza: false,
    lastStropheInStanza: false,
    motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
    wordInformation: opts.hebrew || opts.transliteration
      ? {
          hebrew: opts.hebrew ?? "",
          transliteration: opts.transliteration ?? "",
          gloss: "",
          morphology: "",
          strongsNumber: "",
          meaning: "",
        }
      : undefined,
  }) as WordProps;

/* ================================================================== */
/*  1 · SOUND_CHIPS definitions                                       */
/* ================================================================== */

describe("SOUND_CHIPS definitions", () => {
  it("contains exactly 19 sound chips", () => {
    expect(SOUND_CHIPS).toHaveLength(19);
  });

  it("has the correct sound IDs", () => {
    const ids = SOUND_CHIPS.map((c) => c.id);
    expect(ids).toEqual([
      "s", "sh", "ts", "z", "kh-ch", "k-q",
      "g", "h", "d", "t", "n", "m",
      "b", "v", "p", "f", "l", "r", "y",
    ]);
  });

  it("has the correct labels", () => {
    const labels = SOUND_CHIPS.map((c) => c.label);
    expect(labels).toEqual([
      "s", "sh", "ts", "z", "kh/ch", "k/q",
      "g", "h", "d", "t", "n", "m",
      "b", "v", "p", "f", "l", "r", "y",
    ]);
  });

  it("each chip has a palette with fill, border, text", () => {
    for (const chip of SOUND_CHIPS) {
      expect(chip.palette.fill).toBeDefined();
      expect(chip.palette.border).toBeDefined();
      expect(chip.palette.text).toBeDefined();
    }
  });

  it("SOUND_CHIP_MAP can look up every chip by id", () => {
    for (const chip of SOUND_CHIPS) {
      expect(SOUND_CHIP_MAP.get(chip.id)).toBe(chip);
    }
  });
});

/* ================================================================== */
/*  2 · LETTER_CHIPS definitions                                      */
/* ================================================================== */

describe("LETTER_CHIPS definitions", () => {
  it("contains 27 letter chips (22 base + 5 final forms)", () => {
    expect(LETTER_CHIPS).toHaveLength(27);
  });

  it("includes all base Hebrew letters", () => {
    const labels = LETTER_CHIPS.map((c) => c.label);
    const baseLetters = [
      "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י",
      "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ת",
    ];
    for (const letter of baseLetters) {
      expect(labels).toContain(letter);
    }
  });

  it("includes final forms: ך, ם, ן, ץ", () => {
    const labels = LETTER_CHIPS.map((c) => c.label);
    expect(labels).toContain("ך");
    expect(labels).toContain("ם");
    expect(labels).toContain("ן");
    expect(labels).toContain("ץ");
  });

  it("includes sin (שׂ) and shin (שׁ) separately", () => {
    const labels = LETTER_CHIPS.map((c) => c.label);
    expect(labels).toContain("שׂ");
    expect(labels).toContain("שׁ");
  });

  it("LETTER_CHIP_MAP can look up every chip by id", () => {
    for (const chip of LETTER_CHIPS) {
      expect(LETTER_CHIP_MAP.get(chip.id)).toBe(chip);
    }
  });
});

/* ================================================================== */
/*  3 · splitTransliterationSegments                                  */
/* ================================================================== */

describe("splitTransliterationSegments", () => {
  it("splits simple transliteration into sound segments", () => {
    const segments = splitTransliterationSegments("le.da.vid");
    const soundSegments = segments.filter((s) => s.highlightId);
    expect(soundSegments.map((s) => s.highlightId)).toEqual(["l", "d", "v", "d"]);
  });

  it("correctly identifies 'sh' as a two-letter pattern", () => {
    const segments = splitTransliterationSegments("she.mo");
    const shSegment = segments.find((s) => s.highlightId === "sh");
    expect(shSegment).toBeDefined();
    expect(shSegment!.text).toBe("sh");
  });

  it("correctly identifies 'kh' as kh-ch sound", () => {
    const segments = splitTransliterationSegments("ye.na.kha.le.ni");
    const khSegments = segments.filter((s) => s.highlightId === "kh-ch");
    expect(khSegments.length).toBe(1);
    expect(khSegments[0].text).toBe("kh");
  });

  it("correctly identifies 'ch' as kh-ch sound", () => {
    const segments = splitTransliterationSegments("ech.sar");
    const chSegments = segments.filter((s) => s.highlightId === "kh-ch");
    expect(chSegments.length).toBe(1);
    expect(chSegments[0].text).toBe("ch");
  });

  it("correctly identifies 'ts' as ts sound", () => {
    const segments = splitTransliterationSegments("tse.dek");
    const tsSegments = segments.filter((s) => s.highlightId === "ts");
    expect(tsSegments.length).toBe(1);
  });

  it("does not confuse 's' within 'sh'", () => {
    // "sh" should match the two-char pattern, not "s" + "h"
    const segments = splitTransliterationSegments("sh");
    expect(segments).toHaveLength(1);
    expect(segments[0].highlightId).toBe("sh");
  });

  it("handles vowels and dots as non-sound characters", () => {
    const segments = splitTransliterationSegments("a.do.nai");
    const nonSoundParts = segments.filter((s) => !s.highlightId);
    // Vowels (a, o, a, i) and dots should have no highlightId
    expect(nonSoundParts.length).toBeGreaterThan(0);
  });

  it("handles empty string", () => {
    const segments = splitTransliterationSegments("");
    expect(segments).toHaveLength(0);
  });

  it("handles 'q' as k-q sound", () => {
    const segments = splitTransliterationSegments("qol");
    const qSegments = segments.filter((s) => s.highlightId === "k-q");
    expect(qSegments.length).toBe(1);
  });
});

/* ================================================================== */
/*  4 · splitHebrewClusters                                           */
/* ================================================================== */

describe("splitHebrewClusters", () => {
  it("splits simple Hebrew text into letter clusters", () => {
    const clusters = splitHebrewClusters("אבגד");
    expect(clusters).toHaveLength(4);
    expect(clusters.map((c) => c.letterId)).toEqual(["aleph", "bet", "gimel", "dalet"]);
  });

  it("handles combining marks as part of a cluster", () => {
    // בּ = bet + dagesh (U+05BC)
    const clusters = splitHebrewClusters("בּ");
    expect(clusters).toHaveLength(1);
    expect(clusters[0].letterId).toBe("bet");
    expect(clusters[0].soundIds).toEqual(["b"]); // dagesh → "b" sound
  });

  it("bet without dagesh maps to 'v' sound", () => {
    const clusters = splitHebrewClusters("ב");
    expect(clusters).toHaveLength(1);
    expect(clusters[0].letterId).toBe("bet");
    expect(clusters[0].soundIds).toEqual(["v"]);
  });

  it("kaf with dagesh maps to k-q, without to kh-ch", () => {
    // כּ (kaf + dagesh) → k-q
    const withDagesh = splitHebrewClusters("כּ");
    expect(withDagesh[0].soundIds).toEqual(["k-q"]);

    // כ (kaf without dagesh) → kh-ch
    const withoutDagesh = splitHebrewClusters("כ");
    expect(withoutDagesh[0].soundIds).toEqual(["kh-ch"]);
  });

  it("pe with dagesh maps to p, without to f", () => {
    // פּ → p
    const withDagesh = splitHebrewClusters("פּ");
    expect(withDagesh[0].soundIds).toEqual(["p"]);

    // פ → f
    const withoutDagesh = splitHebrewClusters("פ");
    expect(withoutDagesh[0].soundIds).toEqual(["f"]);
  });

  it("shin dot → 'sh' sound, sin dot → 's' sound", () => {
    // שׁ = shin (U+05E9 + U+05C1) → "sh"
    const shin = splitHebrewClusters("שׁ");
    expect(shin[0].letterId).toBe("shin");
    expect(shin[0].soundIds).toEqual(["sh"]);

    // שׂ = sin (U+05E9 + U+05C2) → "s"
    const sin = splitHebrewClusters("שׂ");
    expect(sin[0].letterId).toBe("sin");
    expect(sin[0].soundIds).toEqual(["s"]);
  });

  it("final kaf with/without dagesh maps correctly", () => {
    // ךּ → k-q
    const withDagesh = splitHebrewClusters("ךּ");
    expect(withDagesh[0].letterId).toBe("final-kaf");
    expect(withDagesh[0].soundIds).toEqual(["k-q"]);

    // ך → kh-ch
    const withoutDagesh = splitHebrewClusters("ך");
    expect(withoutDagesh[0].letterId).toBe("final-kaf");
    expect(withoutDagesh[0].soundIds).toEqual(["kh-ch"]);
  });

  it("tav with or without dagesh always maps to 't' sound", () => {
    // תּ → t (dagesh doesn't change pronunciation)
    const withDagesh = splitHebrewClusters("תּ");
    expect(withDagesh[0].soundIds).toEqual(["t"]);

    // ת → t
    const withoutDagesh = splitHebrewClusters("ת");
    expect(withoutDagesh[0].soundIds).toEqual(["t"]);
  });

  it("aleph has no sound", () => {
    const clusters = splitHebrewClusters("א");
    expect(clusters[0].letterId).toBe("aleph");
    expect(clusters[0].soundIds).toEqual([]);
  });

  it("ayin has no sound", () => {
    const clusters = splitHebrewClusters("ע");
    expect(clusters[0].letterId).toBe("ayin");
    expect(clusters[0].soundIds).toEqual([]);
  });

  it("handles empty string", () => {
    expect(splitHebrewClusters("")).toHaveLength(0);
  });
});

/* ================================================================== */
/*  5 · Four critical dagesh pairs                                    */
/* ================================================================== */

describe("Four critical dagesh pairs", () => {
  it("כ ך (kh) vs כּ ךּ (k) — different sounds based on dagesh", () => {
    // Without dagesh → kh-ch
    expect(splitHebrewClusters("כ")[0].soundIds).toEqual(["kh-ch"]);
    expect(splitHebrewClusters("ך")[0].soundIds).toEqual(["kh-ch"]);
    // With dagesh → k-q
    expect(splitHebrewClusters("כּ")[0].soundIds).toEqual(["k-q"]);
    expect(splitHebrewClusters("ךּ")[0].soundIds).toEqual(["k-q"]);
  });

  it("בּ (b) vs ב (v) — different sounds based on dagesh", () => {
    expect(splitHebrewClusters("בּ")[0].soundIds).toEqual(["b"]);
    expect(splitHebrewClusters("ב")[0].soundIds).toEqual(["v"]);
  });

  it("פּ (p) vs פ (f) — different sounds based on dagesh", () => {
    expect(splitHebrewClusters("פּ")[0].soundIds).toEqual(["p"]);
    expect(splitHebrewClusters("פ")[0].soundIds).toEqual(["f"]);
  });

  it("שׂ (s) vs שׁ (sh) — different sounds based on sin/shin dot", () => {
    expect(splitHebrewClusters("שׂ")[0].soundIds).toEqual(["s"]);
    expect(splitHebrewClusters("שׁ")[0].soundIds).toEqual(["sh"]);
  });

  it("S sound is represented by ס and שׂ but NOT שׁ", () => {
    // samekh → "s"
    expect(splitHebrewClusters("ס")[0].soundIds).toEqual(["s"]);
    // sin → "s"
    expect(splitHebrewClusters("שׂ")[0].soundIds).toEqual(["s"]);
    // shin → "sh" (NOT "s")
    expect(splitHebrewClusters("שׁ")[0].soundIds).not.toContain("s");
    expect(splitHebrewClusters("שׁ")[0].soundIds).toEqual(["sh"]);
  });

  it("dagesh on tav does NOT change pronunciation", () => {
    // Both with and without dagesh → "t"
    expect(splitHebrewClusters("ת")[0].soundIds).toEqual(["t"]);
    expect(splitHebrewClusters("תּ")[0].soundIds).toEqual(["t"]);
  });
});

/* ================================================================== */
/*  6 · Sound-to-letter mapping completeness                          */
/* ================================================================== */

describe("Sound-to-Hebrew-letter mapping (all 19 sounds)", () => {
  const cases: Array<{ sound: string; hebrewLetters: string[] }> = [
    { sound: "s", hebrewLetters: ["ס", "שׂ"] },
    { sound: "sh", hebrewLetters: ["שׁ"] },
    { sound: "ts", hebrewLetters: ["צ", "ץ"] },
    { sound: "z", hebrewLetters: ["ז"] },
    { sound: "kh-ch", hebrewLetters: ["ח", "כ", "ך"] },
    { sound: "k-q", hebrewLetters: ["כּ", "ךּ", "ק"] },
    { sound: "g", hebrewLetters: ["ג"] },
    { sound: "h", hebrewLetters: ["ה"] },
    { sound: "d", hebrewLetters: ["ד"] },
    { sound: "t", hebrewLetters: ["ת", "ט"] },
    { sound: "n", hebrewLetters: ["נ", "ן"] },
    { sound: "m", hebrewLetters: ["מ", "ם"] },
    { sound: "b", hebrewLetters: ["בּ"] },
    { sound: "v", hebrewLetters: ["ו", "ב"] },
    { sound: "p", hebrewLetters: ["פּ"] },
    { sound: "f", hebrewLetters: ["פ"] },
    { sound: "l", hebrewLetters: ["ל"] },
    { sound: "r", hebrewLetters: ["ר"] },
    { sound: "y", hebrewLetters: ["י"] },
  ];

  for (const { sound, hebrewLetters } of cases) {
    it(`"${sound}" maps to ${hebrewLetters.join(", ")}`, () => {
      for (const letter of hebrewLetters) {
        const clusters = splitHebrewClusters(letter);
        expect(clusters).toHaveLength(1);
        expect(clusters[0].soundIds).toContain(sound);
      }
    });
  }
});

/* ================================================================== */
/*  7 · countSoundOccurrences / countLetterOccurrences                */
/* ================================================================== */

describe("countSoundOccurrences", () => {
  it("counts sounds via transliteration when available", () => {
    const word = makeWord({ transliteration: "ye.sho.vev" });
    // "sh" appears once, "v" appears twice (v + v)
    expect(countSoundOccurrences(word, "sh")).toBe(1);
    expect(countSoundOccurrences(word, "v")).toBe(2);
    expect(countSoundOccurrences(word, "y")).toBe(1);
  });

  it("returns 0 for sounds not present", () => {
    const word = makeWord({ transliteration: "le.da.vid" });
    expect(countSoundOccurrences(word, "sh")).toBe(0);
    expect(countSoundOccurrences(word, "ts")).toBe(0);
  });

  it("falls back to Hebrew when no transliteration", () => {
    const word = makeWord({ hebrew: "שׁלום" }); // shin + lamed + vav + mem
    expect(countSoundOccurrences(word, "sh")).toBe(1);
    expect(countSoundOccurrences(word, "l")).toBe(1);
  });
});

describe("countLetterOccurrences", () => {
  it("counts letter occurrences in Hebrew text", () => {
    const word = makeWord({ hebrew: "אבגד" });
    expect(countLetterOccurrences(word, "aleph")).toBe(1);
    expect(countLetterOccurrences(word, "bet")).toBe(1);
    expect(countLetterOccurrences(word, "gimel")).toBe(1);
    expect(countLetterOccurrences(word, "dalet")).toBe(1);
  });

  it("returns 0 for letters not present", () => {
    const word = makeWord({ hebrew: "אבגד" });
    expect(countLetterOccurrences(word, "shin")).toBe(0);
    expect(countLetterOccurrences(word, "tav")).toBe(0);
  });

  it("distinguishes final forms", () => {
    // ך = final kaf, כ = regular kaf
    const word = makeWord({ hebrew: "מלך" }); // mem + lamed + final-kaf
    expect(countLetterOccurrences(word, "final-kaf")).toBe(1);
    expect(countLetterOccurrences(word, "kaf")).toBe(0);
  });
});

/* ================================================================== */
/*  8 · wordContainsSound / wordContainsLetter                        */
/* ================================================================== */

describe("wordContainsSound / wordContainsLetter", () => {
  it("wordContainsSound returns true when sound exists", () => {
    const word = makeWord({ transliteration: "she.mo" });
    expect(wordContainsSound(word, "sh")).toBe(true);
    expect(wordContainsSound(word, "m")).toBe(true);
  });

  it("wordContainsSound returns false when sound absent", () => {
    const word = makeWord({ transliteration: "she.mo" });
    expect(wordContainsSound(word, "ts")).toBe(false);
  });

  it("wordContainsLetter returns true when letter exists", () => {
    const word = makeWord({ hebrew: "שׁמו" });
    expect(wordContainsLetter(word, "shin")).toBe(true);
  });

  it("wordContainsLetter returns false when letter absent", () => {
    const word = makeWord({ hebrew: "שׁמו" });
    expect(wordContainsLetter(word, "aleph")).toBe(false);
  });
});

/* ================================================================== */
/*  9 · buildHighlightedTransliterationSegments                       */
/* ================================================================== */

describe("buildHighlightedTransliterationSegments", () => {
  it("highlights only selected sounds", () => {
    const segments = buildHighlightedTransliterationSegments(
      "she.mo",
      new Set(["sh"]),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe("sh");
    expect(highlighted[0].highlightId).toBe("sh");
  });

  it("does NOT highlight unselected sounds", () => {
    const segments = buildHighlightedTransliterationSegments(
      "she.mo",
      new Set(["ts"]), // "ts" is not in "she.mo"
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted).toHaveLength(0);
  });

  it("highlights multiple selected sounds", () => {
    const segments = buildHighlightedTransliterationSegments(
      "ye.sho.vev",
      new Set(["sh", "v"]),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted.length).toBeGreaterThanOrEqual(2);
  });

  it("with empty selection, highlights nothing", () => {
    const segments = buildHighlightedTransliterationSegments(
      "le.da.vid",
      new Set(),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted).toHaveLength(0);
  });
});

/* ================================================================== */
/*  10 · buildHighlightedHebrewSegments                               */
/* ================================================================== */

describe("buildHighlightedHebrewSegments", () => {
  it("highlights Hebrew letters by selected sound", () => {
    // שׁלום — shin maps to "sh" sound
    const segments = buildHighlightedHebrewSegments(
      "שׁלום",
      new Set(["sh"]),
      new Set(),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted.length).toBeGreaterThan(0);
    expect(highlighted[0].highlightId).toBe("sh");
  });

  it("highlights Hebrew letters by selected letter ID", () => {
    const segments = buildHighlightedHebrewSegments(
      "אבגד",
      new Set(),
      new Set(["aleph"]),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].highlightId).toBe("aleph");
  });

  it("sound selection takes priority over letter selection", () => {
    // ב without dagesh → "v" sound, letterId = "bet"
    const segments = buildHighlightedHebrewSegments(
      "ב",
      new Set(["v"]),
      new Set(["bet"]),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].highlightId).toBe("v"); // sound takes priority
  });

  it("with no selections, highlights nothing", () => {
    const segments = buildHighlightedHebrewSegments(
      "אבגד",
      new Set(),
      new Set(),
    );
    const highlighted = segments.filter((s) => s.highlightId);
    expect(highlighted).toHaveLength(0);
  });

  it("highlights individual letters, not whole words", () => {
    // Select only "aleph" — only first letter highlighted
    const segments = buildHighlightedHebrewSegments(
      "אבגד",
      new Set(),
      new Set(["aleph"]),
    );
    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments[0].highlightId).toBe("aleph");
    expect(segments[1].highlightId).toBeUndefined();
  });
});

/* ================================================================== */
/*  11 · LETTER_CHIP_GROUPS (grouped display for PDF spec)            */
/* ================================================================== */

describe("LETTER_CHIP_GROUPS", () => {
  it("contains exactly 22 groups (matching PDF spec)", () => {
    expect(LETTER_CHIP_GROUPS).toHaveLength(22);
  });

  it("groups final forms together: כ ך, מ ם, נ ן, צ ץ, שׂ שׁ", () => {
    const kafGroup = LETTER_CHIP_GROUPS.find((g) => g.label === "כ ך");
    expect(kafGroup).toBeDefined();
    expect(kafGroup!.memberIds).toEqual(["kaf", "final-kaf"]);

    const memGroup = LETTER_CHIP_GROUPS.find((g) => g.label === "מ ם");
    expect(memGroup).toBeDefined();
    expect(memGroup!.memberIds).toEqual(["mem", "final-mem"]);

    const nunGroup = LETTER_CHIP_GROUPS.find((g) => g.label === "נ ן");
    expect(nunGroup).toBeDefined();
    expect(nunGroup!.memberIds).toEqual(["nun", "final-nun"]);

    const tsadiGroup = LETTER_CHIP_GROUPS.find((g) => g.label === "צ ץ");
    expect(tsadiGroup).toBeDefined();
    expect(tsadiGroup!.memberIds).toEqual(["tsadi", "final-tsadi"]);

    const shinSinGroup = LETTER_CHIP_GROUPS.find((g) => g.label === "שׂ שׁ");
    expect(shinSinGroup).toBeDefined();
    expect(shinSinGroup!.memberIds).toEqual(["sin", "shin"]);
  });

  it("every group memberIds maps to a valid LETTER_CHIP", () => {
    for (const group of LETTER_CHIP_GROUPS) {
      for (const memberId of group.memberIds) {
        expect(LETTER_CHIP_MAP.get(memberId)).toBeDefined();
      }
    }
  });

  it("every individual LETTER_CHIP belongs to exactly one group", () => {
    const allMemberIds = LETTER_CHIP_GROUPS.flatMap((g) => g.memberIds);
    // Every LETTER_CHIP id is present
    for (const chip of LETTER_CHIPS) {
      expect(allMemberIds).toContain(chip.id);
    }
    // No duplicates
    expect(new Set(allMemberIds).size).toBe(allMemberIds.length);
  });

  it("standalone letters have single-element memberIds", () => {
    const aleph = LETTER_CHIP_GROUPS.find((g) => g.id === "aleph");
    expect(aleph).toBeDefined();
    expect(aleph!.memberIds).toEqual(["aleph"]);

    const lamed = LETTER_CHIP_GROUPS.find((g) => g.id === "lamed");
    expect(lamed).toBeDefined();
    expect(lamed!.memberIds).toEqual(["lamed"]);
  });

  it("each group has a valid palette", () => {
    for (const group of LETTER_CHIP_GROUPS) {
      expect(group.palette.fill).toBeDefined();
      expect(group.palette.border).toBeDefined();
      expect(group.palette.text).toBeDefined();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  transliterateHebrew                                               */
/* ------------------------------------------------------------------ */

describe("transliterateHebrew", () => {
  it("transliterates מִזְמוֹר (mizmor) — Psalm", () => {
    const result = transliterateHebrew("מִזְמוֹר");
    // Core sounds present: m-i, z, m-o-r
    expect(result).toMatch(/mi/);
    expect(result).toMatch(/z/);
    expect(result).toMatch(/mor/);
  });

  it("transliterates לְדָוִד (ledavid) — includes prefix le", () => {
    const result = transliterateHebrew("לְדָוִד");
    expect(result).toMatch(/^le/);
    expect(result).toContain("da");
    expect(result).toContain("vid");
  });

  it("transliterates יְהוָה (YHVH)", () => {
    const result = transliterateHebrew("יְהוָה");
    expect(result).toMatch(/^ye/);
    expect(result).toContain("h");
  });

  it("transliterates רֹעִי (roi) — my shepherd", () => {
    const result = transliterateHebrew("רֹעִי");
    expect(result).toContain("ro");
    expect(result).toContain("i");
  });

  it("returns empty string for empty input", () => {
    expect(transliterateHebrew("")).toBe("");
  });

  it("handles שׁ (shin) vs שׂ (sin) distinction", () => {
    const shin = transliterateHebrew("שֶׁ"); // shin with segol
    const sin = transliterateHebrew("שֶׂ");  // sin with segol
    expect(shin).toContain("sh");
    expect(sin).not.toContain("sh");
    expect(sin).toContain("s");
  });

  it("handles bet/vet dagesh distinction", () => {
    const bet = transliterateHebrew("בֵּ"); // bet with dagesh
    const vet = transliterateHebrew("בֵ");  // vet without dagesh
    expect(bet).toContain("b");
    expect(vet).toContain("v");
  });
});
