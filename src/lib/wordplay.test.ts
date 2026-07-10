/**
 * Unit + regression suite for the Wordplay / Soundplay candidate engine.
 *
 * Anchors the generator rules to the deck's worked examples (Sela Mockup 2026):
 *  - Soundplay: Ps 19:6 me.kha.mat vs 19:7 makh.ki.mat  (≥4 shared sounds)
 *  - Soundplay: Ps 88:11 ba.qe.ver vs 88:13 u.va.bo.qer (b, v, q, r = 4)
 *  - Wordplay:  Qever קֶבֶר vs Boqer בֹּקֶר             (ק ב ר = 3 shared letters)
 * plus the rare/common letter rules, same-Strong exclusion, secondary tags and
 * run-scope filtering.
 */
import { describe, it, expect } from "vitest";

import { WordProps } from "@/lib/data";
import {
  COMMON_LETTER_IDS,
  RARE_LETTER_IDS,
  findCandidates,
  findSoundplayCandidates,
  findWordplayCandidates,
  isWordplayMatch,
  sharedMultiset,
  wordLetterIds,
  wordSoundIds,
} from "@/lib/wordplay";

let nextStrong = 1;

// Minimal WordProps factory — only the fields the engine reads matter.
const makeWord = (overrides: Partial<WordProps>): WordProps =>
  ({
    wordId: overrides.wordId ?? nextStrong,
    stanzaId: 0,
    stropheId: 0,
    lineId: 0,
    chapter: 1,
    verse: 1,
    strongNumber: overrides.strongNumber ?? nextStrong++,
    wlcWord: "",
    gloss: "",
    ETCBCgloss: undefined,
    metadata: {},
    newLine: false,
    showVerseNum: false,
    firstWordInStrophe: false,
    firstStropheInStanza: false,
    lastStropheInStanza: false,
    motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
    ...overrides,
  }) as WordProps;

describe("wordSoundIds", () => {
  it("extracts vowel-free consonant sound ids from the transliteration", () => {
    const word = makeWord({ passageTransliteration: "me.kha.mat" });
    expect(wordSoundIds(word)).toEqual(["m", "kh-ch", "m", "t"]);
  });

  it("falls back to pointed Hebrew when no transliteration is present", () => {
    const word = makeWord({ wlcWord: "מָמָ" });
    expect(wordSoundIds(word)).toEqual(["m", "m"]);
  });

  it("never falls back to the lexical dictionary transliteration", () => {
    const word = makeWord({
      wlcWord: "מָמָ",
      wordInformation: {
        hebrew: "בָּקָר",
        transliteration: "ba.qar",
        gloss: "",
        morphology: "",
        strongsNumber: "",
        meaning: "",
      },
    });
    expect(wordSoundIds(word)).toEqual(["m", "m"]);
  });
});

describe("wordLetterIds", () => {
  it("reads lexical letters from the lemma and normalises final forms", () => {
    // בֵּן lemma → bet, (final) nun normalised to nun.
    const word = makeWord({ motifData: { lemma: "בֵּן", relatedStrongNums: undefined, categories: [] } });
    expect(wordLetterIds(word)).toEqual(["bet", "nun"]);
  });

  it("normalises ALL five final forms (ך ם ן ץ ף) to their base ids", () => {
    // Regression for the dropped-final-pe bug: every final form must map to base.
    const cases: Array<[string, string]> = [
      ["מֶלֶך", "kaf"], // final kaf
      ["שָׁלוֹם", "mem"], // final mem
      ["בֵּן", "nun"], // final nun
      ["אֶרֶץ", "tsadi"], // final tsadi
      ["כֶּסֶף", "pe"], // final pe (previously dropped entirely)
    ];
    for (const [lemma, expectedBase] of cases) {
      const ids = wordLetterIds(
        makeWord({ motifData: { lemma, relatedStrongNums: undefined, categories: [] } }),
      );
      expect(ids).toContain(expectedBase);
      // no raw final-form id should leak through
      expect(ids.some((id) => id.startsWith("final-"))).toBe(false);
    }
  });

  it("uses the StepBible lexical form (wordInformation.hebrew) when no motif lemma", () => {
    const word = makeWord({
      motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
      wordInformation: {
        hebrew: "קֶבֶר",
        transliteration: "",
        gloss: "",
        morphology: "",
        strongsNumber: "",
        meaning: "",
      },
      wlcWord: "בְּקִבְרוֹ", // conjugated form must NOT be used
    });
    expect(wordLetterIds(word)).toEqual(["qof", "bet", "resh"]);
  });

  it("rejects wordInformation.hebrew when it equals the conjugated wlcWord (StepBible-miss fallback)", () => {
    // actions.ts falls back to wlcWord when StepBible has no entry → hebrew===wlcWord.
    // That is a conjugated form and must NOT be used for letter matching (p36).
    const word = makeWord({
      motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
      wordInformation: {
        hebrew: "בְּקִבְרוֹ",
        transliteration: "",
        gloss: "",
        morphology: "",
        strongsNumber: "",
        meaning: "",
      },
      wlcWord: "בְּקִבְרוֹ",
    });
    expect(wordLetterIds(word)).toEqual([]);
  });

  it("rejects the StepBible fallback even when wlcWord has surrounding whitespace", () => {
    // The data layer trims `hebrew` but not the stored `wlcWord`; the guard must
    // compare trimmed values so whitespace can't smuggle the conjugated form in.
    const word = makeWord({
      motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
      wordInformation: {
        hebrew: "בְּקִבְרוֹ",
        transliteration: "",
        gloss: "",
        morphology: "",
        strongsNumber: "",
        meaning: "",
      },
      wlcWord: "  בְּקִבְרוֹ ",
    });
    expect(wordLetterIds(word)).toEqual([]);
  });
});

