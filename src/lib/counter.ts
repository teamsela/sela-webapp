import { StropheProps, WordProps } from "./data";
import { ACCENT_CODEPOINTS } from "./poeticAccents";
import { StudyNotes } from "./types";

// In-text counter display mode.
export type CounterMode = "words" | "units";

/**
 * The strophe note title shown on a strophe, resolving the same precedence the
 * passage uses: prefer the active layer's per-strophe note, fall back to the
 * root `strophes` array only for layer 0 (legacy/migration). Returns "" when
 * there is no usable title. Shared by StropheBlock (which renders it) and the
 * in-text counter column (which reserves matching vertical space for it) so the
 * two stay in lockstep.
 */
export const readStropheNoteTitle = (
  studyNotes: string | undefined,
  activeLayerId: number,
  stropheId: number,
): string => {
  if (!studyNotes) return "";
  try {
    const parsed = JSON.parse(studyNotes) as Partial<StudyNotes> | null;
    const layerKey = String(activeLayerId);
    const layerStrophe = parsed?.layerStrophes?.[layerKey]?.[stropheId];
    const rootStrophe =
      activeLayerId === 0 && Array.isArray(parsed?.strophes)
        ? parsed!.strophes![stropheId]
        : undefined;
    const note = layerStrophe ?? rootStrophe;
    if (note && typeof note.title === "string" && note.title.trim().length > 0) {
      return note.title;
    }
  } catch {
    // ignore malformed study notes payloads
  }
  return "";
};

// Maqqef (U+05BE) joins a word to the one after it into a single prosodic unit.
// Reused from the poetic-accent scanner so there is one source of truth.
const MAQQEF = ACCENT_CODEPOINTS.MAQQEF;

/** True when the trimmed Hebrew text ends with a maqqef (leans on the next word). */
export const endsWithMaqqef = (hebrew?: string): boolean => {
  const trimmed = (hebrew ?? "").trim();
  return trimmed.length > 0 && trimmed.charCodeAt(trimmed.length - 1) === MAQQEF;
};

/**
 * Count for one line.
 *  - "words": one per word box (`words.length`).
 *  - "units": prosodic units — words joined by a maqqef count once. A word
 *    ending in a maqqef leans forward and is omitted; the word that finally
 *    carries the beat is counted (handles chains longer than two words).
 */
export const countLineUnits = (words: WordProps[], mode: CounterMode): number => {
  if (mode === "units") {
    return words.reduce((total, word) => (endsWithMaqqef(word.wlcWord) ? total : total + 1), 0);
  }
  return words.length;
};

// (stanzaId, stropheId, lineId) on a word are parent-scoped indices, so the
// triple uniquely identifies a line across the whole passage.
const lineKey = (word: WordProps): string => `${word.stanzaId}:${word.stropheId}:${word.lineId}`;

// The words the current selection contributes: individually selected words plus
// every word inside any selected strophe. Selection is normally either words or
// strophes (they clear each other), but taking the union keeps the counts right
// regardless.
const collectSelectedWords = (
  selectedWords: WordProps[],
  selectedStrophes: StropheProps[],
): WordProps[] => {
  const words = [...selectedWords];
  selectedStrophes.forEach((strophe) =>
    strophe.lines.forEach((line) => line.words.forEach((word) => words.push(word))),
  );
  return words;
};

/** Number of distinct words in the selection (by wordId). */
export const countSelectedWords = (
  selectedWords: WordProps[],
  selectedStrophes: StropheProps[],
): number => {
  const ids = new Set<number>();
  collectSelectedWords(selectedWords, selectedStrophes).forEach((word) => ids.add(word.wordId));
  return ids.size;
};

/**
 * Number of distinct lines the selection touches. A line counts if it contains
 * at least one selected word (even if only partly selected); a selected strophe
 * contributes all of its lines.
 */
export const countSelectedLines = (
  selectedWords: WordProps[],
  selectedStrophes: StropheProps[],
): number => {
  const lines = new Set<string>();
  collectSelectedWords(selectedWords, selectedStrophes).forEach((word) => lines.add(lineKey(word)));
  return lines.size;
};
