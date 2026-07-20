import { WordProps } from "@/lib/data";
import {
  normalizeHebrewLetterId,
  splitHebrewClusters,
  splitTransliterationSegments,
} from "@/lib/hebrewHighlights";
import { transliterateHebrew } from "@/lib/transliterate";

/**
 * Wordplay / Soundplay candidate engine (pure logic).
 *
 * Implements the two sibling detectors described in the Wordplay requirements
 * (Sela Mockup 2026, pp. 29–37, 106):
 *
 *  - **Soundplay** — "Shared Hebrew Sounds". Compares the transliterated
 *    consonant *sounds* of the **conjugated form** (the word as it appears in the
 *    passage). Vowels are ignored (they encode grammar, not word-play). A pair is
 *    a candidate when it shares **4 or more** sounds. Duplicate sounds count
 *    individually.
 *
 *  - **Wordplay** — "Shared Hebrew Letters". Compares the Hebrew letters of the
 *    **unconjugated (lexical / dictionary) form** (the lemma). A pair is a
 *    candidate when it shares **3 letters (any)**, OR **2 letters where at least
 *    one is a "rare" letter** (and the pair is not a double-match of the "common"
 *    letters).
 *
 * Both tools exclude same-word pairs (identical Strong's number) and can surface
 * secondary confidence tags (same part of speech, same preposition, proximity).
 *
 * This module implements planning §Phase 2 (candidate engine) and is intentionally
 * free of React / DOM dependencies so it can be unit-tested in isolation.
 */

export type WordplayTool = "soundplay" | "wordplay";

export type SecondaryTag = "same-pos" | "same-preposition" | "proximity";

export type WordplayCandidate = {
  tool: WordplayTool;
  wordA: WordProps;
  wordB: WordProps;
  /** Shared sound-ids (soundplay) or letter-ids (wordplay), with multiplicity. */
  sharedIds: string[];
  /** Number of shared sounds/letters counted with multiplicity. */
  sharedCount: number;
  /** True when the shared count met the higher generator tier (5 sounds / 3 letters). */
  strongMatch: boolean;
  /** Same first lexical letter (primary "similar opening" tag). */
  sameOpening: boolean;
  /** Same last lexical letter (primary "similar endings" tag). */
  sameEnding: boolean;
  secondaryTags: SecondaryTag[];
};

export type WordplayScope =
  | { mode: "whole" }
  | {
      mode: "adjacent";
      focusStanzaId: number;
      focusStropheId: number;
      radius?: number;
    };

export type WordplayOptions = {
  scope?: WordplayScope;
};

// Rare / common letter ids per the deck (p29, p35, p37). Rare letters make a
// 2-letter match significant; a double-match of only common letters does not.
// ש is split into sin (שׂ, rare) and shin (שׁ, not rare).
export const RARE_LETTER_IDS = new Set<string>([
  "het", // ח
  "ayin", // ע
  "tet", // ט
  "zayin", // ז
  "tsadi", // צ
  "qof", // ק
  "sin", // שׂ
]);

export const COMMON_LETTER_IDS = new Set<string>([
  "aleph", // א
  "he", // ה
  "vav", // ו
  "yod", // י
]);

// Hebrew preposition prefixes recognised as a secondary tag (b/l/k/m → ב ל כ מ).
const PREPOSITION_LETTERS = new Set<string>(["ב", "ל", "כ", "מ"]);

// Generator thresholds (p29). Exposed so tests / UI can reference them.
export const SOUNDPLAY_MIN_SHARED = 4;
export const SOUNDPLAY_STRONG_SHARED = 5;
export const WORDPLAY_MIN_SHARED = 2;
export const WORDPLAY_STRONG_SHARED = 3;

const conjugatedTransliteration = (word: WordProps): string =>
  word.passageTransliteration || transliterateHebrew(word.wlcWord || "");

