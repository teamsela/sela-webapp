import { describe, expect, it } from "vitest";

import { BoxDisplayStyle, ColorActionType, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { ORIENTATION_TOUR, ORIENTATION_TOUR_STEPS } from "./orientationTour";
import { INTERFACE_TOUR } from "./interfaceTour";
import { buildTourSnapshot, isActionStep, isStepDone, resolveBody, resolveResult, resolveTarget, type TourSources } from "./tour";
import { tourForStudy } from "./tours";

// A small Psalm 1: "not" (3808) in verses 1, 3, 4 and 5, "way" (1870) in
// verses 1 and 6, "does walk" (1980) in verse 1.
const w = (wordId: number, verse: number, strongNumber: number, gloss: string) =>
  ({ wordId, verse, strongNumber, gloss, metadata: {} }) as any;
const WORDS = {
  not1: w(1, 1, 3808, "not"),
  walk: w(2, 1, 1980, "does walk"),
  way1: w(3, 1, 1870, "and in the path"),
  not2: w(4, 1, 3808, "nor"),
  not3: w(5, 3, 3808, "not"),
  not4: w(6, 4, 3808, "Not"),
  so: w(7, 4, 3651, "so"),
  not5: w(8, 5, 3808, "not"),
  way2: w(9, 6, 1870, "the way"),
  way3: w(10, 6, 1870, "but the way"),
};
const line = (...words: any[]) => ({ lineId: 0, words });

/** One stanza; `split` puts verse 4 onwards in a second strophe (and `stanzas` in a second stanza). */
const passage = ({ split = false, stanzas = false } = {}) => {
  const a = line(WORDS.not1, WORDS.walk, WORDS.way1, WORDS.not2);
  const b = line(WORDS.not3);
  const c = line(WORDS.not4, WORDS.so);
  const d = line(WORDS.not5, WORDS.way2, WORDS.way3);
  const first = { stropheId: 0, metadata: {}, lines: split ? [a, b] : [a, b, c, d] };
  const second = { stropheId: 1, metadata: {}, lines: [c, d] };
  if (!split) return { stanzaCount: 1, stropheCount: 1, stanzaProps: [{ stanzaId: 0, metadata: {}, strophes: [first] }] };
  if (!stanzas) return { stanzaCount: 1, stropheCount: 2, stanzaProps: [{ stanzaId: 0, metadata: {}, strophes: [first, second] }] };
  return {
    stanzaCount: 2,
    stropheCount: 2,
    stanzaProps: [
      { stanzaId: 0, metadata: {}, strophes: [first] },
      { stanzaId: 1, metadata: {}, strophes: [second] },
    ],
  };
};

const sources = (over: Partial<TourSources> = {}): TourSources => ({
  languageMode: LanguageMode.English,
  nonEnglishDisplayMode: NonEnglishDisplayMode.Hebrew,
  passageProps: passage() as any,
  selectedWords: [],
  studyMetadata: { words: {} },
  boxStyle: BoxDisplayStyle.box,
  notesOn: false,
  studyNotes: "",
  layers: [{ id: 0 } as any],
  activeLayerId: 0,
  infoPaneAction: InfoPaneActionType.none,
  esvOpen: false,
  wordInfoOpen: false,
  ...over,
});
const snap = (over: Partial<TourSources> = {}) => buildTourSnapshot(sources(over));
const step = (id: string) => {
  const found = ORIENTATION_TOUR_STEPS.find((s) => s.id === id);
  if (!found) throw new Error(`no step ${id}`);
  return found;
};
const colored = (...words: any[]) => ({ words: Object.fromEntries(words.map((x) => [x.wordId, { color: { fill: "#f00" } }])) });
const nots = [WORDS.not1, WORDS.not2, WORDS.not3, WORDS.not4, WORDS.not5];
const ways = [WORDS.way1, WORDS.way2, WORDS.way3];

describe("tourForStudy", () => {
  it("runs the orientation tour on Psalm 1 and the interface tour otherwise", () => {
    expect(tourForStudy({ book: "psalms", passage: "1" })).toBe(ORIENTATION_TOUR);
    expect(tourForStudy({ book: "Psalms", passage: " 1 " })).toBe(ORIENTATION_TOUR);
    expect(tourForStudy({ book: "psalms", passage: "23" })).toBe(INTERFACE_TOUR);
    expect(tourForStudy({})).toBe(INTERFACE_TOUR);
  });
});

describe("Psalm 1 orientation tour", () => {
  it("has unique step ids, starts with a welcome and ends with the closing card", () => {
    const ids = ORIENTATION_TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("welcome");
    expect(ids.at(-1)).toBe("finish");
    expect(ORIENTATION_TOUR.finish).toBe("next");
  });

  it("has 22 tasks, with the boxes and headings steps interactive", () => {
    const tasks = ORIENTATION_TOUR_STEPS.filter(isActionStep).map((s) => s.id);
    expect(tasks).toHaveLength(22);
    expect(tasks).toEqual(
      expect.arrayContaining(["boxes-off", "boxes-on", "strophe-heading-open", "strophe-heading-write", "strophe-heading-close", "stanza-heading"])
    );
  });

  it("writes key presses as [ENTER]", () => {
    const bodies = ORIENTATION_TOUR_STEPS.map((s) => resolveBody(s, snap()));
    expect(bodies.join(" ")).not.toMatch(/press enter/i);
    expect(bodies.filter((b) => b.includes("[ENTER]"))).toHaveLength(2);
  });

  it("toggles the word boxes off and on", () => {
    expect(isStepDone(step("boxes-off"), snap({ boxStyle: BoxDisplayStyle.noBox }), snap())).toBe(true);
    expect(isStepDone(step("boxes-on"), snap({ boxStyle: BoxDisplayStyle.box }), snap({ boxStyle: BoxDisplayStyle.noBox }))).toBe(true);
  });

  it("splits at verse 4: the word, New strophe, strophe 2, New stanza", () => {
    const start = snap();
    expect(resolveTarget(step("v4-word"), start)).toBe('[data-word-id="6"]');
    expect(resolveBody(step("v4-word"), start)).toContain("“Not”");
    expect(isStepDone(step("v4-word"), snap({ selectedWords: [WORDS.not4] }), start)).toBe(true);

    expect(isStepDone(step("v4-new-strophe"), start, start)).toBe(false);
    const split = snap({ passageProps: passage({ split: true }) as any });
    expect(isStepDone(step("v4-new-strophe"), split, start)).toBe(true);
    expect(resolveResult(step("v4-new-strophe"), split)).toBe('[data-strophe-block="1"]');

    expect(resolveTarget(step("stanza-select"), split)).toBe('[data-tour="strophe-select"][data-strophe-id="1"]');
    expect(isStepDone(step("stanza-select"), snap({ passageProps: passage({ split: true }) as any, selectedStropheIds: [1] }), split)).toBe(true);

    const stanzas = snap({ passageProps: passage({ split: true, stanzas: true }) as any });
    expect(isStepDone(step("stanza-new"), split, split)).toBe(false);
    expect(isStepDone(step("stanza-new"), stanzas, split)).toBe(true);
    expect(resolveResult(step("stanza-new"), stanzas)).toBe('[data-stanza-block="1"]');
  });

  it("opens a strophe note, waits for a heading, then closes it", () => {
    const start = snap();
    expect(resolveTarget(step("strophe-heading-open"), start)).toBe('[data-tour="strophe-note-open"][data-strophe-id="0"]');
    expect(isStepDone(step("strophe-heading-open"), snap({ openNoteStropheIds: [0] }), start)).toBe(true);
    const titled = snap({ openNoteStropheIds: [0], studyNotes: JSON.stringify({ strophes: [{ title: "The righteous" }] }) });
    expect(isStepDone(step("strophe-heading-write"), snap({ openNoteStropheIds: [0] }), start)).toBe(false);
    expect(isStepDone(step("strophe-heading-write"), titled, start)).toBe(true);
    expect(isStepDone(step("strophe-heading-close"), titled, titled)).toBe(false);
    expect(isStepDone(step("strophe-heading-close"), snap(), titled)).toBe(true);
  });

  it("titles the first stanza", () => {
    const start = snap();
    expect(resolveTarget(step("stanza-heading"), start)).toBe('[data-tour="stanza-title"][data-stanza-id="0"]');
    const titled = snap({ passageProps: { ...passage(), stanzaProps: [{ ...passage().stanzaProps[0], metadata: { title: "Two ways" } }] } as any });
    expect(isStepDone(step("stanza-heading"), titled, start)).toBe(true);
  });

  it("needs every “not” selected, then filled, then the picker closed", () => {
    const start = snap();
    expect(resolveTarget(step("not-select"), start)).toBe('[data-word-id="1"]');
    expect(resolveBody(step("not-select"), start)).toContain("all 5 of them");
    expect(isStepDone(step("not-select"), snap({ selectedWords: nots.slice(0, 3) }), start)).toBe(false);
    expect(isStepDone(step("not-select"), snap({ selectedWords: nots }), start)).toBe(true);
    expect(resolveResult(step("not-select"), snap({ selectedWords: nots }))).toBe(nots.map((x) => `[data-word-id="${x.wordId}"]`).join(", "));

    const fill = step("not-fill");
    const open = snap({ studyMetadata: colored(...nots), colorAction: ColorActionType.colorFill });
    expect(isStepDone(fill, snap({ studyMetadata: colored(WORDS.not1) }), start)).toBe(false);
    expect(isStepDone(fill, open, start)).toBe(false);
    expect(isStepDone(fill, snap({ studyMetadata: colored(...nots) }), start)).toBe(true);
  });

  it("selects the “way” chip and colors every “way”", () => {
    expect(resolveTarget(step("way-chip"), snap())).toBe('[data-tour="motif-chip"][data-strong="1870"]');
    expect(isStepDone(step("way-chip"), snap({ selectedWords: ways }), snap())).toBe(true);
    expect(isStepDone(step("way-color"), snap({ studyMetadata: colored(...ways) }), snap())).toBe(true);
    expect(isStepDone(step("way-color"), snap({ studyMetadata: colored(WORDS.way1) }), snap())).toBe(false);
  });

  it("opens Verb Conjugations, turns Smart Highlight on, then off, and warns about the colors", () => {
    expect(isStepDone(step("verb-conjugations"), snap({ openSyntaxSections: ["verb-conjugations"] }), snap())).toBe(true);
    expect(isStepDone(step("verb-conjugations"), snap({ openSyntaxSections: ["parts-of-speech"] }), snap())).toBe(false);
    const on = snap({ activeHighlights: { syntax: "verb-conjugations" } });
    expect(isStepDone(step("smart-highlight-on"), on, snap())).toBe(true);
    expect(resolveBody(step("smart-highlight-on"), on)).toMatch(/replaces the colors already on the passage/);
    expect(isStepDone(step("smart-highlight-off"), on, on)).toBe(false);
    expect(isStepDone(step("smart-highlight-off"), snap({ activeHighlights: { syntax: null } }), on)).toBe(true);
  });

  it("selects “does walk” and opens Word Information", () => {
    expect(resolveTarget(step("walk-word"), snap())).toBe('[data-word-id="2"]');
    expect(isStepDone(step("walk-word"), snap({ selectedWords: [WORDS.walk] }), snap())).toBe(true);
    expect(isStepDone(step("word-info"), snap({ wordInfoOpen: true }), snap())).toBe(true);
  });

  it("opens the Motif, Syntax and Layer tabs", () => {
    expect(isStepDone(step("motif-tab"), snap({ infoPaneAction: InfoPaneActionType.motif }), snap())).toBe(true);
    expect(isStepDone(step("syntax-tab"), snap({ infoPaneAction: InfoPaneActionType.syntax }), snap())).toBe(true);
    expect(isStepDone(step("layers-tab"), snap({ infoPaneAction: InfoPaneActionType.layers }), snap())).toBe(true);
  });
});
