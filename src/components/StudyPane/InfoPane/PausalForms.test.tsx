/**
 * Behavioral tests for the "Pausal Forms" Structure sub-panel.
 *
 * The DB-backed useHighlightManager and the heavy StudyPane index ("..") are
 * mocked, and the embedded catalogue data module is stubbed with a tiny catalogue,
 * so we can drive the panel's own logic (catalogue gating, count, and the Smart
 * Highlight payload) in jsdom. `scan` is supplied directly as a ScanResult, so no
 * real Hebrew or accent scanning is needed.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import type { AccentSpans } from "@/lib/pausalForms";
import type { ScanResult } from "@/lib/poeticAccents";
import type { WordProps } from "@/lib/data";

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

vi.mock("..", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

// Replace the embedded catalogue with a tiny one so tests stay isolated from the
// real shipped data.
vi.mock("@/lib/pausalFormsData", () => ({
  PAUSAL_FORMS_RAW: ["Ps 1:1 Etnachta", "Ps 1:2 Sof Pasuq"].join("\n"),
}));

import PausalForms from "./PausalForms";
import { FormatContext } from "..";

const mkWord = (wordId: number, chapter: number, verse: number): WordProps =>
  ({ wordId, chapter, verse } as WordProps);

// One occurrence claiming a single token (its head), as scanAccents would emit.
const occ = (t: number) => ({ lead: [], head: [t], claims: [{ t, i: 0 }] });

// Build a ScanResult with just the spans the component reads, from
// accentId → token indices that carry it.
const mkScan = (byId: Record<string, number[]>): ScanResult => {
  const spans: AccentSpans = {};
  for (const [id, tokens] of Object.entries(byId)) {
    spans[id] = tokens.map(occ);
  }
  return { ids: [], underIds: [], counts: {}, spans } as ScanResult;
};

type Ctx = {
  allWords: WordProps[];
  scan: ScanResult;
  book?: string;
  inViewMode?: boolean;
};

const setup = ({ allWords, scan, book = "psalms", inViewMode = false }: Ctx) => {
  const ctxSetSelectedWords = vi.fn();
  const ctxSetNumSelectedWords = vi.fn();
  const ctxSetSelectedStrophes = vi.fn();

  const value = {
    ctxStudyBook: book,
    ctxSelectedWords: [],
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxWordsColorMap: new Map(),
    ctxStudyMetadata: { words: {} },
    ctxInViewMode: inViewMode,
  } as any;

  render(
    <FormatContext.Provider value={value}>
      <PausalForms allWords={allWords} scan={scan} />
    </FormatContext.Provider>,
  );

  return { ctxSetSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes };
};

describe("Pausal Forms panel", () => {
  beforeEach(() => {
    toggleHighlightMock.mockClear();
    highlightState.activeHighlightId = null;
  });

  it("renders the header and the All Pausal Forms label", () => {
    setup({ allWords: [mkWord(1, 1, 1)], scan: mkScan({ etnachta: [0] }) });
    expect(screen.getByText("Pausal Forms")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All Pausal Forms/ })).toBeInTheDocument();
  });

  it("disables the tool and shows a hint for non-Psalms books", () => {
    setup({ allWords: [mkWord(1, 1, 1)], scan: mkScan({ etnachta: [0] }), book: "genesis" });
    expect(screen.getByText(/Load Psalms to enable/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Smart Highlight/ })).toBeDisabled();
  });

  it("counts only words whose accent is catalogued for the verse", () => {
    setup({
      allWords: [mkWord(1, 1, 1), mkWord(2, 1, 2), mkWord(3, 1, 1)],
      // w1: etnachta @1:1 ✓, w2: sof-pasuq @1:2 ✓, w3: munach @1:1 ✗
      scan: mkScan({ etnachta: [0], "sof-pasuq": [1], munach: [2] }),
    });
    const label = screen.getByRole("button", { name: /All Pausal Forms/ });
    expect(within(label).getByText("2")).toBeInTheDocument();
  });

  it("applies a yellow fill highlight to exactly the pausal words on Smart Highlight", () => {
    const words = [mkWord(1, 1, 1), mkWord(2, 1, 2), mkWord(3, 1, 1)];
    setup({ allWords: words, scan: mkScan({ etnachta: [0], "sof-pasuq": [1], munach: [2] }) });

    const smart = screen.getByRole("button", { name: /Smart Highlight/ });
    expect(smart).toBeEnabled();
    fireEvent.click(smart);

    expect(toggleHighlightMock).toHaveBeenCalledTimes(1);
    const [highlightId, groups] = toggleHighlightMock.mock.calls[0];
    expect(highlightId).toBe("pausal-forms");
    expect(groups).toHaveLength(1);
    expect(groups[0].palette).toEqual({ fill: "#FFF176", border: "#FFF176", text: "#000000" });
    expect(groups[0].words.map((w: WordProps) => w.wordId)).toEqual([1, 2]);
  });

  it("clears the highlight when Smart Highlight is toggled while active", () => {
    highlightState.activeHighlightId = "pausal-forms";
    setup({ allWords: [mkWord(1, 1, 1)], scan: mkScan({ etnachta: [0] }) });

    const smart = screen.getByRole("button", { name: /Clear Highlight/ });
    expect(smart).toBeEnabled();
    fireEvent.click(smart);

    expect(toggleHighlightMock).toHaveBeenCalledWith("pausal-forms", []);
  });
});