/**
 * The consonant sound-ids of a word's **conjugated form**, vowels ignored.
 *
 * Always derived from the **transliteration** so the result is deterministic and
 * matches the deck's "transliterated consonant sounds" rule: it uses the passage
 * transliteration when present, otherwise transliterates the pointed Hebrew.
 * (Previously it could fall back to raw Hebrew clusters, which disagreed with the
 * transliteration on matres lectionis — e.g. a vowel yod — making results depend
 * on whether a transliteration happened to be stored.)
 *
 * The Tetragrammaton (H3068) is a qere perpetuum — pronounced "Adonai" — so its
 * written letters carry no sound; it contributes none, mirroring WordBlock.
 */
export const wordSoundIds = (word: WordProps): string[] => {
  if (Math.trunc(word.strongNumber || 0) === 3068) {
    return [];
  }

  const transliteration = conjugatedTransliteration(word);

  return splitTransliterationSegments(transliteration).flatMap((segment) =>
    segment.highlightId
      ? Array(segment.occurrences ?? 1).fill(segment.highlightId)
      : [],
  );
};

/**
 * The Hebrew letter-ids of a word's **unconjugated / lexical form**, normalised so
 * final forms match their base.
 *
 * CRITICAL (deck p36): Wordplay must compare the *unconjugated lexical* letters,
 * never the conjugated `wlcWord` (which carries prefixes/suffixes). We prefer the
 * motif lemma, then the StepBible dictionary/citation form (broadly available per
 * Strong number, unlike the motif-gated lemma), and if neither is available we
 * return an **empty list** rather than falling back to the conjugated form — a
 * word with no lexical form simply cannot participate in Wordplay letter matching.
 *
 * The input is NFKD-normalised first so Hebrew presentation forms / ligatures
 * (e.g. U+FB2A שׁ, U+FB4F אל) decompose into their constituent base letters
 * instead of being collapsed or dropped.
 */
export const wordLetterIds = (word: WordProps): string[] => {
  const lemma = word.motifData?.lemma?.trim();
  let lexical = lemma || "";
  if (!lexical) {
    // The data layer records whether this is a genuine StepBible lexical form or
    // its passage-text fallback. Older serialized data lacks the source marker,
    // so retain the value comparison as a conservative compatibility guard.
    const hebrew = word.wordInformation?.hebrew?.trim();
    const source = word.wordInformation?.hebrewSource;
    const wlc = word.wlcWord?.trim();
    const isLexical = source === "lexical" || (source === undefined && hebrew !== wlc);
    if (hebrew && isLexical) {
      lexical = hebrew;
    }
  }
  if (!lexical) {
    return [];
  }
  return splitHebrewClusters(lexical.normalize("NFKD"))
    .map((cluster) => cluster.letterId)
    .filter((id): id is string => Boolean(id))
    .map(normalizeHebrewLetterId);
};

/**
 * Multiset intersection of two id lists: for every id, the number of shared
 * occurrences is min(countA, countB). Duplicate ids therefore count individually
 * (e.g. two mem in each word yield two shared mem).
 */
export const sharedMultiset = (a: string[], b: string[]): string[] => {
  const countB = new Map<string, number>();
  b.forEach((id) => countB.set(id, (countB.get(id) ?? 0) + 1));

  const shared: string[] = [];
  a.forEach((id) => {
    const remaining = countB.get(id) ?? 0;
    if (remaining > 0) {
      shared.push(id);
      countB.set(id, remaining - 1);
    }
  });
  return shared;
};

/** A pair must not be the same word (same Strong's number). */
const isSameWord = (a: WordProps, b: WordProps): boolean =>
  a.strongNumber === b.strongNumber;

/**
 * Extract the part of speech from an OSHB-style morphology code. Morphology is a
 * language marker (H/A) followed by one or more `/`-separated morphemes, with
 * prefixes first and pronominal suffixes last (e.g. "HR/Ncmsa" = preposition +
 * common noun, "HNcmsc/Sp3ms" = common noun + suffix).
 */
