/**
 * Behavioral tests for the "Accents in Poetry" Structure panel.
 *
 * The heavy StudyPane index ("..") and the DB-backed useHighlightManager are
 * mocked so we can drive the panel's own logic — scanning the passage, bucketing
 * occurrences per level, selection toggling, lead-word underlining and the Smart
 * Highlight payload — in jsdom. Each test word sits in its own verse so the full
 * parser's cross-word pair scans don't merge unrelated single marks.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { ACCENT_CODEPOINTS } from "@/lib/poeticAccents";
import type { PassageProps, StropheProps, WordProps } from "@/lib/data";

// Stub useHighlightManager so we don't pull in server actions / DB code.
// `highlightState.activeHighlightId` is mutable so tests can simulate an
// already-applied highlight and exercise the accumulate / clear branches.
const { toggleHighlightMock, highlightState } = vi.hoisted(() => ({
  toggleHighlightMock: vi.fn(),
  highlightState: { activeHighlightId: null as string | null },
}));
vi.mock("./useHighlightManager", () => ({
  useHighlightManager: () => ({
    toggleHighlight: toggleHighlightMock,
    activeHighlightId: highlightState.activeHighlightId,
  }),
}));

// Mock the StudyPane index so importing FormatContext is cheap.
vi.mock("..", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import Structure from "./Structure";
import { FormatContext } from "..";

const BET = 0x05d1;
const MAQQEF = ACCENT_CODEPOINTS.MAQQEF;
// Each word gets a unique verse to keep single marks from pairing across words.
const mkWord = (wordId: number, ...marks: number[]): WordProps =>
  ({ wordId, wlcWord: String.fromCharCode(BET, ...marks), chapter: 1, verse: wordId } as WordProps);

// A word pinned to a specific verse so maqqef-joined tokens can share one verse
// (and thus one prosodic word). A trailing MAQQEF makes a token join the next.
const mkWordInVerse = (wordId: number, verse: number, ...marks: number[]): WordProps =>
  ({ wordId, wlcWord: String.fromCharCode(BET, ...marks), chapter: 1, verse } as WordProps);

const buildPassage = (words: WordProps[]): PassageProps =>
  ({ stanzaProps: [{ strophes: [{ lines: [{ words }] }] }] } as unknown as PassageProps);

type Ctx = {
  passage: PassageProps;
  book?: string;
  selectedWords?: WordProps[];
  selectedStrophes?: StropheProps[];
  inViewMode?: boolean;
  inTextCounterOn?: boolean;
  counterMode?: "words" | "units";
};

const setup = ({
  passage,
  book = "psalms",
  selectedWords = [],
  selectedStrophes = [],
  inViewMode = false,
  inTextCounterOn = false,
  counterMode = "words",
}: Ctx) => {
  const ctxSetSelectedWords = vi.fn();
  const ctxSetNumSelectedWords = vi.fn();
  const ctxSetSelectedStrophes = vi.fn();
  const ctxSetAccentBorderWordIds = vi.fn();
  const ctxSetInTextCounterOn = vi.fn();
  const ctxSetCounterMode = vi.fn();

  const value = {
    ctxPassageProps: passage,
    ctxStudyBook: book,
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSelectedStrophes: selectedStrophes,
    ctxSetSelectedStrophes,
    ctxSetAccentBorderWordIds,
    ctxWordsColorMap: new Map(),
    ctxStudyMetadata: { words: {} },
    ctxInViewMode: inViewMode,
    ctxInTextCounterOn: inTextCounterOn,
    ctxSetInTextCounterOn,
    ctxCounterMode: counterMode,
    ctxSetCounterMode,
  } as any;

  render(
    <FormatContext.Provider value={value}>
      <Structure />
    </FormatContext.Provider>,
  );

  return {
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxSetAccentBorderWordIds,
    ctxSetInTextCounterOn,
    ctxSetCounterMode,
  };
};

const catButton = (name: RegExp) => screen.getByRole("button", { name });

describe("Structure panel — Accents in Poetry", () => {
  beforeEach(() => {
    toggleHighlightMock.mockClear();
    highlightState.activeHighlightId = null;
  });

  it("renders the accordion with Disjunctive levels and a Conjunctive All row", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]) });

    expect(screen.getByText("Accents in Poetry")).toBeInTheDocument();
    expect(screen.getByText("Disjunctive")).toBeInTheDocument();
    expect(screen.getByText("Conjunctive")).toBeInTheDocument();
    ["Level 1", "Level 2", "Level 3", "Level 4", "All"].forEach((label) => {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Smart Highlight/ })).toBeInTheDocument();
  });

  it("shows per-level occurrence counts from the scanner", () => {
    setup({
      passage: buildPassage([
        mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ), // level 1
        mkWord(2, ACCENT_CODEPOINTS.ETNACHTA), // level 2
        mkWord(3, ACCENT_CODEPOINTS.ETNACHTA), // level 2
        mkWord(4, ACCENT_CODEPOINTS.MUNACH), // conjunctive
        mkWord(5, ACCENT_CODEPOINTS.MERKHA), // conjunctive
      ]),
    });

    expect(within(catButton(/^Level 1/)).getByText("1")).toBeInTheDocument();
    expect(within(catButton(/^Level 2/)).getByText("2")).toBeInTheDocument();
    expect(within(catButton(/^Level 3/)).getByText("0")).toBeInTheDocument();
    expect(within(catButton(/^All/)).getByText("2")).toBeInTheDocument();
  });

  it("disables a level button when it has no words", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]) });
    expect(catButton(/^Level 1/)).toBeEnabled();
    expect(catButton(/^Level 3/)).toBeDisabled();
  });

  it("selects a category's words via the shared selection context when clicked", () => {
    const { ctxSetSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes } = setup({
      passage: buildPassage([
        mkWord(1, ACCENT_CODEPOINTS.ETNACHTA),
        mkWord(2, ACCENT_CODEPOINTS.ETNACHTA),
        mkWord(3, ACCENT_CODEPOINTS.MUNACH),
      ]),
    });

    fireEvent.click(catButton(/^Level 2/));

    expect(ctxSetSelectedWords).toHaveBeenCalledTimes(1);
    const selected = ctxSetSelectedWords.mock.calls[0][0] as WordProps[];
    expect(selected.map((w) => w.wordId).sort()).toEqual([1, 2]);
    expect(ctxSetNumSelectedWords).toHaveBeenCalledWith(2);
    expect(ctxSetSelectedStrophes).toHaveBeenCalledWith([]);
  });

  it("deselects an already-fully-selected category", () => {
    const words = [mkWord(1, ACCENT_CODEPOINTS.ETNACHTA), mkWord(2, ACCENT_CODEPOINTS.ETNACHTA)];
    const { ctxSetSelectedWords, ctxSetNumSelectedWords } = setup({
      passage: buildPassage(words),
      selectedWords: words,
    });

    fireEvent.click(catButton(/^Level 2/));

    expect(ctxSetSelectedWords).toHaveBeenCalledWith([]);
    expect(ctxSetNumSelectedWords).toHaveBeenCalledWith(0);
  });

  it("Smart Highlight colors ALL non-empty categories at once when nothing is selected", () => {
    setup({
      passage: buildPassage([
        mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ), // level-1
        mkWord(2, ACCENT_CODEPOINTS.ETNACHTA), // level-2
        mkWord(3, ACCENT_CODEPOINTS.MUNACH), // conjunctive
      ]),
    });

    fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

    expect(toggleHighlightMock).toHaveBeenCalledTimes(1);
    const [highlightId, groups] = toggleHighlightMock.mock.calls[0];
    expect(highlightId).toBe("accents-in-poetry");

    const byLabel = Object.fromEntries(groups.map((g: any) => [g.label, g]));
    expect(Object.keys(byLabel).sort()).toEqual(["conjunctive-fill", "level-1-fill", "level-2-fill"]);
    expect(byLabel["level-1-fill"].palette).toMatchObject({ fill: "#B71C1C", text: "#FFFFFF" });
    expect(byLabel["level-2-fill"].palette).toMatchObject({ fill: "#D32F2F", text: "#FFFFFF" });
    expect(byLabel["conjunctive-fill"].palette).toMatchObject({ fill: "#C8E6C9" });
    expect(byLabel["level-1-fill"].words.map((w: WordProps) => w.wordId)).toEqual([1]);
  });

  it("Smart Highlight colors ONLY the selected level when one level is selected", () => {
    const l1 = mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ); // level-1
    const l2 = mkWord(2, ACCENT_CODEPOINTS.ETNACHTA); // level-2
    const conj = mkWord(3, ACCENT_CODEPOINTS.MUNACH); // conjunctive
    setup({
      passage: buildPassage([l1, l2, conj]),
      selectedWords: [l1], // only Level 1's fill word is selected
    });

    fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

    expect(toggleHighlightMock).toHaveBeenCalledTimes(1);
    const [highlightId, groups] = toggleHighlightMock.mock.calls[0];
    // The ID is scoped to the selected set so the next click can extend it.
    expect(highlightId).toBe("accents-in-poetry::level-1");
    const byLabel = Object.fromEntries(groups.map((g: any) => [g.label, g]));
    // Level 2 and the conjunctive row are left untouched.
    expect(Object.keys(byLabel).sort()).toEqual(["level-1-fill"]);
    expect(byLabel["level-1-fill"].words.map((w: WordProps) => w.wordId)).toEqual([1]);
    expect(byLabel["level-1-fill"].palette).toMatchObject({ fill: "#B71C1C", text: "#FFFFFF" });
  });

  it("Smart Highlight colors every selected level and excludes the unselected ones", () => {
    const l1 = mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ); // level-1
    const l2 = mkWord(2, ACCENT_CODEPOINTS.ETNACHTA); // level-2
    const conj = mkWord(3, ACCENT_CODEPOINTS.MUNACH); // conjunctive
    setup({
      passage: buildPassage([l1, l2, conj]),
      selectedWords: [l1, l2], // Level 1 + Level 2 selected; conjunctive left out
    });

    fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

    const [highlightId, groups] = toggleHighlightMock.mock.calls[0];
    // ID encodes both levels (in CATEGORY_KEYS order, not selection order) so that
    // selecting another level yields a different ID and re-applies instead of
    // clearing — enabling incremental level-by-level coloring.
    expect(highlightId).toBe("accents-in-poetry::level-1,level-2");
    const byLabel = Object.fromEntries(groups.map((g: any) => [g.label, g]));
    expect(Object.keys(byLabel).sort()).toEqual(["level-1-fill", "level-2-fill"]);
  });

  it("adds newly staged levels to the already-highlighted set (accumulate)", () => {
    // Level 1 is already colored; the user now stages Level 2 and applies.
    highlightState.activeHighlightId = "accents-in-poetry::level-1";
    const l1 = mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ); // level-1
    const l2 = mkWord(2, ACCENT_CODEPOINTS.ETNACHTA); // level-2
    const { ctxSetSelectedWords } = setup({
      passage: buildPassage([l1, l2]),
      selectedWords: [l2], // only Level 2 is staged
    });

    // Button reads "Smart Highlight" (not "Clear") because a level is staged.
    fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

    const [highlightId, groups] = toggleHighlightMock.mock.calls[0];
    expect(highlightId).toBe("accents-in-poetry::level-1,level-2");
    const labels = groups.map((g: any) => g.label).sort();
    expect(labels).toEqual(["level-1-fill", "level-2-fill"]);
    // Staging is cleared after applying, like the Sounds tab.
    expect(ctxSetSelectedWords).toHaveBeenCalledWith([]);
  });

  it("Clear Highlight clears everything when nothing is staged", () => {
    highlightState.activeHighlightId = "accents-in-poetry::level-1,level-2";
    const l1 = mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ);
    const l2 = mkWord(2, ACCENT_CODEPOINTS.ETNACHTA);
    setup({
      passage: buildPassage([l1, l2]),
      selectedWords: [], // nothing staged → button shows "Clear Highlight"
    });

    fireEvent.click(screen.getByRole("button", { name: /Clear Highlight/ }));

    // Toggling with the active id restores the pre-highlight state.
    const [highlightId] = toggleHighlightMock.mock.calls[0];
    expect(highlightId).toBe("accents-in-poetry::level-1,level-2");
  });

  it("re-staging an already-highlighted level does not clear it (no-op apply)", () => {
    highlightState.activeHighlightId = "accents-in-poetry::level-1";
    const l1 = mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ);
    const { ctxSetSelectedWords } = setup({
      passage: buildPassage([l1]),
      selectedWords: [l1], // Level 1 staged again while already colored
    });

    fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

    // The union equals the applied set, so no re-apply fires...
    expect(toggleHighlightMock).not.toHaveBeenCalled();
    // ...but the staging is still cleared.
    expect(ctxSetSelectedWords).toHaveBeenCalledWith([]);
  });

  it("disables Smart Highlight when there are no accents", () => {
    setup({ passage: buildPassage([mkWord(1)]) }); // bare letter, no accent
    expect(screen.getByRole("button", { name: /Smart Highlight/ })).toBeDisabled();
  });

  it("disables Smart Highlight in view mode even when accents exist", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]), inViewMode: true });
    expect(screen.getByRole("button", { name: /Smart Highlight/ })).toBeDisabled();
  });

  it("shows a note and no level buttons for non-poetic books", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]), book: "genesis" });
    expect(screen.getByText(/applies to the poetic books/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Level 1/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Smart Highlight/ })).toBeNull();
  });

  describe("maqqef-joined words", () => {
    it("fills only the accent-bearing word of a maqqef unit, leaving the leaner blank", () => {
      // Token 10 ends with a maqqef and carries no accent of its own (a leaner);
      // token 11 carries an Etnachta. Sharing verse 5 makes them one prosodic word.
      setup({
        passage: buildPassage([
          mkWordInVerse(10, 5, MAQQEF),
          mkWordInVerse(11, 5, ACCENT_CODEPOINTS.ETNACHTA),
        ]),
      });

      fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

      const [, groups] = toggleHighlightMock.mock.calls[0];
      const byLabel = Object.fromEntries(groups.map((g: any) => [g.label, g]));
      // Solid fill for the accent-bearing word only; no border group.
      expect(byLabel["level-2-fill"].words.map((w: WordProps) => w.wordId)).toEqual([11]);
      expect(byLabel["level-2-border"]).toBeUndefined();
      // The maqqef leaner (10) is colored in NO group at all.
      const allWordIds = groups.flatMap((g: any) => g.words.map((w: WordProps) => w.wordId));
      expect(allWordIds).not.toContain(10);
    });

    it("outlines (border only) both words when the accent straddles the maqqef", () => {
      // Tsinnorit on token 20 (ends with maqqef) + Merkha on token 21, same verse
      // → one Sinnorit Merkha (level 3) whose marks straddle the maqqef.
      setup({
        passage: buildPassage([
          mkWordInVerse(20, 6, ACCENT_CODEPOINTS.TSINNORIT, MAQQEF),
          mkWordInVerse(21, 6, ACCENT_CODEPOINTS.MERKHA),
        ]),
      });

      fireEvent.click(screen.getByRole("button", { name: /Smart Highlight/ }));

      const [, groups] = toggleHighlightMock.mock.calls[0];
      const byLabel = Object.fromEntries(groups.map((g: any) => [g.label, g]));
      // Border-only group holds BOTH words; the unit gets no solid fill.
      expect(byLabel["level-3-border"].palette).toEqual({ border: "#FFCDD2" });
      expect(
        byLabel["level-3-border"].words.map((w: WordProps) => w.wordId).sort((a: number, b: number) => a - b),
      ).toEqual([20, 21]);
      expect(byLabel["level-3-fill"]).toBeUndefined();
    });

    it("selecting a maqqef unit's level selects only the accent-bearing word", () => {
      const { ctxSetSelectedWords } = setup({
        passage: buildPassage([
          mkWordInVerse(10, 5, MAQQEF),
          mkWordInVerse(11, 5, ACCENT_CODEPOINTS.ETNACHTA),
        ]),
      });

      fireEvent.click(catButton(/^Level 2/));

      const selected = ctxSetSelectedWords.mock.calls[0][0] as WordProps[];
      expect(selected.map((w) => w.wordId)).toEqual([11]);
    });
  });

  describe("cross-word accent portion words", () => {
    it("registers the lead word as a border partner when the level is selected", () => {
      // Tsinnorit on word 30 + Merkha on word 31 in one verse (no maqqef) →
      // a cross-word Sinnorit Merkha (level 3): head = 31 (fill), lead = 30 (border).
      // The lead word is a portion partner that gets a matching border when the
      // selected head is filled from the toolbar — no underline involved.
      const lead = mkWordInVerse(30, 7, ACCENT_CODEPOINTS.TSINNORIT);
      const head = mkWordInVerse(31, 7, ACCENT_CODEPOINTS.MERKHA);
      const { ctxSetAccentBorderWordIds } = setup({
        passage: buildPassage([lead, head]),
        selectedWords: [head], // the level-3 fill word is already selected
      });

      const lastCall = ctxSetAccentBorderWordIds.mock.calls.at(-1)?.[0];
      expect(lastCall).toEqual([30]);
    });

    it("registers no border partners while the level's fill word is unselected", () => {
      const lead = mkWordInVerse(30, 7, ACCENT_CODEPOINTS.TSINNORIT);
      const head = mkWordInVerse(31, 7, ACCENT_CODEPOINTS.MERKHA);
      const { ctxSetAccentBorderWordIds } = setup({
        passage: buildPassage([lead, head]),
        selectedWords: [], // nothing selected yet
      });

      const lastCall = ctxSetAccentBorderWordIds.mock.calls.at(-1)?.[0];
      expect(lastCall).toEqual([]);
    });
  });
});

describe("Structure panel — Word and Line Counter", () => {
  // Words with explicit line coordinates so line counting is meaningful.
  const cWord = (wordId: number, lineId = 0, stropheId = 0, stanzaId = 0): WordProps =>
    ({ wordId, stanzaId, stropheId, lineId } as WordProps);
  const cStrophe = (lines: WordProps[][]): StropheProps =>
    ({ stropheId: 0, metadata: {}, lines: lines.map((words, lineId) => ({ lineId, words })) } as StropheProps);

  it("renders the accordion with its controls", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]) });
    expect(screen.getByText("Word and Line Counter")).toBeInTheDocument();
    expect(screen.getByText("Selected Words")).toBeInTheDocument();
    expect(screen.getByText("Selected Lines")).toBeInTheDocument();
    ["On", "Off", "Word Count", "Prosodic Units"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("shows zero when nothing is selected", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]) });
    expect(screen.getByTestId("selected-words-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-lines-count")).toHaveTextContent("0");
  });

  it("counts selected words and the distinct lines they touch", () => {
    setup({
      passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]),
      // two words on line 0, one on line 1 -> 3 words across 2 lines
      selectedWords: [cWord(1, 0), cWord(2, 0), cWord(3, 1)],
    });
    expect(screen.getByTestId("selected-words-count")).toHaveTextContent("3");
    expect(screen.getByTestId("selected-lines-count")).toHaveTextContent("2");
  });

  it("counts words and lines from a selected strophe", () => {
    setup({
      passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]),
      selectedStrophes: [cStrophe([[cWord(1, 0), cWord(2, 0)], [cWord(3, 1)]])],
    });
    expect(screen.getByTestId("selected-words-count")).toHaveTextContent("3");
    expect(screen.getByTestId("selected-lines-count")).toHaveTextContent("2");
  });

  it("greys out Word Count / Prosodic Units while the counter is off", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]), inTextCounterOn: false });
    expect(screen.getByRole("button", { name: "Word Count" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Prosodic Units" })).toBeDisabled();
  });

  it("enables Word Count / Prosodic Units when the counter is on", () => {
    setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]), inTextCounterOn: true });
    expect(screen.getByRole("button", { name: "Word Count" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Prosodic Units" })).toBeEnabled();
  });

  it("toggles the in-text counter through context", () => {
    const { ctxSetInTextCounterOn } = setup({ passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]) });
    fireEvent.click(screen.getByRole("button", { name: "On" }));
    expect(ctxSetInTextCounterOn).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Off" }));
    expect(ctxSetInTextCounterOn).toHaveBeenCalledWith(false);
  });

  it("switches the mode to prosodic units when the counter is on", () => {
    const { ctxSetCounterMode } = setup({
      passage: buildPassage([mkWord(1, ACCENT_CODEPOINTS.SOF_PASUQ)]),
      inTextCounterOn: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Prosodic Units" }));
    expect(ctxSetCounterMode).toHaveBeenCalledWith("units");
  });
});
