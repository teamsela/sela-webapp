import { describe, expect, it } from "vitest";

import { BoxDisplayStyle, ColorActionType, StructureUpdateType as T } from "@/lib/types";
import {
  colorAvailability,
  editGlossAvailability,
  indentAvailability,
  stanzaTargets,
  structureAvailability,
  type SelectionInput,
} from "./toolbarAvailability";

/*
  A small passage: stanza 0 has strophes A (lines [1 2 3], [4 5]) and
  B (line [6 7]); stanza 1 has strophe C (line [8 9]).
*/
const word = (wordId: number, stanzaId: number, stropheId: number, lineId: number, firstStrophe: boolean, lastStrophe: boolean) =>
  ({ wordId, stanzaId, stropheId, lineId, firstStropheInStanza: firstStrophe, lastStropheInStanza: lastStrophe }) as any;
const W: Record<number, any> = {
  1: word(1, 0, 0, 0, true, false), 2: word(2, 0, 0, 0, true, false), 3: word(3, 0, 0, 0, true, false),
  4: word(4, 0, 0, 1, true, false), 5: word(5, 0, 0, 1, true, false),
  6: word(6, 0, 1, 0, false, true), 7: word(7, 0, 1, 0, false, true),
  8: word(8, 1, 0, 0, true, true), 9: word(9, 1, 0, 0, true, true),
};
const A = { stropheId: 0, firstStropheInStanza: true, lastStropheInStanza: false, lines: [{ words: [W[1], W[2], W[3]] }, { words: [W[4], W[5]] }] } as any;
const B = { stropheId: 1, firstStropheInStanza: false, lastStropheInStanza: true, lines: [{ words: [W[6], W[7]] }] } as any;
const C = { stropheId: 2, firstStropheInStanza: true, lastStropheInStanza: true, lines: [{ words: [W[8], W[9]] }] } as any;
const passage = { stanzaCount: 2, stropheCount: 3, stanzaProps: [{ strophes: [A, B] }, { strophes: [C] }] } as any;

const sel = (words: number[], strophes: any[] = []): SelectionInput => ({
  selectedWords: words.map((id) => W[id]),
  selectedStrophes: strophes,
  numSelectedStrophes: strophes.length,
  passage,
});
const check = (type: T, s: SelectionInput) => structureAvailability(type, s);

describe("structure buttons", () => {
  it("say what to select when nothing is selected", () => {
    for (const t of [T.newLine, T.mergeWithPrevLine, T.newStrophe, T.mergeWithPrevStrophe, T.newStanza]) {
      const a = check(t, sel([]));
      expect(a.enabled).toBe(false);
      expect(a.reason).toMatch(/select/i);
    }
  });

  it("New line: not at a line's first word, not a whole line, neighbours in one strophe", () => {
    expect(check(T.newLine, sel([2])).enabled).toBe(true);
    expect(check(T.newLine, sel([1])).reason).toMatch(/already starts a line/);
    expect(check(T.newLine, sel([4, 5])).reason).toMatch(/whole line/);
    expect(check(T.newLine, sel([2, 3, 4])).enabled).toBe(true);
    expect(check(T.newLine, sel([2, 5])).reason).toMatch(/next to each other/);
    expect(check(T.newLine, sel([5, 6])).reason).toMatch(/single strophe/);
  });

  it("line merges stop at the strophe's first and last lines and point to the strophe buttons", () => {
    expect(check(T.mergeWithPrevLine, sel([2])).reason).toMatch(/first line.*Merge with previous strophe/);
    expect(check(T.mergeWithPrevLine, sel([4])).enabled).toBe(true);
    expect(check(T.mergeWithNextLine, sel([4])).reason).toMatch(/last line.*Merge with next strophe/);
    expect(check(T.mergeWithNextLine, sel([2])).enabled).toBe(true);
  });

  it("strophe merges only within a stanza", () => {
    expect(check(T.mergeWithPrevStrophe, sel([6])).enabled).toBe(true);
    expect(check(T.mergeWithPrevStrophe, sel([2])).reason).toMatch(/first strophe in its stanza.*merge the stanzas first/);
    expect(check(T.mergeWithNextStrophe, sel([6])).reason).toMatch(/last strophe in its stanza/);
    expect(check(T.mergeWithPrevStrophe, sel([], [B])).enabled).toBe(true);
    expect(check(T.mergeWithPrevStrophe, sel([], [A, B])).reason).toMatch(/just one strophe/);
  });

  it("New strophe needs neighbouring words", () => {
    expect(check(T.newStrophe, sel([2, 3])).enabled).toBe(true);
    expect(check(T.newStrophe, sel([2, 6])).reason).toMatch(/next to each other/);
  });

  it("stanza buttons accept a selected word as its strophe", () => {
    expect(stanzaTargets(sel([6, 7]))).toEqual({ strophes: [B], fromWords: true });
    expect(stanzaTargets(sel([5, 6])).strophes).toEqual([A, B]);
    expect(stanzaTargets(sel([1], [C]))).toEqual({ strophes: [C], fromWords: false });
    expect(check(T.newStanza, sel([6])).enabled).toBe(true);
    expect(check(T.mergeWithPrevStanza, sel([8])).enabled).toBe(true);
    expect(check(T.mergeWithPrevStanza, sel([6])).reason).toMatch(/first stanza/);
    expect(check(T.mergeWithNextStanza, sel([8])).reason).toMatch(/last stanza/);
    expect(check(T.newStanza, sel([], [A, C])).reason).toMatch(/next to each other/);
  });

  it("stanza buttons need more than one strophe", () => {
    const one = { ...passage, stropheCount: 1 };
    expect(structureAvailability(T.newStanza, { ...sel([1]), passage: one }).reason).toMatch(/one strophe so far/);
  });
});

describe("other buttons", () => {
  it("colors need a selection; text color needs words", () => {
    expect(colorAvailability(ColorActionType.colorFill, { words: 0, strophes: 0, layers: 0 }).reason).toMatch(/Select words or a strophe/);
    expect(colorAvailability(ColorActionType.colorFill, { words: 0, strophes: 1, layers: 0 }).enabled).toBe(true);
    expect(colorAvailability(ColorActionType.textColor, { words: 0, strophes: 1, layers: 0 }).reason).toMatch(/applies to words/);
  });

  it("indent explains uniform width, one word and the limits", () => {
    const base = { boxStyle: BoxDisplayStyle.uniformBoxes, selectedCount: 1, indent: 0 };
    expect(indentAvailability(true, { ...base, boxStyle: BoxDisplayStyle.box }).reason).toMatch(/Uniform width/);
    expect(indentAvailability(true, { ...base, selectedCount: 2 }).reason).toMatch(/exactly one word/);
    expect(indentAvailability(true, { ...base, indent: 3 }).reason).toMatch(/most indent/);
    expect(indentAvailability(false, base).reason).toMatch(/no indent/);
    expect(indentAvailability(true, base).enabled).toBe(true);
  });

  it("gloss editing needs one word in the English view", () => {
    expect(editGlossAvailability({ selectedCount: 1, isHebrew: true, inViewMode: false }).reason).toMatch(/English view/);
    expect(editGlossAvailability({ selectedCount: 2, isHebrew: false, inViewMode: false }).reason).toMatch(/exactly one word/);
    expect(editGlossAvailability({ selectedCount: 1, isHebrew: false, inViewMode: false }).enabled).toBe(true);
  });
});