const parseMorphology = (
  morphology?: string,
): { morphemes: string[]; lexicalIndex: number } | null => {
  if (!morphology) return null;
  const body = /^[HA]/.test(morphology) ? morphology.slice(1) : morphology;
  const morphemes = body.split("/").filter(Boolean);
  if (morphemes.length === 0) return null;

  const isPrefix = (morpheme: string) =>
    morpheme === "C" || morpheme === "R" || morpheme.startsWith("Td");
  const lexicalIndex = morphemes.findIndex(
    (morpheme) => !isPrefix(morpheme) && !morpheme.startsWith("S"),
  );

  return {
    morphemes,
    lexicalIndex:
      lexicalIndex >= 0
        ? lexicalIndex
        : morphemes.findIndex((morpheme) => !morpheme.startsWith("S")),
  };
};

const partOfSpeech = (morphology?: string): string | null => {
  const parsed = parseMorphology(morphology);
  return parsed && parsed.lexicalIndex >= 0
    ? parsed.morphemes[parsed.lexicalIndex]?.charAt(0) || null
    : null;
};

/**
 * The leading preposition prefix letter (ב ל כ מ) of the conjugated form, if the
 * morphology confirms a prefixed preposition morpheme (OSHB code "R" among the
 * prefix morphemes — everything before the final "word" morpheme). Requiring the
 * morphology marker avoids false positives where the first letter is a root
 * letter. Handles multi-prefix stacks (e.g. "HC/R/Ncmsa" = waw + preposition).
 * When morphology is absent we conservatively report no preposition.
 */
const prepositionPrefix = (word: WordProps): string | null => {
  const morphology = word.morphology;
  const parsed = parseMorphology(morphology);
  if (!parsed || parsed.lexicalIndex < 0) return null;

  const prepositionIndex = parsed.morphemes
    .slice(0, parsed.lexicalIndex)
    .findIndex((morpheme) => morpheme === "R");
  if (prepositionIndex < 0) {
    return null;
  }

  const clusters = splitHebrewClusters(word.wlcWord || "");
  const cluster = clusters[prepositionIndex]?.text ?? "";
  const baseLetter = Array.from(cluster).find((ch) => /\p{Script=Hebrew}/u.test(ch));
  return baseLetter && PREPOSITION_LETTERS.has(baseLetter) ? baseLetter : null;
};

// Two words are in the same or an adjacent strophe. NOTE: word.stropheId is a
// PER-STANZA index (it resets to 0 in every stanza), so proximity is only
// meaningful within the same stanza — comparing raw stropheIds across stanzas
// would wrongly treat e.g. stanza 0 strophe 2 and stanza 3 strophe 2 as the same
// strophe. We therefore require the same stanza and an adjacent strophe index.
const inProximity = (a: WordProps, b: WordProps): boolean =>
  a.stanzaId === b.stanzaId && Math.abs(a.stropheId - b.stropheId) <= 1;

const computeSecondaryTags = (a: WordProps, b: WordProps): SecondaryTag[] => {
  const tags: SecondaryTag[] = [];

  const posA = partOfSpeech(a.morphology);
  const posB = partOfSpeech(b.morphology);
  if (posA && posB && posA === posB) {
    tags.push("same-pos");
  }

  const prepA = prepositionPrefix(a);
  const prepB = prepositionPrefix(b);
  if (prepA && prepB && prepA === prepB) {
    tags.push("same-preposition");
  }

  if (inProximity(a, b)) {
    tags.push("proximity");
  }

  return tags;
};

const firstLast = (ids: string[]): { first?: string; last?: string } => ({
  first: ids[0],
  last: ids[ids.length - 1],
});

/** Whether a shared-sound multiset meets the Soundplay generator threshold. */
export const isSoundplayMatch = (sharedCount: number): boolean =>
  sharedCount >= SOUNDPLAY_MIN_SHARED;

/**
 * Whether a set of shared lexical letters meets the Wordplay generator rule:
 *  - 3+ shared letters (any), OR
 *  - exactly 2 shared where at least one is a "rare" letter (and not a double
 *    match of only common letters).
 */
export const isWordplayMatch = (sharedIds: string[]): boolean => {
  const count = sharedIds.length;
  if (count >= WORDPLAY_STRONG_SHARED) {
    return true;
  }
  if (count === WORDPLAY_MIN_SHARED) {
    const hasRare = sharedIds.some((id) => RARE_LETTER_IDS.has(id));
    const allCommon = sharedIds.every((id) => COMMON_LETTER_IDS.has(id));
    return hasRare && !allCommon;
  }
  return false;
};

