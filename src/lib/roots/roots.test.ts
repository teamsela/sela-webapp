import { describe, expect, it } from "vitest";

import { formatRootLabel, lookupRoot } from "./index";
import { PassageProps, WordProps } from "../data";
import { extractIdenticalWordsFromPassage, wordsInSameGroups } from "../utils";

const root = (strong: number, book = "psalms", chapter = 1, verse = 1, nth = 0) =>
  lookupRoot(book, chapter, verse, strong, nth);

describe("lookupRoot", () => {
  it("groups a verb with its nouns (Ps 1:1 מוֹשָׁב 'seat' / יָשַׁב 'sit')", () => {
    expect(root(4186).rootId).toBeDefined();
    expect(root(4186).rootId).toBe(root(3427).rootId);
    expect(root(3427).rootLabel).toBe("ישב");
  });

  it("groups צַדִּיק, צֶדֶק, צָדֵק and צְדָקָה under צדק", () => {
    const ids = [6662, 6663, 6664, 6666].map((s) => root(s).rootId);
    expect(new Set(ids).size).toBe(1);
  });

  it("resolves homonyms per occurrence: ענה 'answer' vs ענה 'sing' (Exod 15:21)", () => {
    const answer = root(6030, "psalms", 3, 5);
    const sing = root(6030, "exodus", 15, 21);
    expect(answer.rootGloss).toBe("answer");
    expect(sing.rootGloss).toBe("sing");
    expect(answer.rootId).not.toBe(sing.rootId);
  });

  it("separates words with shared letters but unrelated meaning (עֵת 'time' vs עָנָה 'answer')", () => {
    expect(root(6256).rootId).not.toBe(root(6030).rootId);
  });

  it("keeps meaning-linked borderline pairs together (אָדָם / אֲדָמָה) and splits others (שָׁנָה year / change)", () => {
    expect(root(120).rootId).toBe(root(127).rootId);
    expect(root(8141).rootId).not.toBe(root(8138).rootId);
  });

  it("joins Aramaic cognates with Hebrew roots (Aramaic תּוּב with שׁוּב 'return')", () => {
    expect(root(8421).rootId).toBe(root(7725).rootId);
  });

  it("gives proper names the roots they are built from, ignoring divine elements", () => {
    expect(root(5838).nameRootIds).toContain(root(5826).rootId); // Azariah → עזר 'help'
    expect(root(3068).nameRootIds).toEqual([]); // יהוה is not linked to הָיָה
    expect(root(3478).nameRootIds).not.toContain(root(410).rootId); // Israel does not link to אֵל
  });

  it("leaves function words without a root (exact match only)", () => {
    expect(root(3588).rootId).toBeUndefined(); // כִּי
    expect(root(853).rootId).toBeUndefined(); // אֵת
  });

  it("formats root keys for display", () => {
    expect(formatRootLabel("דבר ‹bee›")).toBe("דבר");
    expect(formatRootLabel("arc:פשר")).toBe("פשר");
    expect(formatRootLabel("ענה I")).toBe("ענה I");
  });
});

const word = (wordId: number, strongNumber: number, wlcWord = "", nth = 0, book = "psalms", chapter = 1, verse = 1): WordProps => {
  const info = lookupRoot(book, chapter, verse, strongNumber, nth);
  return {
    wordId, strongNumber, wlcWord, chapter, verse, gloss: "", ETCBCgloss: "",
    motifData: { lemma: "", categories: [], ...info },
  } as unknown as WordProps;
};

const passageOf = (words: WordProps[]): PassageProps =>
  ({ stanzaProps: [{ strophes: [{ lines: [{ words }] }] }] }) as unknown as PassageProps;

describe("repeated-word grouping", () => {
  const seat = word(1, 4186);
  const sat = word(2, 3427);
  const help = word(3, 5828); // עֵזֶר 'help'
  const azariah = word(4, 5838);
  const lo1 = word(5, 0, "ל֖וֹ");
  const lo2 = word(6, 0, "לוֹ֙");
  const lahem = word(7, 0, "לָהֶם");
  const passage = passageOf([seat, sat, help, azariah, lo1, lo2, lahem]);

  it("double-click on a word selects every word sharing its root", () => {
    const groups = extractIdenticalWordsFromPassage(passage, true);
    expect(wordsInSameGroups(seat, groups, true).map((w) => w.wordId)).toEqual([1, 2]);
  });

  it("includes proper names when the names toggle is on, and not when off", () => {
    const withNames = extractIdenticalWordsFromPassage(passage, true);
    expect(wordsInSameGroups(help, withNames, true).map((w) => w.wordId)).toEqual([3, 4]);
    expect(wordsInSameGroups(azariah, withNames, true).map((w) => w.wordId)).toEqual([4, 3]);

    const withoutNames = extractIdenticalWordsFromPassage(passage, false);
    expect(wordsInSameGroups(help, withoutNames, false).map((w) => w.wordId)).toEqual([3]);
  });

  it("matches untagged words by spelling instead of lumping them together", () => {
    const groups = extractIdenticalWordsFromPassage(passage, true);
    expect(wordsInSameGroups(lo1, groups, true).map((w) => w.wordId)).toEqual([5, 6]);
  });
});
