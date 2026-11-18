import { describe, expect, it } from "vitest";

import { BoxDisplayStyle, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { INTERFACE_TOUR_STEPS, buildTourSnapshot, isStepDone, resolveBody, resolveTarget, type TourSources } from "./interfaceTour";

const word = (wordId: number, verse: number, strongNumber = wordId, gloss = `w${wordId}`) => ({ wordId, verse, strongNumber, gloss, metadata: {} }) as any;
const line = (...words: any[]) => ({ lineId: 0, words });
const strophe = (lines: any[], expanded?: boolean) => ({ stropheId: 0, metadata: { expanded }, lines });

const sources = (over: Partial<TourSources> = {}): TourSources => ({
  languageMode: LanguageMode.English,
  nonEnglishDisplayMode: NonEnglishDisplayMode.Hebrew,
  passageProps: {
    stanzaCount: 1,
    stropheCount: 2,
    stanzaProps: [
      {
        stanzaId: 0,
        metadata: {},
        strophes: [
          strophe([line(word(1, 1), word(2, 1))], false),
          strophe([line(word(3, 1)), line(word(4, 6)), line(word(5, 6)), line(word(6, 6), word(7, 6))]),
        ],
      },
    ],
  } as any,
  selectedWords: [],
  studyMetadata: { words: {} },
  boxStyle: BoxDisplayStyle.box,
  notesOn: false,
  studyNotes: "",
  layers: [{ id: 0 } as any, { id: 3 } as any],
  activeLayerId: 3,
  infoPaneAction: InfoPaneActionType.none,
  esvOpen: false,
  wordInfoOpen: false,
  ...over,
});

const step = (id: string) => INTERFACE_TOUR_STEPS.find((s) => s.id === id)!;

describe("buildTourSnapshot", () => {
  it("reads structure from the passage", () => {
    const s = buildTourSnapshot(sources());
    expect(s.stropheCount).toBe(2);
    expect(s.firstStropheWordCount).toBe(2);
    expect(s.anyStropheCollapsed).toBe(true);
    expect(s.verseSixLineCount).toBe(3);
    expect(s.lineCount).toBe(5);
  });

  it("spots identical words in the selection", () => {
    expect(buildTourSnapshot(sources({ selectedWords: [word(1, 1, 3068), word(9, 6, 3068)] })).identicalWordsSelected).toBe(true);
    expect(buildTourSnapshot(sources({ selectedWords: [word(1, 1, 1), word(2, 1, 2)] })).identicalWordsSelected).toBe(false);
  });

  it("finds note titles in any layer", () => {
    const notes = JSON.stringify({ main: "", layerStrophes: { "0": [{ title: "" }, { title: "The shepherd" }] } });
    expect(buildTourSnapshot(sources({ studyNotes: notes })).anyNoteTitle).toBe(true);
    expect(buildTourSnapshot(sources({ studyNotes: "not json" })).anyNoteTitle).toBe(false);
  });
});

describe("tour steps", () => {
  it("every step has a unique id", () => {
    const ids = INTERFACE_TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("heading strophe is done when the first strophe is just two words", () => {
    const s = buildTourSnapshot(sources());
    expect(isStepDone(step("heading-new-strophe"), s, s)).toBe(true);
  });

  it("points at the exact word to click, named by its gloss", () => {
    const s = buildTourSnapshot(sources());
    expect(resolveTarget(step("heading-word"), s)).toBe('[data-word-id="3"]');
    expect(resolveBody(step("heading-word"), s)).toContain("\u201cw3\u201d");
    expect(resolveTarget(step("verse4-word"), s)).toBeUndefined(); // no verse 4 in this sample
    expect(isStepDone(step("heading-word"), { ...s, selectedWordIds: [3] }, s)).toBe(true);
  });

  it("points at single buttons, not whole groups", () => {
    const s = buildTourSnapshot(sources());
    expect(resolveTarget(step("heading-new-strophe"), s)).toBe('[data-tour="structure-newStrophe"]');
    expect(resolveTarget(step("stanza-new"), s)).toBe('[data-tour="structure-newStanza"]');
    expect(resolveTarget(step("strophe-collapse"), s)).toBe('[data-tour="strophe-collapse"][data-strophe-id="0"]');
  });

  it("walks verse 6 from four lines to two, one word and one button at a time", () => {
    const start = buildTourSnapshot(sources()); // verse 6 on 3 lines here: [4] [5] [6,7]
    expect(start.verseSixLines.map((l) => l.map((w) => w.wordId))).toEqual([[4], [5], [6, 7]]);
    expect(resolveTarget(step("v6-merge1-word"), start, start)).toBe('[data-word-id="5"]');
    expect(isStepDone(step("v6-merge1-word"), { ...start, selectedWordIds: [5] }, start)).toBe(true);
    expect(resolveTarget(step("v6-merge1-button"), start, start)).toBe('[data-tour="structure-mergeWithPrevLine"]');
    expect(isStepDone(step("v6-merge1-button"), { ...start, verseSixLineCount: 2 }, start)).toBe(true);

    // The word stays fixed to the step's start even after the layout changes.
    const later = { ...start, verseSixLines: [[{ wordId: 4, verse: 6, gloss: "x" }]] };
    expect(resolveTarget(step("v6-merge1-word"), later, start)).toBe('[data-word-id="5"]');

    expect(resolveTarget(step("v6-merge2-word"), start, start)).toBe('[data-word-id="7"]');
    expect(isStepDone(step("v6-merge2-button"), { ...start, verseSixLineCount: 2 }, { ...start, verseSixLineCount: 3 })).toBe(true);
  });

  it("suggests the strophe starting at verse 4 for the new stanza", () => {
    const passage = sources().passageProps as any;
    passage.stanzaProps[0].strophes = [
      { stropheId: 0, metadata: {}, lines: [line(word(1, 1), word(2, 1))] },
      { stropheId: 1, metadata: {}, lines: [line(word(3, 1))] },
      { stropheId: 2, metadata: {}, lines: [line(word(8, 4)), line(word(9, 4))] },
    ];
    const s = buildTourSnapshot(sources({ passageProps: passage }));
    expect(resolveTarget(step("stanza-select"), s)).toBe('[data-tour="strophe-select"][data-strophe-id="2"]');
    expect(resolveBody(step("stanza-select"), s)).toContain("verse 4");
    expect(isStepDone(step("verse4-new-strophe"), s, s)).toBe(true);
    expect(isStepDone(step("stanza-select"), { ...s, selectedStropheIds: [2] }, s)).toBe(true);
  });

  it("merge steps compare against the start of the step", () => {
    const start = buildTourSnapshot(sources());
    const later = { ...start, stropheCount: start.stropheCount - 1 };
    expect(isStepDone(step("merge-strophe-button"), start, start)).toBe(false);
    expect(isStepDone(step("merge-strophe-button"), later, start)).toBe(true);
  });

  it("layer edits need both a color and a division change", () => {
    const start = buildTourSnapshot(sources());
    const colored = { ...start, anyFill: true };
    expect(isStepDone(step("layers-edit"), colored, start)).toBe(false);
    expect(isStepDone(step("layers-edit"), { ...colored, lineCount: start.lineCount + 1 }, start)).toBe(true);
  });

  it("switching back means the first layer is active", () => {
    const s = buildTourSnapshot(sources({ activeLayerId: 0 }));
    expect(isStepDone(step("layers-back"), s, s)).toBe(true);
  });
});
