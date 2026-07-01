import { WordProps } from "@/lib/data";
import {
  splitHebrewClusters,
  splitTransliterationSegments,
} from "@/lib/hebrewHighlights";

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
  | { mode: "adjacent"; focusStropheId: number; radius?: number };

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

// Normalise final letter forms to their base id so ק≈ק and צ≈ץ match, and the
// rare-letter test works uniformly.
const FINAL_FORM_TO_BASE: Record<string, string> = {
  "final-kaf": "kaf",
  "final-mem": "mem",
  "final-nun": "nun",
  "final-tsadi": "tsadi",
};

const normalizeLetterId = (letterId: string): string =>
  FINAL_FORM_TO_BASE[letterId] ?? letterId;

/**
 * The consonant sound-ids of a word's **conjugated form**, vowels ignored.
 * Prefers the passage transliteration (matches what the user sees / hears); falls
 * back to deriving sounds from the pointed Hebrew (`wlcWord`).
 */
export const wordSoundIds = (word: WordProps): string[] => {
  const transliteration =
    word.passageTransliteration || word.wordInformation?.transliteration || "";
  if (transliteration) {
    return splitTransliterationSegments(transliteration)
      .map((segment) => segment.highlightId)
      .filter((id): id is string => Boolean(id));
  }

  return splitHebrewClusters(word.wlcWord || "").flatMap(
    (cluster) => cluster.soundIds,
  );
};

/**
 * The Hebrew letter-ids of a word's **unconjugated / lexical form** (lemma),
 * normalised so final forms match their base. Falls back to the conjugated
 * `wlcWord` only when no lemma is available.
 */
export const wordLetterIds = (word: WordProps): string[] => {
  const lexical = word.motifData?.lemma || word.wlcWord || "";
  return splitHebrewClusters(lexical)
    .map((cluster) => cluster.letterId)
    .filter((id): id is string => Boolean(id))
    .map(normalizeLetterId);
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

/** Extract the part of speech from an OSHB-style morphology code (e.g. "HVqp3ms" → "V"). */
const partOfSpeech = (morphology?: string): string | null => {
  if (!morphology) return null;
  // Strip a leading language marker (H = Hebrew, A = Aramaic) then take the POS code.
  const body = /^[HA]/.test(morphology) ? morphology.slice(1) : morphology;
  return body.charAt(0) || null;
};

/** The leading preposition prefix letter of the conjugated form, if any. */
const prepositionPrefix = (word: WordProps): string | null => {
  const clusters = splitHebrewClusters(word.wlcWord || "");
  const first = clusters[0]?.text ?? "";
  // The base letter is the first Hebrew character of the cluster.
  const baseLetter = Array.from(first).find((ch) => /\p{Script=Hebrew}/u.test(ch));
  return baseLetter && PREPOSITION_LETTERS.has(baseLetter) ? baseLetter : null;
};

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

  // Proximity: same or adjacent strophe.
  if (Math.abs(a.stropheId - b.stropheId) <= 1) {
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
  return words.filter(
    (word) => Math.abs(word.stropheId - scope.focusStropheId) <= radius,
  );
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
  const candidates: WordplayCandidate[] = [];

  for (let i = 0; i < scoped.length; i++) {
    for (let j = i + 1; j < scoped.length; j++) {
      const wordA = scoped[i];
      const wordB = scoped[j];
      if (isSameWord(wordA, wordB)) {
        continue;
      }
      const shared = sharedMultiset(soundIds[i], soundIds[j]);
      if (!isSoundplayMatch(shared.length)) {
        continue;
      }
      const openA = firstLast(letterIds[i]);
      const openB = firstLast(letterIds[j]);
      candidates.push({
        tool: "soundplay",
        wordA,
        wordB,
        sharedIds: shared,
        sharedCount: shared.length,
        strongMatch: shared.length >= SOUNDPLAY_STRONG_SHARED,
        sameOpening: Boolean(openA.first) && openA.first === openB.first,
        sameEnding: Boolean(openA.last) && openA.last === openB.last,
        secondaryTags: computeSecondaryTags(wordA, wordB),
      });
    }
  }

  return candidates;
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
  const candidates: WordplayCandidate[] = [];

  for (let i = 0; i < scoped.length; i++) {
    for (let j = i + 1; j < scoped.length; j++) {
      const wordA = scoped[i];
      const wordB = scoped[j];
      if (isSameWord(wordA, wordB)) {
        continue;
      }
      const shared = sharedMultiset(letterIds[i], letterIds[j]);
      if (!isWordplayMatch(shared)) {
        continue;
      }
      const openA = firstLast(letterIds[i]);
      const openB = firstLast(letterIds[j]);
      candidates.push({
        tool: "wordplay",
        wordA,
        wordB,
        sharedIds: shared,
        sharedCount: shared.length,
        strongMatch: shared.length >= WORDPLAY_STRONG_SHARED,
        sameOpening: Boolean(openA.first) && openA.first === openB.first,
        sameEnding: Boolean(openA.last) && openA.last === openB.last,
        secondaryTags: computeSecondaryTags(wordA, wordB),
      });
    }
  }

  return candidates;
};

/** Dispatch to the correct generator for the selected tool. */
export const findCandidates = (
  words: WordProps[],
  tool: WordplayTool,
  options?: WordplayOptions,
): WordplayCandidate[] =>
  tool === "soundplay"
    ? findSoundplayCandidates(words, options)
    : findWordplayCandidates(words, options);
