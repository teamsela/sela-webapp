import { describe, expect, it } from "vitest";

const nfc = (s: string | undefined) => s?.normalize("NFC");

import { isCompoundWord, lookupRoot } from "./index";
import { PassageProps, WordProps } from "../data";
import { disambiguateGroupLabels, extractIdenticalWordsFromPassage, groupLabel, groupOccurrences, wordGroupKey, wordsInSameGroups } from "../utils";

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
    expect(answer?.gloss).toBe("to answer");
    expect(sing?.gloss).toBe("to sing");
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

  it("marks proper names, which get no root", () => {
    expect(root(5838).root).toBeUndefined(); // Azariah is not grouped with עזר 'help'
    expect(root(3478).root).toBeUndefined(); // Israel
    expect(root(3389).root).toBeUndefined(); // Jerusalem is not grouped with שָׁלוֹם
    expect(root(5838).isName).toBe(true);
    expect(root(1339).isName).toBe(true); // Bathsheba
    expect(root(3068).isName).toBeUndefined(); // God's name is a group of its own
    expect(root(430).isName).toBeUndefined();
  });

  it("knows which dictionary words are written as several words", () => {
    expect(isCompoundWord(516)).toBe(true); // אַל־תַּשְׁחֵת (psalm headings)
    expect(isCompoundWord(3304)).toBe(true); // יְפֵה־פִיָּה
    expect(isCompoundWord(3588)).toBe(false); // כִּי, though one sub-sense is כִּי אִם
    expect(isCompoundWord(6944)).toBe(false); // קֹדֶשׁ: קֹדֶשׁ הַקֳּדָשִׁים is two words
  });

  it("leaves function words without a root (exact match only), with their dictionary form", () => {
    expect(root(3588).root).toBeUndefined(); // כִּי
    expect(nfc(root(3588).lemma)).toBe(nfc("כִּי"));
    expect(root(853).root).toBeUndefined(); // אֵת
  });
});

