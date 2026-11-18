import { describe, expect, it } from "vitest";

import { BoxDisplayStyle, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { INTERFACE_TOUR_STEPS, buildTourSnapshot, isStepDone, type TourSources } from "./interfaceTour";

const word = (wordId: number, verse: number, strongNumber = wordId) => ({ wordId, verse, strongNumber }) as any;
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
    expect(isStepDone(step("strophe-heading"), s, s)).toBe(true);
  });

  it("merge steps compare against the start of the step", () => {
    const start = buildTourSnapshot(sources());
    const later = { ...start, stropheCount: start.stropheCount - 1 };
    expect(isStepDone(step("merge-strophe"), start, start)).toBe(false);
    expect(isStepDone(step("merge-strophe"), later, start)).toBe(true);
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