describe("sharedMultiset", () => {
  it("counts duplicate ids individually via min(countA, countB)", () => {
    expect(sharedMultiset(["m", "m", "t"], ["m", "m", "k"]).sort()).toEqual(["m", "m"]);
    expect(sharedMultiset(["m", "t"], ["m", "m"])).toEqual(["m"]);
  });
});

describe("Soundplay — Shared Hebrew Sounds", () => {
  it("Ps 19:6 me.kha.mat vs 19:7 makh.ki.mat is a candidate (≥4 shared sounds)", () => {
    const words = [
      makeWord({ passageTransliteration: "me.kha.mat", strongNumber: 100 }),
      makeWord({ passageTransliteration: "makh.ki.mat", strongNumber: 101 }),
    ];
    const candidates = findSoundplayCandidates(words);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sharedCount).toBeGreaterThanOrEqual(4);
    expect(candidates[0].sharedIds).toEqual(["m", "kh-ch", "m", "t"]);
  });

  it("Ps 88:11 ba.qe.ver vs 88:13 u.va.bo.qer shares b, v, q, r (4)", () => {
    const words = [
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 200 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 201 }),
    ];
    const candidates = findSoundplayCandidates(words);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sharedCount).toBe(4);
    expect([...candidates[0].sharedIds].sort()).toEqual(["b", "k-q", "r", "v"]);
    expect(candidates[0].strongMatch).toBe(false);
  });

  it("does not generate a candidate below the 4-sound threshold", () => {
    const words = [
      makeWord({ passageTransliteration: "sha.lom", strongNumber: 300 }),
      makeWord({ passageTransliteration: "da.vid", strongNumber: 301 }),
    ];
    expect(findSoundplayCandidates(words)).toHaveLength(0);
  });

  it("marks a 5+ shared-sound pair as a strong match", () => {
    const words = [
      makeWord({ passageTransliteration: "shik.ma.tel", strongNumber: 400 }),
      makeWord({ passageTransliteration: "shik.ma.tel", strongNumber: 401 }),
    ];
    const candidates = findSoundplayCandidates(words);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sharedCount).toBeGreaterThanOrEqual(5);
    expect(candidates[0].strongMatch).toBe(true);
  });
});