describe("chip labels", () => {
  it("gives each root a pointed tooltip word: the verb's qatal when the verb is common", () => {
    expect(nfc(root(3427).root?.label)).toBe(nfc("יָשַׁב")); // sit: qal qatal
    expect(nfc(root(1696).root?.label)).toBe(nfc("דִּבֵּר")); // speak: piel dominates, textbook form (not דָּבַר, not דִּבֶּר)
    expect(nfc(root(7843).root?.label)).toBe(nfc("הִשְׁחִית")); // destroy: hiphil dominates, not BDB's unused qal
  });

  it("names a root by its verb by default, even when a noun is more common (סָפַר 'to count', not סֵפֶר 'book')", () => {
    expect(nfc(root(5612).root?.label)).toBe(nfc("סָפַר")); // סֵפֶר 'book' belongs to the family of סָפַר
    expect(root(5612).root?.gloss).toBe("to count");
    expect(nfc(root(4428).root?.label)).toBe(nfc("מָלַךְ")); // מֶלֶךְ 'king'
    expect(root(4428).root?.gloss).toBe("to reign");
  });

  it("keeps the noun where the verb is derived from it or too marginal (reviewed exceptions)", () => {
    expect(nfc(root(3820).root?.label)).toBe(nfc("לֵב")); // heart, not the rare verb לָבַב
    expect(root(3605).root?.gloss).toBe("all"); // כֹּל, not כָּלַל 'to complete'
    expect(root(7969).root?.gloss).toBe("three"); // not שָׁלַשׁ 'to do a third time'
    expect(nfc(root(68).root?.label)).toBe(nfc("אֶבֶן")); // stone: no verb
  });

  it("keeps homonyms' verbs apart: the 'bread' family is not named by לחם 'to fight'", () => {
    expect(nfc(root(3899).root?.label)).toBe(nfc("לֶחֶם"));
    expect(root(3899).root?.gloss).toBe("bread");
  });

  it("keeps the bare root, with shin/sin dot, for the tooltip", () => {
    expect(nfc(root(3427).root?.letters)).toBe(nfc("ישׁב"));
    expect(nfc(root(8179).root?.letters)).toBe(nfc("שׁער")); // gate
    expect(nfc(root(8181).root?.letters)).toBe(nfc("שׂער")); // hair / goat
  });

  it("names groups split off by meaning after their own word, not the parent root", () => {
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
    motifData: {
      lemma: info.lemma ?? "", lemmaGloss: info.lemmaGloss, lemmaQualifier: info.lemmaQualifier,
      categories: [], root: info.root, isName: info.isName,
    },
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
    const groups = extractIdenticalWordsFromPassage(passage);
    expect(wordsInSameGroups(seat, groups).map((w) => w.wordId)).toEqual([1, 2]);
  });

  it("leaves proper names out: not grouped with words of the same root, nor with themselves", () => {
    const groups = extractIdenticalWordsFromPassage(passage);
    expect(wordsInSameGroups(help, groups).map((w) => w.wordId)).toEqual([3]);
    expect(wordsInSameGroups(azariah, groups).map((w) => w.wordId)).toEqual([4]);
    expect(wordGroupKey(azariah)).toBeUndefined();
  });

  it("matches untagged words by spelling instead of lumping them together", () => {
    const groups = extractIdenticalWordsFromPassage(passage);
    expect(wordsInSameGroups(lo1, groups).map((w) => w.wordId)).toEqual([5, 6]);
  });

  it("labels a group by its root", () => {
    const groups = extractIdenticalWordsFromPassage(passage);
    const key = wordGroupKey(seat)!;
    const seatLabel = groupLabel(key, groups.get(key)!);
    expect(nfc(seatLabel.hebrew)).toBe(nfc("ישׁב")); // unpointed root on the chip
    expect(nfc(seatLabel.word)).toBe(nfc("יָשַׁב")); // pointed word in the tooltip
    expect(seatLabel.english).toBe("to sit");
  });

  it("makes no chip for a repeated name, nor for a name written as two words (Ps 51:1 בַּת־שָׁבַע)", () => {
    const azariahs = passageOf([word(10, 5838), word(11, 5838)]);
    expect(extractIdenticalWordsFromPassage(azariahs).size).toBe(0);
    const bathsheba = passageOf([word(12, 1339, "בַּת־", "psalms", 51, 1), word(13, 1339, "שָֽׁבַע׃", "psalms", 51, 1, 1)]);
    expect(extractIdenticalWordsFromPassage(bathsheba).size).toBe(0);
  });

  it("counts a word written as several words once (Ps 57:1 אַל־תַּשְׁחֵת)", () => {
    const parts = [word(14, 516, "אַל־", "psalms", 57, 1), { ...word(15, 516, "תַּשְׁחֵת", "psalms", 57, 1, 1) }];
    parts[1].motifData = { ...parts[1].motifData!, compoundPart: true };
    const groups = extractIdenticalWordsFromPassage(passageOf(parts));
    const words = groups.get(wordGroupKey(parts[0])!)!;
    expect(words.map((w) => w.wordId)).toEqual([14, 15]); // double-click still selects both parts
    expect(groupOccurrences(words)).toBe(1); // but it is one occurrence: no chip
  });

  it("labels exact-match groups with the dictionary form, not the inflected word", () => {
    const ki = [word(20, 3588, "כִּ֤י"), word(21, 3588, "כִּֽי")];
    const label = groupLabel("s3588", ki);
    expect(nfc(label.hebrew)).toBe(nfc("כי"));
    expect(nfc(label.word)).toBe(nfc("כִּי"));
    expect(label.english).toBe("for");
  });

  it("adds the homonym numeral only when two chips would otherwise read the same", () => {
    const answer = groupLabel(rootId(6030, "psalms", 3, 4)!, [word(30, 6030, "", "psalms", 3, 4)]);
    const sing = groupLabel(rootId(6030, "exodus", 15, 21)!, [word(31, 6030, "", "exodus", 15, 21)]);
    expect(nfc(answer.hebrew)).toBe(nfc("ענה"));
    const [a, s] = disambiguateGroupLabels([answer, sing]);
    expect(nfc(a.hebrew)).toBe(nfc("ענה I"));
    expect(nfc(s.hebrew)).toBe(nfc("ענה IV"));
    expect(nfc(disambiguateGroupLabels([answer])[0].hebrew)).toBe(nfc("ענה"));
  });
});

