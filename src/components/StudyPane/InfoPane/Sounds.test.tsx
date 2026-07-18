/**
 * Regression suite for the Sounds InfoPane.
 *
 * The Sound and Letter distributions are mirror images: toggle-highlight,
 * Escape-to-close, click-outside-deselect, the count memos and the createPortal
 * tooltip modal each exist twice. This suite pins the OBSERVABLE behavior of both
 * sides so the planned refactor (sharing one implementation via a config object)
 * can be proven regression-free: the exact same tests must pass before and after.
 */
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// Mock the StudyPane index (".." from Sounds.tsx) so importing FormatContext does
// NOT pull in the heavy StudyPane module (DB server actions, Passage, etc.).
vi.mock("..", async () => {
  const ReactMod = await import("react");
  return { FormatContext: ReactMod.createContext({} as any) };
});

import Sounds from "./Sounds";
import { FormatContext } from "..";
import { SOUND_CHIPS, LETTER_CHIP_GROUPS } from "@/lib/hebrewHighlights";

// ---------------------------------------------------------------------------
// Stateful harness: holds every ctx* value the Sounds component reads/writes so
// that clicks produce real React state transitions we can assert on. The live
// context state is mirrored into a hidden <pre> for deterministic readback.
// ---------------------------------------------------------------------------

type CtxState = {
  selectedSoundChipIds: string[];
  highlightedSoundChipIds: string[];
  soundHighlightEnabled: boolean;
  selectedLetterChipIds: string[];
  highlightedLetterChipIds: string[];
  letterHighlightEnabled: boolean;
  numSelectedWords: number;
};

const EMPTY_STATE: CtxState = {
  selectedSoundChipIds: [],
  highlightedSoundChipIds: [],
  soundHighlightEnabled: false,
  selectedLetterChipIds: [],
  highlightedLetterChipIds: [],
  letterHighlightEnabled: false,
  numSelectedWords: 0,
};