describe("Wordplay — Shared Lexical Letters", () => {
  const qever = makeWord({
    motifData: { lemma: "קֶבֶר", relatedStrongNums: undefined, categories: [] },
    strongNumber: 500,
  });
  const boqer = makeWord({
    motifData: { lemma: "בֹּקֶר", relatedStrongNums: undefined, categories: [] },
    strongNumber: 501,
  });

  it("Qever קֶבֶר vs Boqer בֹּקֶר shares ק ב ר (3 letters) → candidate", () => {
    const candidates = findWordplayCandidates([qever, boqer]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sharedCount).toBe(3);
    expect([...candidates[0].sharedIds].sort()).toEqual(["bet", "qof", "resh"]);
    expect(candidates[0].strongMatch).toBe(true);
    expect(candidates[0].sameEnding).toBe(true); // both end in resh
    expect(candidates[0].sameOpening).toBe(false); // ק vs ב
  });

  it("matches a lemma pair sharing a final-pe letter (regression for dropped ף)", () => {
    // דֶּלֶף = dalet,lamed,(final)pe ; לַפִּיד = lamed,pe,yod,dalet → shared dalet,lamed,pe = 3.
    const words = [
      makeWord({ motifData: { lemma: "דֶּלֶף", relatedStrongNums: undefined, categories: [] }, strongNumber: 1810 }),
      makeWord({ motifData: { lemma: "לַפִּיד", relatedStrongNums: undefined, categories: [] }, strongNumber: 3940 }),
    ];
    const candidates = findWordplayCandidates(words);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sharedCount).toBe(3);
    expect([...candidates[0].sharedIds].sort()).toEqual(["dalet", "lamed", "pe"]);
    expect(candidates[0].strongMatch).toBe(true);
  });

  it("2 shared letters with a rare letter (ח) generates a candidate", () => {
    const words = [
      makeWord({ motifData: { lemma: "חַי", relatedStrongNums: undefined, categories: [] }, strongNumber: 600 }),
      makeWord({ motifData: { lemma: "חֵן", relatedStrongNums: undefined, categories: [] }, strongNumber: 601 }),
    ];
    // Shares ח (rare) + ... only ח in common → need a second shared letter.
    const both = [
      makeWord({ motifData: { lemma: "חֶסֶד", relatedStrongNums: undefined, categories: [] }, strongNumber: 610 }),
      makeWord({ motifData: { lemma: "חָדָשׁ", relatedStrongNums: undefined, categories: [] }, strongNumber: 611 }),
    ];
    // חֶסֶד = het,samekh,dalet ; חָדָשׁ = het,dalet,shin → shares het(rare)+dalet = 2 → candidate.
    const candidates = findWordplayCandidates(both);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sharedCount).toBe(2);
    expect(candidates[0].sharedIds).toContain("het");
    // guard against unused var lint on `words`
    expect(words).toHaveLength(2);
  });

  it("2 shared letters that are BOTH common (א ה) does NOT generate a candidate", () => {
    const words = [
      makeWord({ motifData: { lemma: "אַהֲבָה", relatedStrongNums: undefined, categories: [] }, strongNumber: 700 }),
      makeWord({ motifData: { lemma: "אֵלֶּה", relatedStrongNums: undefined, categories: [] }, strongNumber: 701 }),
    ];
    // אַהֲבָה = aleph,he,bet,he ; אֵלֶּה = aleph,lamed,he → shares aleph+he (both common) → rejected.
    expect(findWordplayCandidates(words)).toHaveLength(0);
  });

  it("2 shared letters with no rare letter (א + ב) does NOT generate a candidate", () => {
    const words = [
      makeWord({ motifData: { lemma: "אָב", relatedStrongNums: undefined, categories: [] }, strongNumber: 800 }),
      makeWord({ motifData: { lemma: "בָּא", relatedStrongNums: undefined, categories: [] }, strongNumber: 801 }),
    ];
    // both share aleph + bet (2 letters, neither rare) → rejected.
    expect(findWordplayCandidates(words)).toHaveLength(0);
  });

  it("isWordplayMatch encodes the rule directly", () => {
    expect(isWordplayMatch(["bet", "gimel", "dalet"])).toBe(true); // 3 any
    expect(isWordplayMatch(["het", "aleph"])).toBe(true); // 2 with rare
    expect(isWordplayMatch(["aleph", "he"])).toBe(false); // 2 both common
    expect(isWordplayMatch(["bet", "aleph"])).toBe(false); // 2 no rare
    expect(isWordplayMatch(["het"])).toBe(false); // only 1
  });

  it("excludes a word with no lemma (never falls back to the conjugated form)", () => {
    // Same conjugated letters, but no lemma → must NOT match on wlcWord (p36 CRITICAL).
    const noLemma = makeWord({
      wlcWord: "בֹּקֶר",
      motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
      strongNumber: 900,
    });
    expect(wordLetterIds(noLemma)).toEqual([]);
    expect(findWordplayCandidates([qever, noLemma])).toHaveLength(0);
  });
});

describe("same-word exclusion", () => {
  it("never pairs two words with the same Strong's number", () => {
    const words = [
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 999 }),
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 999 }),
    ];
    expect(findSoundplayCandidates(words)).toHaveLength(0);
    expect(findCandidates(words, "soundplay")).toHaveLength(0);
  });
});

