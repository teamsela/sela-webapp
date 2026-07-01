/**
 * Acceptance / regression suite for the Wordplay InfoPane panel.
 *
 * Verifies the observable behaviour required by the deck (p106): tool selector
 * (Shared Letters / Shared Sounds), run-scope selector, the "Possible Wordplays"
 * results list, tag toggles, and click-to-highlight wiring into the shared
 * smart-highlight context state.
 */
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// Mock the StudyPane index so importing FormatContext does not pull in the heavy
// StudyPane module (DB server actions, Passage, etc.).
vi.mock("..", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import Wordplay from "./Wordplay";
import { FormatContext } from "..";

// Build a WordProps-ish object with just the fields the engine/panel read.
const makeWord = (overrides: Record<string, unknown>) => ({
  wordId: overrides.wordId ?? overrides.strongNumber,
  stanzaId: 0,
  stropheId: 0,
  lineId: 0,
  chapter: 1,
  verse: 1,
  strongNumber: 0,
  wlcWord: "",
  gloss: "",
  metadata: {},
  motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
  ...overrides,
});

// Qever / Boqer share ק ב ר (3 lexical letters) → a Wordplay candidate.
// me.kha.mat / makh.ki.mat share ≥4 sounds → a Soundplay candidate.
const buildPassage = () => ({
  stanzaProps: [
    {
      strophes: [
        {
          lines: [
            {
              words: [
                makeWord({
                  strongNumber: 6913,
                  wlcWord: "קֶבֶר",
                  passageTransliteration: "qe.ver",
                  motifData: { lemma: "קֶבֶר", relatedStrongNums: undefined, categories: [] },
                  stropheId: 0,
                }),
                makeWord({
                  strongNumber: 1242,
                  wlcWord: "בֹּקֶר",
                  passageTransliteration: "bo.qer",
                  motifData: { lemma: "בֹּקֶר", relatedStrongNums: undefined, categories: [] },
                  stropheId: 0,
                }),
                makeWord({
                  strongNumber: 2450,
                  wlcWord: "מְכַמַּת",
                  passageTransliteration: "me.kha.mat",
                  motifData: { lemma: "מְכַמַּת", relatedStrongNums: undefined, categories: [] },
                  stropheId: 5,
                }),
                makeWord({
                  strongNumber: 2451,
                  wlcWord: "מַכְכִמַת",
                  passageTransliteration: "makh.ki.mat",
                  motifData: { lemma: "מַכְכִמַת", relatedStrongNums: undefined, categories: [] },
                  stropheId: 5,
                }),
              ],
            },
          ],
        },
      ],
    },
  ],
});

type CtxState = {
  highlightedSoundChipIds: string[];
  soundHighlightEnabled: boolean;
  highlightedLetterChipIds: string[];
  letterHighlightEnabled: boolean;
  selectedWords: unknown[];
  numSelectedWords: number;
};

const EMPTY: CtxState = {
  highlightedSoundChipIds: [],
  soundHighlightEnabled: false,
  highlightedLetterChipIds: [],
  letterHighlightEnabled: false,
  selectedWords: [],
  numSelectedWords: 0,
};

function Harness() {
  const [s, setS] = useState<CtxState>(EMPTY);
  const set = <K extends keyof CtxState>(key: K) => (v: CtxState[K]) =>
    setS((prev) => ({ ...prev, [key]: v }));

  const ctx = {
    ctxPassageProps: buildPassage(),
    ctxSelectedWords: s.selectedWords,
    ctxSetSelectedWords: set("selectedWords"),
    ctxSetNumSelectedWords: set("numSelectedWords"),
    ctxSetHighlightedSoundChipIds: set("highlightedSoundChipIds"),
    ctxSetSoundHighlightEnabled: set("soundHighlightEnabled"),
    ctxSetSelectedSoundChipIds: () => {},
    ctxSetHighlightedLetterChipIds: set("highlightedLetterChipIds"),
    ctxSetLetterHighlightEnabled: set("letterHighlightEnabled"),
    ctxSetSelectedLetterChipIds: () => {},
  };

  return (
    <FormatContext.Provider value={ctx as any}>
      <pre data-testid="ctx-state">{JSON.stringify(s)}</pre>
      <Wordplay />
    </FormatContext.Provider>
  );
}

function readState(): CtxState {
  return JSON.parse(screen.getByTestId("ctx-state").textContent || "{}");
}

const resultsRegion = () => screen.getByLabelText("Possible wordplays results");

// Find the candidate <button> whose row text contains the given Hebrew word.
function candidateWith(text: string): HTMLElement {
  const buttons = within(resultsRegion()).getAllByRole("button");
  const match = buttons.find((b) => b.textContent?.includes(text));
  if (!match) throw new Error(`no candidate row containing ${text}`);
  return match;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("Wordplay panel — default (Shared Letters)", () => {
  it("renders the Possible Wordplays header and the Qever/Boqer candidate", () => {
    render(<Harness />);
    expect(screen.getByText("Possible Wordplays")).toBeInTheDocument();
    // default tool is Shared Letters (wordplay): Qever/Boqer share 3 letters.
    const results = resultsRegion();
    expect(within(results).getByText(/קֶבֶר/)).toBeInTheDocument();
    expect(within(results).getByText(/בֹּקֶר/)).toBeInTheDocument();
    // Qever/Boqer is the first candidate; the mekhamat/makhkimat lemmas also share
    // ≥3 letters, so the default Shared-Letters list holds two candidates.
    expect(within(results).getAllByRole("button").length).toBeGreaterThanOrEqual(1);
  });

  it("clicking a candidate enables the letter highlight with the shared letter ids", () => {
    render(<Harness />);
    const candidate = candidateWith("קֶבֶר"); // Qever/Boqer row
    fireEvent.click(candidate);

    const st = readState();
    expect(st.letterHighlightEnabled).toBe(true);
    expect(st.soundHighlightEnabled).toBe(false);
    // shares qof, bet, resh
    expect(st.highlightedLetterChipIds.sort()).toEqual(["bet", "qof", "resh"]);
  });

  it("clicking the active candidate again clears the highlight", () => {
    render(<Harness />);
    const candidate = candidateWith("קֶבֶר");
    fireEvent.click(candidate);
    expect(readState().letterHighlightEnabled).toBe(true);
    fireEvent.click(candidate);
    expect(readState().letterHighlightEnabled).toBe(false);
    expect(readState().highlightedLetterChipIds).toEqual([]);
  });
});

describe("Wordplay panel — tool switch", () => {
  it("switching to Shared Sounds shows the soundplay candidate and uses sound highlight", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Shared Sounds" }));

    const results = resultsRegion();
    // me.kha.mat / makh.ki.mat is the soundplay pair.
    expect(within(results).getByText(/מְכַמַּת/)).toBeInTheDocument();

    fireEvent.click(within(results).getAllByRole("button")[0]);
    const st = readState();
    expect(st.soundHighlightEnabled).toBe(true);
    expect(st.letterHighlightEnabled).toBe(false);
    expect(st.highlightedSoundChipIds.length).toBeGreaterThan(0);
  });
});

describe("Wordplay panel — run scope", () => {
  it("±2 strophes around the default focus (strophe 0) drops far-apart pairs", () => {
    render(<Harness />);
    // Switch to sounds: the only sound pair sits in strophe 5, far from focus 0.
    fireEvent.click(screen.getByRole("tab", { name: "Shared Sounds" }));
    expect(within(resultsRegion()).getAllByRole("button").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "±2 strophes" }));
    // With focus strophe 0 and radius 2, the strophe-5 pair is excluded.
    expect(
      within(resultsRegion()).queryByText(/מְכַמַּת/),
    ).not.toBeInTheDocument();
  });
});

describe("Wordplay panel — primary tag filter", () => {
  it("disabling the '3 root letters' tier hides the 3-letter candidate", () => {
    render(<Harness />);
    expect(within(resultsRegion()).getByText(/קֶבֶר/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "3 root letters" }));
    expect(within(resultsRegion()).queryByText(/קֶבֶר/)).not.toBeInTheDocument();
  });

  it("clears an active candidate's highlight when a filter hides it (stale-highlight guard)", () => {
    render(<Harness />);
    fireEvent.click(candidateWith("קֶבֶר"));
    expect(readState().letterHighlightEnabled).toBe(true);
    // Disabling the tier filters the active candidate out → highlight must clear.
    fireEvent.click(screen.getByRole("button", { name: "3 root letters" }));
    expect(within(resultsRegion()).queryByText(/קֶבֶר/)).not.toBeInTheDocument();
    expect(readState().letterHighlightEnabled).toBe(false);
    expect(readState().highlightedLetterChipIds).toEqual([]);
  });
});

describe("Wordplay panel — tooltip", () => {
  it("opens and closes the info dialog", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "About wordplay" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Shared Hebrew Letters/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