// A tiny passage: the word מָמָ (two mem) transliterated "mama" (two m). Lets us
// exercise both count memos from a single known word.
const PASSAGE_PROPS = {
  stanzaProps: [
    {
      strophes: [
        {
          lines: [
            {
              words: [
                { wlcWord: "מָמָ", passageTransliteration: "mama" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function Harness({ initial }: { initial?: Partial<CtxState> }) {
  const [s, setS] = useState<CtxState>({ ...EMPTY_STATE, ...initial });

  const patch = (p: Partial<CtxState>) => setS((prev) => ({ ...prev, ...p }));
  const asSetter =
    <K extends keyof CtxState>(key: K) =>
    (v: CtxState[K] | ((prev: CtxState[K]) => CtxState[K])) =>
      setS((prev) => ({
        ...prev,
        [key]: typeof v === "function" ? (v as any)(prev[key]) : v,
      }));

  const ctx = {
    ctxPassageProps: PASSAGE_PROPS,
    // Read Aloud (TTS) fields the merged Sounds component reads. No playback
    // happens in tests; empty selections keep the Read Aloud section inert.
    ctxSelectedWords: [],
    ctxSelectedStrophes: [],
    ctxSetCurrentSpokenWordIds: () => {},
    ctxSelectedSoundChipIds: s.selectedSoundChipIds,
    ctxSetSelectedSoundChipIds: asSetter("selectedSoundChipIds"),
    ctxHighlightedSoundChipIds: s.highlightedSoundChipIds,
    ctxSetHighlightedSoundChipIds: asSetter("highlightedSoundChipIds"),
    ctxSoundHighlightEnabled: s.soundHighlightEnabled,
    ctxSetSoundHighlightEnabled: asSetter("soundHighlightEnabled"),
    ctxSelectedLetterChipIds: s.selectedLetterChipIds,
    ctxSetSelectedLetterChipIds: asSetter("selectedLetterChipIds"),
    ctxHighlightedLetterChipIds: s.highlightedLetterChipIds,
    ctxSetHighlightedLetterChipIds: asSetter("highlightedLetterChipIds"),
    ctxLetterHighlightEnabled: s.letterHighlightEnabled,
    ctxSetLetterHighlightEnabled: asSetter("letterHighlightEnabled"),
    ctxSetSelectedWords: () => patch({}),
    ctxSetNumSelectedWords: asSetter("numSelectedWords"),
  };

  return (
    <FormatContext.Provider value={ctx as any}>
      <div data-testid="outside">outside the accordion</div>
      <pre data-testid="ctx-state">{JSON.stringify(s)}</pre>
      <Sounds />
    </FormatContext.Provider>
  );
}

function renderHarness(initial?: Partial<CtxState>) {
  render(<Harness initial={initial} />);
}

function readState(): CtxState {
  return JSON.parse(screen.getByTestId("ctx-state").textContent || "{}");
}

// Return the chip <button> whose label span has exactly `label`.
function chipButton(label: string): HTMLButtonElement {
  const spans = screen.getAllByText(label, { selector: "span.text-black" });
  const btn = spans[0].closest("button");
  if (!btn) throw new Error(`chip button not found for label ${label}`);
  return btn as HTMLButtonElement;
}

function openLetterSection() {
  fireEvent.click(screen.getByText("Hebrew Letters Distribution"));
}

// The merged Sounds tab opens the "Read Aloud" section first, so the Sound
// Distribution body (chips + highlight button) must be expanded explicitly.
function openSoundSection() {
  fireEvent.click(screen.getByText("Hebrew Sound Distribution"));
}

const SOUND_IDS = SOUND_CHIPS.map((c) => c.id);
const LETTER_GROUP_MEMBERS = LETTER_CHIP_GROUPS.flatMap((g) => g.memberIds);

beforeEach(() => {
  document.body.innerHTML = "";
});

// ===========================================================================
// 1. toggleSoundHighlight / toggleLetterHighlight  (mirror pair :236 / :259)
// ===========================================================================

describe("toggle highlight — sound", () => {
  it("with chips selected: merges into highlighted, enables sound, clears all letter state and selection", () => {
    renderHarness({
      selectedSoundChipIds: ["m"],
      highlightedSoundChipIds: ["l"],
      // pre-existing letter highlight that must be cleared
      highlightedLetterChipIds: ["mem"],
      letterHighlightEnabled: true,
      selectedLetterChipIds: ["nun"],
    });
    openSoundSection();

    fireEvent.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const st = readState();
    expect(st.highlightedSoundChipIds.sort()).toEqual(["l", "m"]);
    expect(st.soundHighlightEnabled).toBe(true);
    expect(st.selectedSoundChipIds).toEqual([]);
    // letter side fully cleared
    expect(st.selectedLetterChipIds).toEqual([]);
    expect(st.highlightedLetterChipIds).toEqual([]);
    expect(st.letterHighlightEnabled).toBe(false);
  });

  it("with nothing selected but highlight enabled: clears the highlight (Clear → off)", () => {
    renderHarness({ soundHighlightEnabled: true, highlightedSoundChipIds: ["m", "l"] });
    openSoundSection();

    fireEvent.click(screen.getByRole("button", { name: "Clear Highlight" }));

    const st = readState();
    expect(st.highlightedSoundChipIds).toEqual([]);
    expect(st.soundHighlightEnabled).toBe(false);
  });

  it("with nothing selected and nothing highlighted: highlights ALL sound chips and clears letters", () => {
    renderHarness({ highlightedLetterChipIds: ["mem"], letterHighlightEnabled: true });
    openSoundSection();

    fireEvent.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const st = readState();
    expect(st.highlightedSoundChipIds.sort()).toEqual([...SOUND_IDS].sort());
    expect(st.soundHighlightEnabled).toBe(true);
    expect(st.highlightedLetterChipIds).toEqual([]);
    expect(st.letterHighlightEnabled).toBe(false);
  });
});

describe("toggle highlight — letter", () => {
  it("with chips selected: merges into highlighted, enables letter, clears all sound state and selection", () => {
    renderHarness({
      selectedLetterChipIds: ["mem"],
      highlightedLetterChipIds: ["lamed"],
      highlightedSoundChipIds: ["m"],
      soundHighlightEnabled: true,
      selectedSoundChipIds: ["n"],
    });
    openLetterSection();

    fireEvent.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const st = readState();
    expect(st.highlightedLetterChipIds.sort()).toEqual(["lamed", "mem"]);
    expect(st.letterHighlightEnabled).toBe(true);
    expect(st.selectedLetterChipIds).toEqual([]);
    // sound side fully cleared
    expect(st.selectedSoundChipIds).toEqual([]);
    expect(st.highlightedSoundChipIds).toEqual([]);
    expect(st.soundHighlightEnabled).toBe(false);
  });

  it("with nothing selected but highlight enabled: clears the highlight (Clear → off)", () => {
    renderHarness({ letterHighlightEnabled: true, highlightedLetterChipIds: ["mem", "lamed"] });
    openLetterSection();

    fireEvent.click(screen.getByRole("button", { name: "Clear Highlight" }));

    const st = readState();
    expect(st.highlightedLetterChipIds).toEqual([]);
    expect(st.letterHighlightEnabled).toBe(false);
  });

  it("with nothing selected and nothing highlighted: highlights ALL letter members and clears sounds", () => {
    renderHarness({ highlightedSoundChipIds: ["m"], soundHighlightEnabled: true });
    openLetterSection();

    fireEvent.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const st = readState();
    expect(st.highlightedLetterChipIds.sort()).toEqual([...LETTER_GROUP_MEMBERS].sort());
    expect(st.letterHighlightEnabled).toBe(true);
    expect(st.highlightedSoundChipIds).toEqual([]);
    expect(st.soundHighlightEnabled).toBe(false);
  });
});

// ===========================================================================
// 2. chip selection toggles (toggleSoundChip / toggleLetterChip)
// ===========================================================================

describe("chip selection", () => {
  it("sound chip click toggles its id in selectedSoundChipIds", () => {
    renderHarness();
    openSoundSection();
    fireEvent.click(chipButton("m"));
    expect(readState().selectedSoundChipIds).toEqual(["m"]);
    fireEvent.click(chipButton("m"));
    expect(readState().selectedSoundChipIds).toEqual([]);
  });

  it("letter group click toggles all its memberIds together", () => {
    renderHarness();
    openLetterSection();
    fireEvent.click(chipButton("מ ם")); // mem-group → ["mem","final-mem"]
    expect(readState().selectedLetterChipIds.sort()).toEqual(["final-mem", "mem"]);
    fireEvent.click(chipButton("מ ם"));
    expect(readState().selectedLetterChipIds).toEqual([]);
  });
});

// ===========================================================================
// 3. count memos  (soundCounts :193 / letterCounts :206)
// ===========================================================================

describe("count memos", () => {
  it("sound 'm' chip shows the transliteration occurrence count (2 for 'mama')", () => {
    renderHarness();
    openSoundSection();
    expect(within(chipButton("m")).getByText("2")).toBeInTheDocument();
  });

  it("letter 'מ ם' group shows the Hebrew occurrence count (2 mem in מָמָ)", () => {
    renderHarness();
    openLetterSection();
    expect(within(chipButton("מ ם")).getByText("2")).toBeInTheDocument();
  });
});

// ===========================================================================
// 4. createPortal tooltip modal  (sound :315 / letter :403)
// ===========================================================================

describe("tooltip modal — open / content / close", () => {
  it("sound: info button opens dialog with the sound title; X closes it", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "About sound distribution" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Hebrew Sound Distribution")).toBeInTheDocument();
    expect(within(dialog).getByText(/sound patterns and sound echoes/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("letter: info button opens dialog with the letter title; X closes it", () => {
    renderHarness();
    openLetterSection();
    fireEvent.click(screen.getByRole("button", { name: "About letter distribution" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Hebrew Letters Distribution")).toBeInTheDocument();
    expect(within(dialog).getByText(/visual literary patterns and letter echoes/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking the overlay backdrop closes the dialog (sound)", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "About sound distribution" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog); // target === currentTarget (the backdrop)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ===========================================================================
// 5. Escape-key handlers  (sound :129 / letter :138)
// ===========================================================================

describe("Escape closes the tooltip", () => {
  it("sound tooltip closes on Escape", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: "About sound distribution" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("letter tooltip closes on Escape", () => {
    renderHarness();
    openLetterSection();
    fireEvent.click(screen.getByRole("button", { name: "About letter distribution" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ===========================================================================
// 6. click-outside-to-deselect handlers  (sound :158 / letter :171)
// ===========================================================================

describe("click outside deselects chips", () => {
  it("sound: clicking outside the section clears selectedSoundChipIds", () => {
    renderHarness();
    openSoundSection();
    fireEvent.click(chipButton("m"));
    expect(readState().selectedSoundChipIds).toEqual(["m"]);
    fireEvent.click(screen.getByTestId("outside"));
    expect(readState().selectedSoundChipIds).toEqual([]);
  });

  it("letter: clicking outside the section clears selectedLetterChipIds", () => {
    renderHarness();
    openLetterSection();
    fireEvent.click(chipButton("מ ם"));
    expect(readState().selectedLetterChipIds.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId("outside"));
    expect(readState().selectedLetterChipIds).toEqual([]);
  });

  it("sound: an open tooltip suppresses click-outside deselect", () => {
    renderHarness();
    openSoundSection();
    fireEvent.click(chipButton("m"));
    fireEvent.click(screen.getByRole("button", { name: "About sound distribution" }));
    // With the tooltip open, an outside click must NOT clear the selection.
    fireEvent.click(screen.getByTestId("outside"));
    expect(readState().selectedSoundChipIds).toEqual(["m"]);
  });
});