const filterByScope = (
  words: WordProps[],
  scope?: WordplayScope,
): WordProps[] => {
  if (!scope || scope.mode === "whole") {
    return words;
  }
  const radius = scope.radius ?? 2;
  // stropheId is per-stanza, so the ±N window is scoped within the focus stanza
  // (comparing raw stropheIds across stanzas would be meaningless — see inProximity).
  return words.filter(
    (word) =>
      word.stanzaId === scope.focusStanzaId &&
      Math.abs(word.stropheId - scope.focusStropheId) <= radius,
  );
};

const findPairCandidates = (
  scoped: WordProps[],
  comparisonIds: string[][],
  letterIds: string[][],
  tool: WordplayTool,
  isMatch: (shared: string[]) => boolean,
  strongThreshold: number,
): WordplayCandidate[] => {
  const candidates: WordplayCandidate[] = [];

  for (let i = 0; i < scoped.length; i++) {
    for (let j = i + 1; j < scoped.length; j++) {
      const wordA = scoped[i];
      const wordB = scoped[j];
      if (isSameWord(wordA, wordB)) {
        continue;
      }

      const shared = sharedMultiset(comparisonIds[i], comparisonIds[j]);
      if (!isMatch(shared)) {
        continue;
      }

      const openA = firstLast(letterIds[i]);
      const openB = firstLast(letterIds[j]);
      candidates.push({
        tool,
        wordA,
        wordB,
        sharedIds: shared,
        sharedCount: shared.length,
        strongMatch: shared.length >= strongThreshold,
        sameOpening: Boolean(openA.first) && openA.first === openB.first,
        sameEnding: Boolean(openA.last) && openA.last === openB.last,
        secondaryTags: computeSecondaryTags(wordA, wordB),
      });
    }
  }

  return candidates;
};

/**
 * Soundplay: candidate pairs sharing 4+ transliterated consonant sounds
 * (conjugated form, vowels ignored, duplicates counted individually).
 */
export const findSoundplayCandidates = (
  words: WordProps[],
  options?: WordplayOptions,
): WordplayCandidate[] => {
  const scoped = filterByScope(words, options?.scope);
  const soundIds = scoped.map((word) => wordSoundIds(word));
  const letterIds = scoped.map((word) => wordLetterIds(word));
  return findPairCandidates(
    scoped,
    soundIds,
    letterIds,
    "soundplay",
    (shared) => isSoundplayMatch(shared.length),
    SOUNDPLAY_STRONG_SHARED,
  );
};

/**
 * Wordplay: candidate pairs sharing lexical letters per the 3-any / 2-with-rare
 * rule (unconjugated lemma letters).
 */
export const findWordplayCandidates = (
  words: WordProps[],
  options?: WordplayOptions,
): WordplayCandidate[] => {
  const scoped = filterByScope(words, options?.scope);
  const letterIds = scoped.map((word) => wordLetterIds(word));
  return findPairCandidates(
    scoped,
    letterIds,
    letterIds,
    "wordplay",
    isWordplayMatch,
    WORDPLAY_STRONG_SHARED,
  );
};

/**
 * Rank candidates for display: strongest first — more shared sounds/letters, then
 * more secondary confidence tags, then the higher generator tier.
 */
export const rankCandidates = (
  candidates: WordplayCandidate[],
): WordplayCandidate[] =>
  [...candidates].sort((a, b) => {
    if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
    if (b.secondaryTags.length !== a.secondaryTags.length)
      return b.secondaryTags.length - a.secondaryTags.length;
    return Number(b.strongMatch) - Number(a.strongMatch);
  });

/** Dispatch to the correct generator for the selected tool, ranked for display. */
export const findCandidates = (
  words: WordProps[],
  tool: WordplayTool,
  options?: WordplayOptions,
): WordplayCandidate[] =>
  rankCandidates(
    tool === "soundplay"
      ? findSoundplayCandidates(words, options)
      : findWordplayCandidates(words, options),
  );
