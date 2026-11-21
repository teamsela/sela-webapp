import { BoxDisplayStyle, ColorActionType, StructureUpdateType } from "@/lib/types";
import type { PassageProps, StropheProps, WordProps } from "@/lib/data";

/*
  When can each toolbar button be used, and if it can't, why not?

  Every button asks one of these functions. A disabled button keeps its
  `reason` to show in its tooltip (on hover), when it is tapped or clicked
  (touch screens have no hover), and to screen readers. The rules are the
  ones the buttons always had; this module only names them.
*/

export type Availability = { enabled: boolean; reason?: string };

const OK: Availability = { enabled: true };
const no = (reason: string): Availability => ({ enabled: false, reason });

export const areWordsContiguous = (words: WordProps[]): boolean => {
  if (words.length <= 1) return true;
  const sorted = [...words].sort((a, b) => a.wordId - b.wordId);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].wordId !== sorted[i].wordId + 1) return false;
  }
  return true;
};

export const areStrophesContiguous = (strophes: StropheProps[]): boolean => {
  if (strophes.length <= 1) return true;
  const sorted = [...strophes].sort((a, b) => a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentLastWordId = sorted[i].lines.at(-1)?.words.at(-1)?.wordId;
    const nextFirstWordId = sorted[i + 1].lines[0].words[0].wordId;
    if (currentLastWordId === undefined || nextFirstWordId !== currentLastWordId + 1) return false;
  }
  return true;
};

/** The strophes that hold these words, in passage order, each once. */
export const strophesContainingWords = (words: WordProps[], passage: PassageProps): StropheProps[] => {
  const seen = new Set<string>();
  const out: StropheProps[] = [];
  [...words]
    .sort((a, b) => a.wordId - b.wordId)
    .forEach((w) => {
      const key = `${w.stanzaId}:${w.stropheId}`;
      const strophe = passage.stanzaProps[w.stanzaId]?.strophes[w.stropheId];
      if (strophe && !seen.has(key)) {
        seen.add(key);
        out.push(strophe);
      }
    });
  return out;
};

export type SelectionInput = {
  selectedWords: WordProps[];
  selectedStrophes: StropheProps[];
  numSelectedStrophes: number;
  passage: PassageProps;
};

/**
  The strophes a stanza button acts on: the strophes picked with their select
  icon, or else the strophes holding the selected words (so selecting a word
  is enough to move its strophe into a new stanza).
*/
export const stanzaTargets = (input: SelectionInput): { strophes: StropheProps[]; fromWords: boolean } => {
  const picked = input.selectedStrophes.filter(Boolean);
  if (input.numSelectedStrophes > 0 && picked.length > 0) return { strophes: picked, fromWords: false };
  if (input.selectedWords.length > 0) return { strophes: strophesContainingWords(input.selectedWords, input.passage), fromWords: true };
  return { strophes: [], fromWords: false };
};

const sortWords = (words: WordProps[]) => [...words].sort((a, b) => a.wordId - b.wordId);
const sortStrophes = (strophes: StropheProps[]) =>
  [...strophes].sort((a, b) => a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);