describe("secondary tags", () => {
  it("flags proximity for same/adjacent strophes and drops it when far apart", () => {
    const near = findSoundplayCandidates([
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1000, stanzaId: 0, stropheId: 3 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 1001, stanzaId: 0, stropheId: 4 }),
    ]);
    expect(near[0].secondaryTags).toContain("proximity");

    const far = findSoundplayCandidates([
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1002, stanzaId: 0, stropheId: 0 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 1003, stanzaId: 0, stropheId: 9 }),
    ]);
    expect(far[0].secondaryTags).not.toContain("proximity");
  });

  it("does NOT flag proximity for equal per-stanza stropheIds in DIFFERENT stanzas", () => {
    // stropheId is per-stanza; stanza 0 strophe 2 and stanza 3 strophe 2 are far apart.
    const candidates = findSoundplayCandidates([
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1050, stanzaId: 0, stropheId: 2 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 1051, stanzaId: 3, stropheId: 2 }),
    ]);
    expect(candidates[0].secondaryTags).not.toContain("proximity");
  });

  it("flags similar conjugation, same part of speech, and same preposition prefix", () => {
    const candidates = findSoundplayCandidates([
      makeWord({
        passageTransliteration: "ba.qe.ver",
        wlcWord: "בְּקֶבֶר",
        // preposition (R) + common noun → POS "N", preposition ב
        morphology: "HR/Ncbsa",
        strongNumber: 1100,
        stropheId: 0,
      }),
      makeWord({
        passageTransliteration: "u.va.bo.qer",
        wlcWord: "בְּבֹקֶר",
        morphology: "HR/Ncbsa",
        strongNumber: 1101,
        stropheId: 0,
      }),
    ]);
    expect(candidates[0].secondaryTags).toContain("similar-conjugation");
    expect(candidates[0].secondaryTags).toContain("same-pos");
    expect(candidates[0].secondaryTags).toContain("same-preposition");
  });

  it("flags identical conjugated vowel sequences and rejects different ones", () => {
    const similar = findSoundplayCandidates([
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1120 }),
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1121 }),
    ]);
    expect(similar[0].secondaryTags).toContain("similar-vowels");

    const different = findSoundplayCandidates([
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1122 }),
      makeWord({ passageTransliteration: "bo.qo.var", strongNumber: 1123 }),
    ]);
    expect(different[0].secondaryTags).not.toContain("similar-vowels");
  });

  it("does NOT flag a preposition when morphology shows no prefix (avoids false positives)", () => {
    // First letter is ב but it is a root letter (no R prefix morpheme) → no tag.
    const candidates = findSoundplayCandidates([
      makeWord({ passageTransliteration: "ba.qe.ver", wlcWord: "בֶּקֶבֶר", morphology: "HNcbsa", strongNumber: 1110, stropheId: 0 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", wlcWord: "בֹּקֶר", morphology: "HNcbsa", strongNumber: 1111, stropheId: 0 }),
    ]);
    expect(candidates[0].secondaryTags).not.toContain("same-preposition");
  });
});

describe("run scope", () => {
  it("whole passage compares every pair", () => {
    const words = [
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1200, stropheId: 0 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 1201, stropheId: 10 }),
    ];
    expect(findSoundplayCandidates(words, { scope: { mode: "whole" } })).toHaveLength(1);
  });

  it("±2 strophes excludes words outside the window around the focus", () => {
    const words = [
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1300, stanzaId: 0, stropheId: 5 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 1301, stanzaId: 0, stropheId: 10 }),
    ];
    const scoped = findSoundplayCandidates(words, {
      scope: { mode: "adjacent", focusStanzaId: 0, focusStropheId: 5 },
    });
    expect(scoped).toHaveLength(0);
  });

  it("±2 strophes only compares within the focus stanza (per-stanza stropheId)", () => {
    // Both have stropheId within ±2 of focus, but the second is in a different
    // stanza, so it must be excluded despite the small stropheId delta.
    const words = [
      makeWord({ passageTransliteration: "ba.qe.ver", strongNumber: 1400, stanzaId: 0, stropheId: 0 }),
      makeWord({ passageTransliteration: "u.va.bo.qer", strongNumber: 1401, stanzaId: 1, stropheId: 0 }),
    ];
    const scoped = findSoundplayCandidates(words, {
      scope: { mode: "adjacent", focusStanzaId: 0, focusStropheId: 0 },
    });
    expect(scoped).toHaveLength(0);
  });
});

describe("rare / common letter constants", () => {
  it("expose the deck's canonical letter sets", () => {
    ["het", "ayin", "tet", "zayin", "tsadi", "qof", "sin"].forEach((id) =>
      expect(RARE_LETTER_IDS.has(id)).toBe(true),
    );
    ["aleph", "he", "vav", "yod"].forEach((id) =>
      expect(COMMON_LETTER_IDS.has(id)).toBe(true),
    );
  });
});
