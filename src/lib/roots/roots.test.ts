import { describe, expect, it } from "vitest";

const nfc = (s: string | undefined) => s?.normalize("NFC");

import { lookupRoot } from "./index";
import { PassageProps, WordProps } from "../data";
import { disambiguateGroupLabels, extractIdenticalWordsFromPassage, groupLabel, wordGroupKeys, wordsInSameGroups } from "../utils";

const root = (strong: number, book = "psalms", chapter = 1, verse = 1, nth = 0) =>
  lookupRoot(book, chapter, verse, strong, nth);
const rootId = (strong: number, book?: string, chapter?: number, verse?: number) => root(strong, book, chapter, verse).root?.id;

describe("lookupRoot", () => {
  it("groups a verb with its nouns (Ps 1:1 מוֹשָׁב 'seat' / יָשַׁב 'sit')", () => {
    expect(rootId(4186)).toBeDefined();
    expect(rootId(4186)).toBe(rootId(3427));
  });

  it("groups צַדִּיק, צֶדֶק, צָדֵק and צְדָקָה under צדק", () => {
    const ids = [6662, 6663, 6664, 6666].map((s) => rootId(s));
    expect(new Set(ids).size).toBe(1);
  });

  it("resolves homonyms per occurrence: ענה 'answer' vs ענה 'sing' (Exod 15:21)", () => {
    const answer = root(6030, "psalms", 3, 4).root;
    const sing = root(6030, "exodus", 15, 21).root;
    expect(answer?.gloss).toBe("answer");
    expect(sing?.gloss).toBe("sing");
    expect(answer?.id).not.toBe(sing?.id);
  });

  it("separates words with shared letters but unrelated meaning (עֵת 'time' vs עָנָה 'answer')", () => {
    expect(rootId(6256)).not.toBe(rootId(6030));
  });

  it("keeps meaning-linked borderline pairs together (אָדָם / אֲדָמָה) and splits others (שָׁנָה year / change)", () => {
    expect(rootId(120)).toBe(rootId(127));
    expect(rootId(8141)).not.toBe(rootId(8138));
  });

  it("joins Aramaic cognates with Hebrew roots (Aramaic תּוּב with שׁוּב 'return')", () => {
    expect(rootId(8421)).toBe(rootId(7725));
  });

  it("gives proper names the roots they are built from, ignoring divine elements", () => {
    const ids = (strong: number) => root(strong).nameRoots.map((r) => r.id);
    expect(ids(5838)).toContain(rootId(5826)); // Azariah → עזר 'help'
    expect(ids(3068)).toEqual([]); // יהוה is not linked to הָיָה
    expect(ids(3478)).not.toContain(rootId(410)); // Israel does not link to אֵל
  });

  it("leaves function words without a root (exact match only), with their dictionary form", () => {
    expect(root(3588).root).toBeUndefined(); // כִּי
    expect(nfc(root(3588).lemma)).toBe(nfc("כִּי"));
    expect(root(853).root).toBeUndefined(); // אֵת
  });
});

describe("chip labels", () => {
  it("shows the root with its shin/sin dot", () => {
    expect(nfc(root(3427).root?.label)).toBe(nfc("ישׁב")); // sit
    expect(nfc(root(8179).root?.label)).toBe(nfc("שׁער")); // gate
    expect(nfc(root(8181).root?.label)).toBe(nfc("שׂער")); // hair
  });

  it("names groups split off by meaning after their own word, not the parent root", () => {
    expect(root(1696).root?.label).toBe("דבר"); // speak
    expect(nfc(root(1698).root?.label)).toBe(nfc("דֶּבֶר")); // pestilence
    expect(nfc(root(4057).root?.label)).toBe(nfc("מִדְבָּר")); // wilderness
    expect(nfc(root(6256).root?.label)).toBe(nfc("עַתָּה")); // time, now (not ענה)
  });

  it("gives primary words without a verbal root their own form and gloss", () => {
    expect(nfc(root(1004).root?.label)).toBe(nfc("בַּיִת"));
    expect(root(1004).root?.gloss).toBe("house");
  });
});