export const structureAvailability = (type: StructureUpdateType, input: SelectionInput): Availability => {
  const { selectedWords, selectedStrophes, passage } = input;
  const words = sortWords(selectedWords);
  const first = words[0];
  const last = words[words.length - 1];
  const strophes = sortStrophes(selectedStrophes.filter(Boolean));
  const oneStrophe = strophes.length === 1 ? strophes[0] : undefined;

  switch (type) {
    case StructureUpdateType.newLine: {
      if (!first) return no("Select the word that should start the new line.");
      const sameStrophe = words.every((w) => w.stropheId === first.stropheId && w.stanzaId === first.stanzaId);
      if (!sameStrophe) return no("Select words from a single strophe.");
      if (!areWordsContiguous(words)) return no("Select words that are next to each other.");
      const line = passage.stanzaProps[first.stanzaId]?.strophes[first.stropheId]?.lines[first.lineId];
      const sameLine = words.every((w) => w.lineId === first.lineId);
      if (sameLine && line && words.length === line.words.length) return no("These words already make up a whole line.");
      if (line && line.words[0]?.wordId === first.wordId) return no("This word already starts a line. Select a word later in the line.");
      return OK;
    }
    case StructureUpdateType.mergeWithPrevLine:
      if (!first) return no("Select a word in the line to merge.");
      if (first.lineId === 0) return no("This is the first line of its strophe. To join it to the strophe above, use Merge with previous strophe.");
      return OK;
    case StructureUpdateType.mergeWithNextLine: {
      if (!last) return no("Select a word in the line to merge.");
      const lineCount = passage.stanzaProps[last.stanzaId]?.strophes[last.stropheId]?.lines?.length ?? 0;
      if (last.lineId === lineCount - 1) return no("This is the last line of its strophe. To join it to the strophe below, use Merge with next strophe.");
      return OK;
    }
    case StructureUpdateType.newStrophe:
      if (!first) return no("Select the word where the new strophe should start.");
      if (!areWordsContiguous(words)) return no("Select words that are next to each other.");
      return OK;
    case StructureUpdateType.mergeWithPrevStrophe:
      if (first) return first.firstStropheInStanza ? no("This is the first strophe in its stanza. Strophes only merge within a stanza, so merge the stanzas first.") : OK;
      if (oneStrophe) return oneStrophe.firstStropheInStanza ? no("This is the first strophe in its stanza. Strophes only merge within a stanza, so merge the stanzas first.") : OK;
      if (strophes.length > 1) return no("Select just one strophe.");
      return no("Select a word, or a strophe with its select icon.");
    case StructureUpdateType.mergeWithNextStrophe:
      if (last) return last.lastStropheInStanza ? no("This is the last strophe in its stanza. Strophes only merge within a stanza, so merge the stanzas first.") : OK;
      if (oneStrophe) return oneStrophe.lastStropheInStanza ? no("This is the last strophe in its stanza. Strophes only merge within a stanza, so merge the stanzas first.") : OK;
      if (strophes.length > 1) return no("Select just one strophe.");
      return no("Select a word, or a strophe with its select icon.");
    case StructureUpdateType.newStanza:
    case StructureUpdateType.mergeWithPrevStanza:
    case StructureUpdateType.mergeWithNextStanza: {
      const targets = sortStrophes(stanzaTargets(input).strophes);
      if (targets.length === 0) return no("Select a strophe with its select icon, or a word in it.");
      if (passage.stropheCount <= 1) return no("The passage is one strophe so far. Make a new strophe first.");
      if (!areStrophesContiguous(targets)) return no("Select strophes that are next to each other.");
      const stanzaId = targets[0].lines[0].words[0].stanzaId ?? 0;
      if (type === StructureUpdateType.mergeWithPrevStanza && stanzaId <= 0) return no("This is the first stanza.");
      if (type === StructureUpdateType.mergeWithNextStanza && stanzaId >= passage.stanzaCount - 1) return no("This is the last stanza.");
      return OK;
    }
    default:
      return no("");
  }
};

export const colorAvailability = (
  action: ColorActionType,
  counts: { words: number; strophes: number; layers: number },
): Availability => {
  if (counts.words > 0 || counts.layers > 0) return OK;
  if (counts.strophes > 0) {
    return action === ColorActionType.textColor ? no("Text color applies to words. Select words instead of a strophe.") : OK;
  }
  return no("Select words or a strophe first.");
};

export const clearFormatAvailability = (counts: { words: number; strophes: number }): Availability =>
  counts.words > 0 || counts.strophes > 0 ? OK : no("Select the words or strophe to clear.");

export const clearAllAvailability = (hasCustomColor: boolean): Availability =>
  hasCustomColor ? OK : no("Nothing is colored yet.");

export const indentAvailability = (
  add: boolean,
  input: { boxStyle: BoxDisplayStyle | undefined; selectedCount: number; indent: number },
): Availability => {
  if (input.boxStyle !== BoxDisplayStyle.uniformBoxes) return no("Turn on Uniform width (the button beside this one) to indent words.");
  if (input.selectedCount !== 1) return no("Select exactly one word.");
  if (add && input.indent >= 3) return no("This word is at the most indent there is (3).");
  if (!add && input.indent <= 0) return no("This word has no indent to remove.");
  return OK;
};

export const editGlossAvailability = (input: { selectedCount: number; isHebrew: boolean; inViewMode: boolean }): Availability => {
  if (input.inViewMode) return no("Only the study's owner can edit the gloss.");
  if (input.isHebrew) return no("Switch to the English view (A) to edit the gloss.");
  if (input.selectedCount !== 1) return no("Select exactly one word.");
  return OK;
};

export const undoAvailability = (canUndo: boolean): Availability => (canUndo ? OK : no("Nothing to undo yet."));
export const redoAvailability = (canRedo: boolean): Availability => (canRedo ? OK : no("Nothing to redo."));