describe("English chip labels", () => {
  const withStepGloss = (w: WordProps, gloss: string): WordProps =>
    ({ ...w, wordInformation: { hebrew: "", transliteration: "", gloss, morphology: "", strongsNumber: "", meaning: "" } }) as WordProps;

  it("uses the root data's label, not the STEP lookup (which cannot tell senses apart)", () => {
    // Gen 1:9 יִקָּווּ: STEP's first entry for H6960 is 'to await', but the word is קוה II 'gather'
    const words = [withStepGloss(word(40, 6960, "", "genesis", 1, 9), "to await"), withStepGloss(word(41, 4723, "", "genesis", 1, 10), "hope")];
    const label = groupLabel(wordGroupKey(words[0])!, words);
    expect(label.english).toBe(root(6960, "genesis", 1, 9).root?.gloss);
    expect(label.english).not.toBe("to await");
  });

  it("tells apart chips with the same English label in English, never with Hebrew", () => {
    const a = { hebrew: "קבץ", english: "to gather", qualifier: "assemble" };
    const b = { hebrew: "לקט", english: "to gather", qualifier: "harvest" };
    const [x, y] = disambiguateGroupLabels([a, b]);
    expect(x.english).toBe("to gather (assemble)");
    expect(y.english).toBe("to gather (harvest)");
    expect(disambiguateGroupLabels([a])[0].english).toBe("to gather");
    const noQualifier = disambiguateGroupLabels([{ hebrew: "א", english: "x" }, { hebrew: "ב", english: "x" }]);
    noQualifier.forEach((l) => expect(l.english).not.toMatch(/[\u0590-\u05FF]/));
  });

  it("never falls back to Hebrew for the English label", () => {
    const untagged = [word(42, 0, "לוֹ"), word(43, 0, "לוֹ")];
    const label = groupLabel(wordGroupKey(untagged[0])!, untagged);
    expect(label.english).not.toMatch(/[\u0590-\u05FF]/);
  });

  it("uses the reviewed plain-English labels (טוב 'good', not BDB's first sense 'pleasant')", () => {
    expect(root(2896).root?.gloss).toBe("to be good");
    expect(root(1984).root?.gloss).toBe("to praise");
    expect(root(3820).root?.gloss).toBe("heart");
    expect(root(6960, "genesis", 1, 9).root?.gloss).toBe("to gather");
    expect(root(853).lemmaGloss).toBe("object marker");
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

describe("unpointed chip labels", () => {
  it("strips vowels, dagesh and accents but keeps the shin/sin dot", async () => {
    const { unpointed } = await import("../utils");
    expect(nfc(unpointed("שָׁמַיִם"))).toBe(nfc("שׁמים"));
    expect(nfc(unpointed("שְׂעֹרָה"))).toBe(nfc("שׂערה"));
    expect(unpointed("כִּֽי")).toBe("כי");
    expect(unpointed("וּבְמוֹשַׁב")).toBe(nfc("ובמושׁב"));
  });
});

describe("divine names", () => {
  it("puts יהוה, יָהּ and יֱהוִה in one group labelled Yahweh", () => {
    expect(rootId(3050)).toBe(rootId(3068));
    expect(rootId(3069)).toBe(rootId(3068));
    const words = [word(50, 3068), word(51, 3050)];
    const label = groupLabel(wordGroupKey(words[0])!, words);
    expect(label.hebrew).toBe("יהוה");
    expect(label.english).toBe("Yahweh");
  });

  it("shows the divine titles in common English: אֱלֹהִים is God", () => {
    const withStepGloss = (w: WordProps, gloss: string): WordProps =>
      ({ ...w, wordInformation: { hebrew: "", transliteration: "", gloss, morphology: "", strongsNumber: "", meaning: "" } }) as WordProps;
    const elohim = [withStepGloss(word(60, 430), "God"), withStepGloss(word(61, 430), "God")];
    expect(groupLabel(wordGroupKey(elohim[0])!, elohim).english).toBe("God");
  });

  it("puts אֱלֹהִים, אֵל, אֱלוֹהַּ and Aramaic אֱלָהּ in one group, shown as the full word אלהים", () => {
    expect(new Set([430, 410, 433, 426].map((s) => rootId(s))).size).toBe(1);
    const words = [word(62, 430), word(63, 410)];
    const label = groupLabel(wordGroupKey(words[0])!, words);
    expect(label.hebrew).toBe("אלהים"); // not the bare letters אלה, which read as אֵלֶּה 'these'
    expect(label.english).toBe("God");
    expect(rootId(428)).toBeUndefined(); // אֵלֶּה 'these' stays its own word
  });
});

describe("label cleanup", () => {
  it("drops the invisible joiner some source words carry (ירושׁלם)", async () => {
    const { unpointed } = await import("../utils");
    expect(unpointed("יְרוּשָׁלִַ͏ם")).toBe("ירושׁלם".normalize("NFC"));
    expect(root(3389).lemma).not.toContain("͏");
  });
});