const word = (wordId: number, strongNumber: number, wlcWord = "", book = "psalms", chapter = 1, verse = 1, nth = 0): WordProps => {
  const info = lookupRoot(book, chapter, verse, strongNumber, nth);
  return {
    wordId, strongNumber, wlcWord, chapter, verse, gloss: "", ETCBCgloss: "",
    motifData: { lemma: info.lemma ?? "", lemmaGloss: info.lemmaGloss, categories: [], root: info.root, nameRoots: info.nameRoots },
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

  it("labels a group by its root, even when only proper names carry it", () => {
    const groups = extractIdenticalWordsFromPassage(passage, true);
    const key = wordGroupKeys(seat, true)[0];
    const seatLabel = groupLabel(key, groups.get(key)!);
    expect(nfc(seatLabel.hebrew)).toBe(nfc("ישׁב"));
    expect(seatLabel.english).toBe("sit");

    const names = [word(10, 5838), word(11, 5838)]; // two Azariahs, no עֵזֶר
    const nameKey = wordGroupKeys(names[0], true).find((k) => k.startsWith("r"))!;
    expect(groupLabel(nameKey, names).hebrew).toBe("עזר");
  });

  it("labels exact-match groups with the dictionary form, not the inflected word", () => {
    const ki = [word(20, 3588, "כִּ֤י"), word(21, 3588, "כִּֽי")];
    const label = groupLabel("s3588", ki);
    expect(nfc(label.hebrew)).toBe(nfc("כִּי"));
    expect(label.english).toBe("that");
  });

  it("adds the homonym numeral only when two chips would otherwise read the same", () => {
    const answer = groupLabel(rootId(6030, "psalms", 3, 4)!, [word(30, 6030, "", "psalms", 3, 4)]);
    const sing = groupLabel(rootId(6030, "exodus", 15, 21)!, [word(31, 6030, "", "exodus", 15, 21)]);
    expect(answer.hebrew).toBe("ענה");
    const [a, s] = disambiguateGroupLabels([answer, sing]);
    expect(a.hebrew).toBe("ענה I");
    expect(nfc(s.hebrew)).toBe(nfc("עָנָה IV")); // "sing" is the only word under ענה IV, so its chip shows the word
    expect(disambiguateGroupLabels([answer])[0].hebrew).toBe("ענה");
  });
});

describe("English chip labels", () => {
  const withStepGloss = (w: WordProps, gloss: string): WordProps =>
    ({ ...w, wordInformation: { hebrew: "", transliteration: "", gloss, morphology: "", strongsNumber: "", meaning: "" } }) as WordProps;

  it("prefers the concise STEP gloss of the group's most frequent word in the passage", () => {
    const words = [withStepGloss(word(40, 3820), "heart"), withStepGloss(word(41, 3824), "heart"), withStepGloss(word(42, 3820), "heart")];
    const key = wordGroupKeys(words[0], true)[0];
    expect(groupLabel(key, words).english).toBe("heart");
  });

  it("falls back to the lexicon sense when no STEP gloss is loaded", () => {
    const words = [word(43, 3427), word(44, 3427)];
    expect(groupLabel(wordGroupKeys(words[0], true)[0], words).english).toBe("sit");
  });
});

describe("familiar forms", () => {
  it("shows plural-only nouns as they occur in the Bible, not the lexicon's unused singular", () => {
    expect(nfc(root(4325).root?.label)).toBe(nfc("מַיִם")); // water: BDB/STEP cite מַי
    expect(nfc(root(8064).root?.label)).toBe(nfc("שָׁמַיִם")); // no dagesh leaking in from הַשָּׁמַיִם
  });

  it("keeps ordinary dictionary forms", () => {
    expect(nfc(root(1004).root?.label)).toBe(nfc("בַּיִת"));
    expect(nfc(root(3117).root?.label)).toBe(nfc("יוֹם"));
  });
});
