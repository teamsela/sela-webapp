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
import type { PassageProps, WordProps } from "@/lib/data";

// Stub useHighlightManager so we don't pull in server actions / DB code.
const { toggleHighlightMock } = vi.hoisted(() => ({ toggleHighlightMock: vi.fn() }));
vi.mock("./useHighlightManager", () => ({
  useHighlightManager: () => ({ toggleHighlight: toggleHighlightMock, activeHighlightId: null }),
}));

// Mock the StudyPane index so importing FormatContext is cheap.
vi.mock("..", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import Structure from "./Structure";
import { FormatContext } from "..";

const BET = 0x05d1;
// Each word gets a unique verse to keep single marks from pairing across words.
const mkWord = (wordId: number, ...marks: number[]): WordProps =>
  ({ wordId, wlcWord: String.fromCharCode(BET, ...marks), chapter: 1, verse: wordId } as WordProps);

const buildPassage = (words: WordProps[]): PassageProps =>
  ({ stanzaProps: [{ strophes: [{ lines: [{ words }] }] }] } as unknown as PassageProps);

type Ctx = {
  passage: PassageProps;
  book?: string;
  selectedWords?: WordProps[];
  inViewMode?: boolean;
};

const setup = ({ passage, book = "psalms", selectedWords = [], inViewMode = false }: Ctx) => {
  const ctxSetSelectedWords = vi.fn();
  const ctxSetNumSelectedWords = vi.fn();
  const ctxSetSelectedStrophes = vi.fn();
  const ctxSetUnderlinedWordIds = vi.fn();

  const value = {
    ctxPassageProps: passage,
    ctxStudyBook: book,
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxSetUnderlinedWordIds,
    ctxWordsColorMap: new Map(),
    ctxStudyMetadata: { words: {} },
    ctxInViewMode: inViewMode,
  } as any;

  render(
    <FormatContext.Provider value={value}>
      <Structure />
    </FormatContext.Provider>,
  );

  return { ctxSetSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes, ctxSetUnderlinedWordIds };
};

const catButton = (name: RegExp) => screen.getByRole("button", { name });

describe("Structure panel — Accents in Poetry", () => {
  beforeEach(() => {
    toggleHighlightMock.mockClear();
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

  it("Smart Highlight colors ALL non-empty categories at once with the hardcoded palette", () => {
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
    expect(Object.keys(byLabel).sort()).toEqual(["conjunctive-head", "level-1-head", "level-2-head"]);
    expect(byLabel["level-1-head"].palette).toMatchObject({ fill: "#B71C1C", text: "#FFFFFF" });
    expect(byLabel["level-2-head"].palette).toMatchObject({ fill: "#D32F2F", text: "#FFFFFF" });
    expect(byLabel["conjunctive-head"].palette).toMatchObject({ fill: "#C8E6C9" });
    expect(byLabel["level-1-head"].words.map((w: WordProps) => w.wordId)).toEqual([1]);
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
});
