import React, { useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ContextType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type {
  ColorData,
  ColorSource,
  PassageProps,
  StropheProps,
  StudyMetadata,
  WordProps,
} from "@/lib/data";
import {
  BoxDisplayStyle,
  ColorActionType,
  LanguageMode,
  NonEnglishDisplayMode,
  StructureUpdateType,
} from "@/lib/types";
import type { HistoryEntry, HistorySnapshotOptions } from "../..";
import type { PersonGenderNumberCode } from "@/lib/personGenderNumber";

// Replace only the root provider and server/browser boundaries, not Syntax,
// its highlight manager, its morphology parser, or the rendered WordBlock.
vi.mock("../..", async () => {
  const { createContext } = await import("react");
  const colors = await import("@/lib/colors");
  return {
    FormatContext: createContext({} as ContextType<typeof import("../..").FormatContext>),
    DEFAULT_COLOR_FILL: colors.DEFAULT_COLOR_FILL,
    DEFAULT_BORDER_COLOR: colors.DEFAULT_BORDER_COLOR,
    DEFAULT_TEXT_COLOR: colors.DEFAULT_TEXT_COLOR,
  };
});

vi.mock("../../Passage/PassageBlock", async () => {
  const { createContext } = await import("react");
  return {
    LanguageContext: createContext<
      ContextType<typeof import("../../Passage/PassageBlock").LanguageContext>
    >({ ctxIsHebrew: false, ctxDisplayMode: "gloss" }),
  };
});

vi.mock("@/lib/actions", () => ({
  updateMetadataInDb: vi.fn().mockResolvedValue(undefined),
}));

import { updateMetadataInDb } from "@/lib/actions";
import { useDragToSelect } from "@/hooks/useDragToSelect";
import { getPersonGenderNumberHighlightState } from "@/lib/personGenderNumber";
import { FormatContext } from "../..";
import { WordBlock } from "../../Passage/WordBlock";
import Syntax from ".";

type FormatState = ContextType<typeof FormatContext>;

// Literal acceptance oracle from PDF pages 121-126, independent of production
// palette constants and matching helpers. The order is the two-column row order.
const PRESETS = [
  { code: "3ms", gloss: "He Him His", fill: "#BBDEFB", text: "#666666" },
  { code: "3mp", gloss: "They Them Their", fill: "#F8BBD0", text: "#666666" },
  { code: "2ms", gloss: "You Your", fill: "#3F51B5", text: "#FFFFFF" },
  { code: "2mp", gloss: "You Your", fill: "#E91E63", text: "#FFFFFF" },
  { code: "1cs", gloss: "I Me My", fill: "#FFF9C4", text: "#666666" },
  { code: "1cp", gloss: "We Us Our", fill: "#FFD54F", text: "#666666" },
  { code: "2fs", gloss: "You Your (f)", fill: "#9C27B0", text: "#FFFFFF" },
  { code: "2fp", gloss: "You Your (f)", fill: "#607D8B", text: "#FFFFFF" },
  { code: "3fs", gloss: "She Her Her", fill: "#E1BEE7", text: "#666666" },
  { code: "3fp", gloss: "They Them Their (f)", fill: "#CFD8DC", text: "#666666" },
] as const;

type Code = (typeof PRESETS)[number]["code"];
const ALL_SCOPE = "person-gender-number__3ms,3mp,2ms,2mp,1cs,1cp,2fs,2fp,3fs,3fp";
const STUDY_ID = "syntax-acceptance-study";
const STUDY_NOTES = '{"main":"Preserve these study notes"}';
const originalDialogMethods = {
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal"),
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close"),
};
const NO_HIGHLIGHTS: Record<ColorSource, string | null> = {
  syntax: null, motif: null, structure: null, pausal: null,
};
const noop = () => {};
let originalUserSelect: string;

function makeWord(wordId: number, morphology?: string): WordProps {
  return {
    wordId, morphology,
    stanzaId: 1, stropheId: 1, lineId: 1, chapter: 1, verse: 1,
    strongNumber: 1, wlcWord: "", passageTransliteration: "",
    gloss: `word-${wordId}`, ETCBCgloss: undefined, metadata: {},
    newLine: false, BSBnewLine: false, newVerse: false, showVerseNum: false,
    firstWordInStrophe: false, firstStropheInStanza: false, lastStropheInStanza: false,
    motifData: { lemma: "", relatedStrongNums: undefined, categories: [] },
  };
}

function makeWords(): WordProps[] {
  return [
    ...PRESETS.map(({ code }, index) => makeWord(index + 1, `Pro-${code}`)),
    makeWord(11, "V-Piel-Imperf.h-1cs | 2ms"),
    makeWord(12, "V-Qal-Imperf-3ms + S-1cp"),
    makeWord(13, "Pro-3ms | 3ms + S-3ms"),
    makeWord(14, "N-ms"),
    makeWord(15, "N-3msX"),
    makeWord(16, "N-X3ms"),
    makeWord(17, "N-3msp"),
    makeWord(18),
    makeWord(19, ""),
    {
      ...makeWord(20, "N-ms"),
      gloss: "3mp 3fp 2fp",
      wordInformation: {
        hebrew: "", transliteration: "3ms", gloss: "2ms",
        morphology: "Pro-3fs", strongsNumber: "1", meaning: "1cp",
      },
    },
  ];
}

function makePassage(words: WordProps[]): PassageProps {
  const stanzaProps = [words.slice(0, 6), words.slice(6)]
    .filter((stanzaWords) => stanzaWords.length > 0)
    .map((stanzaWords, stanzaIndex) => ({
      stanzaId: stanzaIndex + 1,
      metadata: {},
      strophes: [stanzaWords.slice(0, 3), stanzaWords.slice(3)]
        .filter((stropheWords) => stropheWords.length > 0)
        .map((stropheWords, stropheIndex) => ({
          stropheId: stanzaIndex * 2 + stropheIndex + 1,
          metadata: {},
          lines: stropheWords.map((word) => ({ lineId: word.wordId, words: [word] })),
        })),
    }));
  return {
    stanzaProps,
    stanzaCount: stanzaProps.length,
    stropheCount: stanzaProps.reduce((count, stanza) => count + stanza.strophes.length, 0),
  };
}

type HarnessOptions = {
  words?: WordProps[];
  metadata?: StudyMetadata;
  colorMap?: Map<number, ColorData>;
  selectedWords?: WordProps[];
  inViewMode?: boolean;
};

function PassageWithDragSelection({ words }: { words: WordProps[] }) {
  const { ctxPassageProps } = useContext(FormatContext);
  const { containerRef, handleMouseDown } = useDragToSelect(ctxPassageProps);
  return (
    <div data-testid="passage" ref={containerRef} onMouseDown={handleMouseDown}>
      {words.map((word) => <WordBlock key={word.wordId} wordProps={word} />)}
    </div>
  );
}

function Harness({
  words: initialWords,
  metadata: initialMetadata = { words: {} },
  colorMap: initialColorMap = new Map(),
  selectedWords: initialSelectedWords = [],
  inViewMode = false,
  onContext,
  onHistory,
}: HarnessOptions & {
  onContext: (context: FormatState) => void;
  onHistory: (metadata: StudyMetadata, options?: HistorySnapshotOptions) => void;
}) {
  const [words] = useState(() => initialWords ?? makeWords());
  const [metadata, setMetadata] = useState(() => structuredClone(initialMetadata));
  const [initialHighlight] = useState(() => getPersonGenderNumberHighlightState(initialMetadata, words));
  const [colorMap, setColorMap] = useState(
    () => structuredClone(initialHighlight?.wordsColorMap ?? initialColorMap),
  );
  const [selectedWords, setSelectedWords] = useState(initialSelectedWords);
  const [selectedCodes, setSelectedCodes] = useState<PersonGenderNumberCode[]>([]);
  const [syntaxVisible, setSyntaxVisible] = useState(true);
  const [numSelectedWords, setNumSelectedWords] = useState(initialSelectedWords.length);
  const [selectedStrophes, setSelectedStrophes] = useState<StropheProps[]>([
    { stropheId: 99, metadata: {}, lines: [] },
  ]);
  const [activeIds, setActiveIds] = useState({
    ...NO_HIGHLIGHTS,
    syntax: initialHighlight?.highlightId ?? null,
  });
  const highlightCacheRef = useRef<HistoryEntry["highlightCache"]>(
    initialHighlight
      ? new Map([[`syntax::${initialHighlight.highlightId}`, initialHighlight.originalColors]])
      : new Map(),
  );
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [colorAction, setColorAction] = useState(ColorActionType.none);
  const [pointer, setPointer] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(() => [{
    metadata: structuredClone(initialMetadata),
    wordsColorMap: structuredClone(colorMap),
    activeHighlightIds: { ...activeIds },
    highlightCache: structuredClone(highlightCacheRef.current),
  }]);

  // StudyPane merges the latest metadata into passage words on state changes.
  const renderedWords = useMemo(
    () => words.map((word) => ({ ...word, metadata: metadata.words[word.wordId] ?? {} })),
    [words, metadata],
  );
  const passage = useMemo(() => makePassage(renderedWords), [renderedWords]);

  const addToHistory: FormatState["ctxAddToHistory"] = (nextMetadata, options) => {
    const snapshot: HistoryEntry = structuredClone({
      metadata: nextMetadata,
      wordsColorMap: options?.wordsColorMap ?? colorMap,
      activeHighlightIds: options?.activeHighlightIds ?? activeIds,
      highlightCache: options?.highlightCache ?? highlightCacheRef.current,
    });
    onHistory(structuredClone(nextMetadata), structuredClone(options));
    setHistory([...history.slice(0, pointer + 1), snapshot]);
    setPointer(pointer + 1);
  };

  const context: FormatState = {
    ctxStudyId: STUDY_ID,
    ctxStudyMetadata: metadata,
    ctxSetStudyMetadata: setMetadata,
    ctxStudyNotes: STUDY_NOTES,
    ctxSetStudyNotes: noop,
    ctxStudyBook: "Psalms",
    ctxPassageProps: passage,
    ctxSetPassageProps: noop,
    ctxScaleValue: 1,
    ctxIsHebrew: false,
    ctxSetIsHebrew: noop,
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords: setSelectedWords,
    ctxNumSelectedWords: numSelectedWords,
    ctxSetNumSelectedWords: setNumSelectedWords,
    ctxSelectedPersonGenderNumberCodes: selectedCodes,
    ctxSetSelectedPersonGenderNumberCodes: setSelectedCodes,
    ctxSelectedStrophes: selectedStrophes,
    ctxSetSelectedStrophes: setSelectedStrophes,
    ctxNumSelectedStrophes: selectedStrophes.length,
    ctxSetNumSelectedStrophes: noop,
    ctxNumSelectedLayers: 0,
    ctxSetNumSelectedLayers: noop,
    ctxColorAction: colorAction,
    ctxSetColorAction: setColorAction,
    ctxSelectedColor: "",
    ctxSetSelectedColor: noop,
    ctxColorFill: "#FFFFFF",
    ctxSetColorFill: noop,
    ctxBorderColor: "#D9D9D9",
    ctxSetBorderColor: noop,
    ctxTextColor: "#525252",
    ctxSetTextColor: noop,
    ctxBoxDisplayConfig: { style: BoxDisplayStyle.box },
    ctxIndentNum: 0,
    ctxSetIndentNum: noop,
    ctxInViewMode: inViewMode,
    ctxEditingWordId: editingWordId,
    ctxSetEditingWordId: setEditingWordId,
    ctxStructureUpdateType: StructureUpdateType.none,
    ctxSetStructureUpdateType: noop,
    ctxActiveHighlightIds: activeIds,
    ctxSetActiveHighlightId: (source, id) => setActiveIds((previous) => ({ ...previous, [source]: id })),
    ctxHighlightCacheRef: highlightCacheRef,
    ctxWordsColorMap: colorMap,
    ctxSetWordsColorMap: setColorMap,
    ctxHistory: history,
    ctxPointer: pointer,
    ctxSetPointer: setPointer,
    ctxAddToHistory: addToHistory,
    ctxLanguageMode: LanguageMode.English,
    ctxSetLanguageMode: noop,
    ctxNonEnglishDisplayMode: NonEnglishDisplayMode.Hebrew,
    ctxSetNonEnglishDisplayMode: noop,
    ctxInTextCounterOn: false,
    ctxSetInTextCounterOn: noop,
    ctxCounterMode: "words",
    ctxSetCounterMode: noop,
    ctxSelectedSoundChipIds: [],
    ctxSetSelectedSoundChipIds: noop,
    ctxHighlightedSoundChipIds: [],
    ctxSetHighlightedSoundChipIds: noop,
    ctxSoundHighlightEnabled: false,
    ctxSetSoundHighlightEnabled: noop,
    ctxSelectedLetterChipIds: [],
    ctxSetSelectedLetterChipIds: noop,
    ctxHighlightedLetterChipIds: [],
    ctxSetHighlightedLetterChipIds: noop,
    ctxLetterHighlightEnabled: false,
    ctxSetLetterHighlightEnabled: noop,
    ctxNoteBox: undefined,
    ctxSetNoteBox: noop,
    ctxNoteMerge: true,
    ctxSetNoteMerge: noop,
    ctxActiveNotesPane: null,
    ctxSetActiveNotesPane: noop,
    ctxStropheNoteBtnOn: false,
    ctxSetStropheNoteBtnOn: noop,
    ctxReadmeBtnOn: false,
    ctxSetReadmeBtnOn: noop,
    ctxLayers: [{ id: 0, name: "Default", fill: "#D9D9D9", border: "transparent", text: "#000000" }],
    ctxSetLayers: noop,
    ctxActiveLayerId: metadata.activeLayerId ?? 0,
    ctxSwitchLayer: noop,
    ctxCreateLayer: noop,
    ctxDeleteLayer: noop,
    ctxCurrentSpokenWordIds: [],
    ctxSetCurrentSpokenWordIds: noop,
    ctxAccentBorderWordIds: [],
    ctxSetAccentBorderWordIds: noop,
  };

  useLayoutEffect(() => onContext(context));

  const restoreSnapshot = (nextPointer: number) => {
    const entry = structuredClone(history[nextPointer]);
    setMetadata(entry.metadata);
    setColorMap(entry.wordsColorMap);
    setActiveIds(entry.activeHighlightIds);
    highlightCacheRef.current = entry.highlightCache;
    setPointer(nextPointer);
  };

  return (
    <FormatContext.Provider value={context}>
      <button className="ClickBlock" disabled={pointer === 0} onClick={() => restoreSnapshot(pointer - 1)}>
        Restore previous snapshot
      </button>
      <button className="ClickBlock" disabled={pointer === history.length - 1} onClick={() => restoreSnapshot(pointer + 1)}>
        Restore next snapshot
      </button>
      <button onClick={() => {
        setSelectedWords([]);
        setNumSelectedWords(0);
        setSelectedStrophes([]);
      }}>
        Clear word selection
      </button>
      <button className="ClickBlock" onClick={() => setSyntaxVisible((visible) => !visible)}>
        {syntaxVisible ? "Switch away from Syntax" : "Return to Syntax"}
      </button>
      {syntaxVisible && <Syntax />}
      <PassageWithDragSelection words={renderedWords} />
    </FormatContext.Provider>
  );
}

function renderHarness(options: HarnessOptions = {}) {
  let current: FormatState | undefined;
  const historySpy = vi.fn<FormatState["ctxAddToHistory"]>();
  const result = render(
    <Harness {...options} onContext={(context) => { current = context; }} onHistory={historySpy} />,
  );
  return {
    ...result,
    historySpy,
    user: userEvent.setup(),
    context: () => {
      if (!current) throw new Error("The stateful StudyPane harness has not rendered");
      return current;
    },
  };
}

const saveMetadata = vi.mocked(updateMetadataInDb);

function lastSavedMetadata(): StudyMetadata {
  const call = saveMetadata.mock.lastCall;
  if (!call) throw new Error("Expected metadata persistence from the real highlight manager");
  expect(call[0]).toBe(STUDY_ID);
  return call[1];
}

function chip(code: Code): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>("button", { name: new RegExp(`^${code} `) });
}

function legacyChip(label: string, count: number): HTMLButtonElement {
  return screen.getByRole<HTMLButtonElement>("button", { name: `${label} ${count}` });
}

function wordBlock(wordId: number): HTMLElement {
  const element = document.getElementById(String(wordId));
  if (!element || !screen.getByTestId("passage").contains(element)) {
    throw new Error(`Real WordBlock ${wordId} is missing`);
  }
  return element;
}

function expectPalette(element: HTMLElement, fill: string, text: string) {
  expect(element).toHaveStyle({ backgroundColor: fill, color: text });
}

function expectDefaultWord(wordId: number) {
  expectPalette(wordBlock(wordId), "#FFFFFF", "#525252");
  expect(wordBlock(wordId)).toHaveStyle({ borderColor: "#D9D9D9" });
}

function expectSelection(context: FormatState, ids: number[]) {
  const selected = context.ctxSelectedWords.map((word) => word.wordId);
  expect([...selected].sort((a, b) => a - b)).toEqual([...ids].sort((a, b) => a - b));
  expect(new Set(selected).size).toBe(selected.length);
  expect(context.ctxNumSelectedWords).toBe(ids.length);
}

async function openPerson(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Person, Gender, Number" }));
}

beforeEach(() => {
  saveMetadata.mockClear();
  originalUserSelect = document.body.style.userSelect;
  // jsdom has no dialog implementation; retain actual dialog markup and events.
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }),
    },
    close: {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }),
    },
  });
});

afterEach(() => {
  document.body.style.userSelect = originalUserSelect;
  for (const [method, descriptor] of Object.entries(originalDialogMethods)) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, method, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, method);
  }
});

describe("Person, Gender, Number acceptance", () => {
  it("replaces the separate groups with exactly ten row-major, one-line gloss/code/count buttons", async () => {
    const { user, context } = renderHarness();
    await openPerson(user);

    const counts = [3, 1, 2, 1, 2, 2, 1, 1, 1, 1];
    const buttons = screen.getAllByRole("button", { name: / occurrences$/ });
    expect(buttons).toHaveLength(10);
    PRESETS.forEach(({ code, gloss }, index) => {
      const button = buttons[index];
      expect(button).toBe(chip(code));
      expect(button).toHaveAccessibleName(`${code} ${gloss}, ${counts[index]} occurrences`);
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(within(button).getByText(gloss)).toHaveClass("whitespace-nowrap");
      expect(button).toHaveStyle({ border: "1px solid #B7B7B7" });
      expect(within(button).getByText(code, { exact: true })).toHaveClass("text-lg", "font-bold");
      expect(within(button).getByText(String(counts[index]), { exact: true })).toBeVisible();
      expectPalette(button, "#FFFFFF", "#666666");
    });
    for (const oldLabel of ["Person", "Gender", "Number", "Masculine", "Feminine", "Singular", "Plural"]) {
      expect(screen.queryByText(oldLabel, { exact: true })).not.toBeInTheDocument();
    }
    const toggle = screen.getByRole("button", { name: "Person, Gender, Number" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const panelId = toggle.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toContainElement(buttons[0]);
    expect(context().ctxPassageProps.stanzaCount).toBe(2);
    expect(context().ctxPassageProps.stropheCount).toBe(4);
    expect(saveMetadata).not.toHaveBeenCalled();
  });

  it("highlights every exact match once using all ten literal chip/word palettes and persists the same colors", async () => {
    const { user, context, historySpy } = renderHarness();
    await openPerson(user);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const saved = lastSavedMetadata();
    PRESETS.forEach(({ code, fill, text }, index) => {
      expectPalette(chip(code), fill, text);
      expectPalette(wordBlock(index + 1), fill, text);
      expect(saved.words[index + 1].color).toEqual({ fill, text, border: "#D9D9D9" });
      expect(context().ctxWordsColorMap.get(index + 1)).toEqual({
        fill, text, border: "#D9D9D9", source: "syntax",
      });
    });
    expectPalette(wordBlock(11), "#FFF9C4", "#666666");
    expectPalette(wordBlock(12), "#BBDEFB", "#666666");
    expectPalette(wordBlock(13), "#BBDEFB", "#666666");
    expect(saved.words[11].color).toEqual({ fill: "#FFF9C4", text: "#666666", border: "#D9D9D9" });
    expect(saved.words[12].color).toEqual({ fill: "#BBDEFB", text: "#666666", border: "#D9D9D9" });
    for (let id = 14; id <= 20; id++) {
      expectDefaultWord(id);
      expect(saved.words[id]?.color).toBeUndefined();
    }
    expect(context().ctxWordsColorMap.size).toBe(13);
    expect(Object.keys(saved.words)).toHaveLength(13);
    expect(saveMetadata).toHaveBeenCalledTimes(1);
    expect(historySpy).toHaveBeenCalledTimes(1);
    expect(historySpy).toHaveBeenCalledWith(saved, {
      wordsColorMap: context().ctxWordsColorMap,
      activeHighlightIds: { ...NO_HIGHLIGHTS, syntax: ALL_SCOPE },
      highlightCache: context().ctxHighlightCacheRef.current,
    });
    expect(context().ctxHighlightCacheRef.current.get(`syntax::${ALL_SCOPE}`)?.size).toBe(13);
    expectSelection(context(), []);
  });

  it.each(PRESETS)("selecting only $code limits highlighting to its matches and only that chip's preset", async ({ code, fill, text }) => {
    const { user, context } = renderHarness();
    await openPerson(user);
    await user.click(chip(code));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const primaryId = PRESETS.findIndex((preset) => preset.code === code) + 1;
    const extraIds: Partial<Record<Code, number[]>> = {
      "3ms": [12, 13], "2ms": [11], "1cs": [11], "1cp": [12],
    };
    const expectedIds = [primaryId, ...(extraIds[code] ?? [])];
    expectSelection(context(), expectedIds);
    expect([...context().ctxWordsColorMap.keys()].sort((a, b) => a - b))
      .toEqual([...expectedIds].sort((a, b) => a - b));
    PRESETS.forEach((preset) => {
      expectPalette(chip(preset.code), preset.code === code ? fill : "#FFFFFF",
        preset.code === code ? text : "#666666");
    });
    expectPalette(wordBlock(primaryId), fill, text);
    expect(lastSavedMetadata().words[primaryId].color).toEqual({ fill, text, border: "#D9D9D9" });
    if (expectedIds.includes(11)) expectPalette(wordBlock(11), "#FFF9C4", "#666666");
    if (expectedIds.includes(12)) expectPalette(wordBlock(12), "#BBDEFB", "#666666");
    for (let id = 1; id <= 20; id++) {
      if (!expectedIds.includes(id)) {
        expectDefaultWord(id);
        expect(lastSavedMetadata().words[id]?.color).toBeUndefined();
      }
    }
    expect(context().ctxActiveHighlightIds.syntax).toBe(`person-gender-number__${code}`);
    expect(saveMetadata).toHaveBeenCalledTimes(1);
  });

  it("retains disabled zero-count chips at full preset colors when highlighting all", async () => {
    const { user, context } = renderHarness({ words: [makeWord(1, "Pro-3ms")] });
    await openPerson(user);
    await user.click(chip("3mp"));
    expectSelection(context(), []);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));

    PRESETS.forEach(({ code, fill, text }) => {
      const button = chip(code);
      expect(button).toHaveAccessibleName(new RegExp(`, ${code === "3ms" ? 1 : 0} occurrences$`));
      if (code === "3ms") expect(button).toBeEnabled();
      else expect(button).toBeDisabled();
      expect(button.className).not.toMatch(/(?:^|\s)(?:disabled:)?opacity-/);
      expect(button.style.opacity).not.toBe("0.6");
      expectPalette(button, fill, text);
    });
    expectPalette(wordBlock(1), "#BBDEFB", "#666666");
    expect(saveMetadata).toHaveBeenCalledTimes(1);
  });

  it.each([
    { morphology: "V-Piel-Imperf.h-1cs | 2ms", fill: "#FFF9C4", text: "#666666" },
    { morphology: "V-Piel-Imperf.h-2ms | 1cs", fill: "#3F51B5", text: "#FFFFFF" },
  ])("uses the first source code in $morphology without changing either occurrence count", async ({ morphology, fill, text }) => {
    const { user } = renderHarness({
      words: [makeWord(1, "Pro-1cs"), makeWord(2, "Pro-2ms"), makeWord(3, morphology)],
    });
    await openPerson(user);
    const expectCounts = () => {
      expect(chip("1cs")).toHaveAccessibleName(/, 2 occurrences$/);
      expect(chip("2ms")).toHaveAccessibleName(/, 2 occurrences$/);
    };
    expectCounts();
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expectPalette(wordBlock(3), fill, text);
    expect(lastSavedMetadata().words[3].color).toEqual({ fill, text, border: "#D9D9D9" });
    expectCounts();
    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    expectDefaultWord(3);
    expectCounts();
  });

  it("keeps the existing Syntax Clear-then-reapply interaction when selection changes during a highlight", async () => {
    const { user, context } = renderHarness({
      words: [makeWord(1, "Pro-3ms"), makeWord(2, "Pro-2ms")],
    });
    await openPerson(user);
    await user.click(chip("3ms"));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    await user.click(chip("2ms"));

    expectSelection(context(), [1, 2]);
    expect(screen.queryByRole("button", { name: "Smart Highlight" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Highlight" })).toBeEnabled();
    expectPalette(wordBlock(1), "#BBDEFB", "#666666");
    expectDefaultWord(2);
    expectPalette(chip("2ms"), "#FFFFFF", "#666666");
    expect(saveMetadata).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    expectSelection(context(), [1, 2]);
    expect(chip("3ms")).toHaveAttribute("aria-pressed", "true");
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "true");
    expectDefaultWord(1);
    expectDefaultWord(2);

    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__3ms,2ms");
    expectPalette(wordBlock(1), "#BBDEFB", "#666666");
    expectPalette(wordBlock(2), "#3F51B5", "#FFFFFF");
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expect(saveMetadata).toHaveBeenCalledTimes(3);
  });

  it("unions overlapping selections without duplicates and retains shared words when a chip is deselected", async () => {
    const { user, context } = renderHarness();
    await openPerson(user);
    await user.click(chip("1cs"));
    expectSelection(context(), [5, 11]);
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "false");
    await user.click(chip("2ms"));
    expectSelection(context(), [3, 5, 11]);
    expect(context().ctxSelectedStrophes).toEqual([]);
    expect(wordBlock(11)).toHaveStyle({ boxShadow: "0 0 0 3px #FFC300" });
    await user.click(chip("1cs"));
    expectSelection(context(), [3, 11]);
    expect(chip("1cs")).toHaveAttribute("aria-pressed", "false");
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "true");
    expect(saveMetadata).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expectPalette(wordBlock(11), "#FFF9C4", "#666666");
    expectPalette(chip("1cs"), "#FFFFFF", "#666666");
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expect([...context().ctxWordsColorMap.keys()].sort((a, b) => a - b)).toEqual([3, 11]);
  });

  it("highlights the union of multiple selected chips, not unrelated pre-selected matching words", async () => {
    const words = makeWords();
    const { user, context } = renderHarness({ words, selectedWords: [words[1], words[13]] });
    await openPerson(user);
    await user.click(chip("3ms"));
    await user.click(chip("2ms"));
    expectSelection(context(), [1, 2, 3, 11, 12, 13, 14]);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__3ms,2ms");
    expect([...context().ctxWordsColorMap.keys()].sort((a, b) => a - b)).toEqual([1, 3, 11, 12, 13]);
    expectDefaultWord(2);
    expectDefaultWord(14);
    expectPalette(chip("3ms"), "#BBDEFB", "#666666");
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expectPalette(chip("3mp"), "#FFFFFF", "#666666");
    expectPalette(chip("1cs"), "#FFFFFF", "#666666");
    expectPalette(wordBlock(11), "#FFF9C4", "#666666");
    expectPalette(wordBlock(12), "#BBDEFB", "#666666");
    expect(saveMetadata).toHaveBeenCalledTimes(1);
  });

  it("retains staged 2ms through the real document mouseup before Smart Highlight's click", async () => {
    const { user, context } = renderHarness({
      words: [makeWord(1, "Pro-3ms"), makeWord(2, "V-Piel-Imperf.h-1cs | 2ms")],
    });
    await openPerson(user);
    await user.click(chip("2ms"));
    expectSelection(context(), [2]);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__2ms");
    expectSelection(context(), [2]);
    expect([...context().ctxWordsColorMap.keys()]).toEqual([2]);
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expectPalette(chip("1cs"), "#FFFFFF", "#666666");
    expectPalette(wordBlock(2), "#FFF9C4", "#666666");
    expectDefaultWord(1);
    expect(saveMetadata).toHaveBeenCalledTimes(1);
  });

  it("keeps staged chip scope through Syntax tab unmount/remount without inferring unrelated selected codes", async () => {
    const words = [makeWord(1, "Pro-3ms"), makeWord(2, "V-Piel-Imperf.h-1cs | 2ms")];
    const { user, context } = renderHarness({ words, selectedWords: [words[0]] });
    await openPerson(user);
    await user.click(chip("2ms"));
    expectSelection(context(), [1, 2]);
    await user.click(screen.getByRole("button", { name: "Switch away from Syntax" }));
    expect(screen.queryByRole("button", { name: "Person, Gender, Number" })).not.toBeInTheDocument();
    expectSelection(context(), [1, 2]);
    await user.click(screen.getByRole("button", { name: "Return to Syntax" }));
    await openPerson(user);
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "true");
    expect(chip("1cs")).toHaveAttribute("aria-pressed", "false");
    expect(chip("3ms")).toHaveAttribute("aria-pressed", "false");
    expect(context().ctxSelectedPersonGenderNumberCodes).toEqual(["2ms"]);
    expect(saveMetadata).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__2ms");
    expect([...context().ctxWordsColorMap.keys()]).toEqual([2]);
    expectPalette(wordBlock(2), "#FFF9C4", "#666666");
    expectDefaultWord(1);
  });

  it("JSON reload hydrates a scoped ambiguous-word highlight with its distinct chip/word palettes and working Clear", async () => {
    const words = [makeWord(1, "Pro-3ms"), makeWord(2, "V-Piel-Imperf.h-1cs | 2ms")];
    const first = renderHarness({ words });
    await openPerson(first.user);
    await first.user.click(chip("2ms"));
    await first.user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    const saved: StudyMetadata = JSON.parse(JSON.stringify(lastSavedMetadata()));
    expect(saved.personGenderNumberHighlights).toEqual({ "0": ["2ms"] });
    first.unmount();

    const second = renderHarness({ words, metadata: saved });
    await openPerson(second.user);
    expectSelection(second.context(), []);
    expect(second.context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__2ms");
    expect([...second.context().ctxWordsColorMap.keys()]).toEqual([2]);
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expectPalette(chip("1cs"), "#FFFFFF", "#666666");
    expectPalette(chip("3ms"), "#FFFFFF", "#666666");
    expectPalette(wordBlock(2), "#FFF9C4", "#666666");
    expectDefaultWord(1);
    expect(saveMetadata).toHaveBeenCalledTimes(1);
    await second.user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    expect(second.context().ctxWordsColorMap.size).toBe(0);
    expect(second.context().ctxHighlightCacheRef.current.size).toBe(0);
    expect(second.context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expect(lastSavedMetadata()).toEqual({ words: {} });
    expectDefaultWord(2);
    expectPalette(chip("2ms"), "#FFFFFF", "#666666");
    expect(saveMetadata).toHaveBeenCalledTimes(2);

    const cleared: StudyMetadata = JSON.parse(JSON.stringify(lastSavedMetadata()));
    second.unmount();
    const third = renderHarness({ words, metadata: cleared });
    await openPerson(third.user);
    expect(third.context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expectDefaultWord(2);
    expect(screen.getByRole("button", { name: "Smart Highlight" })).toBeEnabled();
    expect(saveMetadata).toHaveBeenCalledTimes(2);
  });

  it("JSON reload retains all ten highlighted chip presets, including disabled zero-count codes", async () => {
    const words = [makeWord(1, "Pro-3ms")];
    const first = renderHarness({ words });
    await openPerson(first.user);
    await first.user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    const saved: StudyMetadata = JSON.parse(JSON.stringify(lastSavedMetadata()));
    expect(saved.personGenderNumberHighlights).toEqual({
      "0": ["3ms", "3mp", "2ms", "2mp", "1cs", "1cp", "2fs", "2fp", "3fs", "3fp"],
    });
    first.unmount();

    const second = renderHarness({ words, metadata: saved });
    await openPerson(second.user);
    expect(second.context().ctxActiveHighlightIds.syntax).toBe(ALL_SCOPE);
    PRESETS.forEach(({ code, fill, text }) => {
      expectPalette(chip(code), fill, text);
      expect(chip(code).className).not.toMatch(/(?:^|\s)(?:disabled:)?opacity-/);
      if (code !== "3ms") {
        expect(chip(code)).toBeDisabled();
        expect(chip(code)).toHaveAccessibleName(/, 0 occurrences$/);
      }
    });
    expectPalette(wordBlock(1), "#BBDEFB", "#666666");
    expect(saveMetadata).toHaveBeenCalledTimes(1);
    await second.user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    PRESETS.forEach(({ code }) => expectPalette(chip(code), "#FFFFFF", "#666666"));
    expectDefaultWord(1);
    expect(lastSavedMetadata()).toEqual({ words: {} });
  });

  it("clears back to normal colors and repeats the same scoped highlight deterministically", async () => {
    const { user, context } = renderHarness();
    await openPerson(user);
    await user.click(chip("2ms"));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    const firstMetadata = structuredClone(lastSavedMetadata());
    const firstMap = structuredClone(context().ctxWordsColorMap);

    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    expect(context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expect(context().ctxWordsColorMap.size).toBe(0);
    expect(context().ctxHighlightCacheRef.current.size).toBe(0);
    expect(lastSavedMetadata()).toEqual({ words: {} });
    for (let id = 1; id <= 20; id++) expectDefaultWord(id);
    PRESETS.forEach(({ code }) => expectPalette(chip(code), "#FFFFFF", "#666666"));
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(lastSavedMetadata()).toEqual(firstMetadata);
    expect(context().ctxWordsColorMap).toEqual(firstMap);
    expect(saveMetadata).toHaveBeenCalledTimes(3);
  });

  it("external word deselection drops chip scope and the next highlight includes all codes", async () => {
    const { user, context } = renderHarness();
    await openPerson(user);
    await user.click(chip("2ms"));
    await user.click(screen.getByRole("button", { name: "Clear word selection" }));
    expectSelection(context(), []);
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe(ALL_SCOPE);
    expect(context().ctxWordsColorMap.size).toBe(13);
  });

  it("reacts to deselection through the real rendered WordBlock, not only harness setters", async () => {
    const { user, context } = renderHarness();
    await openPerson(user);
    await user.click(chip("2ms"));
    await user.click(within(wordBlock(3)).getByText("word-3"));
    await waitFor(() => expectSelection(context(), [11]));
    expect(chip("2ms")).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe(ALL_SCOPE);
    expect(context().ctxWordsColorMap.size).toBe(13);
  });

  it("preserves glosses, notes and structure while clearing old colors with the default flag", async () => {
    const metadata: StudyMetadata = {
      scaleValue: 2,
      boxStyle: { style: BoxDisplayStyle.box },
      lang: LanguageMode.Parallel,
      nonEnglishDisplayMode: NonEnglishDisplayMode.Transliteration,
      words: {
        1: {
          color: { fill: "#FF0000", text: "#000000", border: "#00FF00" },
          glossOverride: "He blessed",
          indent: 2, lineBreak: true, ignoreNewLine: true, stanzaDiv: true, stropheDiv: true,
          stanzaMd: { expanded: false, title: "A preserved stanza" },
          stropheMd: { expanded: true, notes: "Preserved strophe notes", color: { fill: "#FF0000" } },
        },
        14: {
          color: { fill: "#123456", text: "#FEDCBA" },
          glossOverride: "A preserved noun",
          indent: 1, stropheMd: { notes: "Unmatched-word notes", color: { border: "#123456" } },
        },
      },
    };
    const original = structuredClone(metadata);
    const { user, context } = renderHarness({
      metadata,
      colorMap: new Map([[1, { fill: "#00FF00", text: "#FFFFFF", source: "motif" }]]),
    });
    expectPalette(wordBlock(1), "#00FF00", "#FFFFFF");
    await openPerson(user);
    await user.click(chip("3ms"));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));

    const expected = structuredClone(original);
    expected.personGenderNumberHighlights = { "0": ["3ms"] };
    delete expected.words[1].stropheMd?.color;
    delete expected.words[14].color;
    delete expected.words[14].stropheMd?.color;
    for (const id of [1, 12, 13]) {
      expected.words[id] = {
        ...expected.words[id],
        color: { fill: "#BBDEFB", text: "#666666", border: "#D9D9D9" },
      };
    }
    expect(lastSavedMetadata()).toEqual(expected);
    expect(context().ctxStudyMetadata).toEqual(expected);
    expect(context().ctxStudyNotes).toBe(STUDY_NOTES);
    expect(wordBlock(1)).toHaveTextContent("He blessed");
    expect(wordBlock(14)).toHaveTextContent("A preserved noun");
    expectDefaultWord(14);
    expect(metadata).toEqual(original);

    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    delete expected.personGenderNumberHighlights;
    for (const id of [1, 12, 13]) {
      delete expected.words[id].color;
      if (Object.keys(expected.words[id]).length === 0) delete expected.words[id];
    }
    expect(lastSavedMetadata()).toEqual(expected);
    expectDefaultWord(1);
    expectDefaultWord(14);
    expect(context().ctxStudyNotes).toBe(STUDY_NOTES);
  });

  it("repaints legacy saved word colors without a persisted scope or transient highlight map", async () => {
    const words = makeWords().slice(0, 10);
    const first = renderHarness({ words });
    await openPerson(first.user);
    await first.user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    const saved = structuredClone(lastSavedMetadata());
    delete saved.personGenderNumberHighlights;
    first.unmount();

    const second = renderHarness({ words, metadata: saved });
    await openPerson(second.user);
    expect(second.context().ctxWordsColorMap.size).toBe(0);
    expect(second.context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    PRESETS.forEach(({ code, fill, text }, index) => {
      expectPalette(wordBlock(index + 1), fill, text);
      expectPalette(chip(code), fill, text);
    });
    expect(screen.getByRole("button", { name: "Smart Highlight" })).toBeEnabled();
    expect(saveMetadata).toHaveBeenCalledTimes(1);
    expect(second.historySpy).not.toHaveBeenCalled();
  });

  it("restores encoded chip scope, word colors and independent caches from history snapshots", async () => {
    const { user, context, historySpy } = renderHarness();
    await openPerson(user);
    await user.click(chip("3ms"));
    await user.click(chip("2ms"));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    const highlighted = structuredClone(context().ctxHistory[1]);
    const scope = "person-gender-number__3ms,2ms";
    expect(highlighted.activeHighlightIds.syntax).toBe(scope);
    expect(highlighted.highlightCache.get(`syntax::${scope}`)?.size).toBe(5);
    expect(historySpy.mock.calls[0][1]?.activeHighlightIds?.syntax).toBe(scope);

    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    expect(context().ctxHistory[1]).toEqual(highlighted);
    await user.click(screen.getByRole("button", { name: "Restore previous snapshot" }));
    expect(context().ctxStudyMetadata).toEqual(highlighted.metadata);
    expect(context().ctxWordsColorMap).toEqual(highlighted.wordsColorMap);
    expectPalette(chip("3ms"), "#BBDEFB", "#666666");
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expectPalette(chip("1cs"), "#FFFFFF", "#666666");
    expectPalette(chip("1cp"), "#FFFFFF", "#666666");
    expectPalette(wordBlock(11), "#FFF9C4", "#666666");
    expect(screen.getByRole("button", { name: "Clear Highlight" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Restore next snapshot" }));
    expect(context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expectDefaultWord(11);
    expectPalette(chip("2ms"), "#FFFFFF", "#666666");
    await user.click(screen.getByRole("button", { name: "Restore previous snapshot" }));
    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    expect(context().ctxWordsColorMap.size).toBe(0);
    expect(context().ctxHighlightCacheRef.current.size).toBe(0);
    expect(lastSavedMetadata()).toEqual({ words: {} });
    expect(saveMetadata).toHaveBeenCalledTimes(3);
  });

  it("keeps scope across accordion switches, then replaces it when returning to a previous Syntax highlight", async () => {
    const { user, context } = renderHarness();
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("parts-of-speech");
    await openPerson(user);
    await user.click(chip("2ms"));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__2ms");
    expect(context().ctxHighlightCacheRef.current.has("syntax::parts-of-speech")).toBe(false);
    expectDefaultWord(14);

    await user.click(screen.getByRole("button", { name: "Verbal Stems" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("person-gender-number__2ms");
    await openPerson(user);
    expectPalette(chip("2ms"), "#3F51B5", "#FFFFFF");
    expectPalette(chip("1cs"), "#FFFFFF", "#666666");
    expect(screen.getByRole("button", { name: "Clear Highlight" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Parts of Speech" }));
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("parts-of-speech");
    expect([...context().ctxHighlightCacheRef.current.keys()]).toEqual(["syntax::parts-of-speech"]);
    expect(context().ctxWordsColorMap.has(14)).toBe(true);
    await openPerson(user);
    expect(screen.getByRole("button", { name: "Smart Highlight" })).toBeEnabled();
    expect(chip("2ms")).not.toHaveStyle({ backgroundColor: "#3F51B5" });
    await user.click(screen.getByRole("button", { name: "Parts of Speech" }));
    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    await openPerson(user);
    expect(context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    PRESETS.forEach(({ code }) => expectPalette(chip(code), "#FFFFFF", "#666666"));
    for (let id = 1; id <= 20; id++) expectDefaultWord(id);
    expect(saveMetadata).toHaveBeenCalledTimes(4);
  });

  it("supports native Enter and Space activation for chip selection and highlight/clear", async () => {
    const { user, context } = renderHarness();
    await openPerson(user);
    chip("3ms").focus();
    await user.keyboard("{Enter}");
    expectSelection(context(), [1, 12, 13]);
    expect(chip("3ms")).toHaveFocus();
    await user.keyboard(" ");
    expectSelection(context(), []);
    expect(chip("3ms")).toHaveAttribute("aria-pressed", "false");
    expect(saveMetadata).not.toHaveBeenCalled();
    screen.getByRole("button", { name: "Smart Highlight" }).focus();
    await user.keyboard("{Enter}");
    expect(context().ctxActiveHighlightIds.syntax).toBe(ALL_SCOPE);
    expect(screen.getByRole("button", { name: "Clear Highlight" })).toHaveFocus();
    await user.keyboard(" ");
    expect(context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expect(saveMetadata).toHaveBeenCalledTimes(2);
  });

  it.each([
    { description: "empty passage", words: [] },
    { description: "missing/empty morphology", words: [makeWord(1), makeWord(2, "")] },
  ])("disables all chips and highlighting for $description", async ({ words }) => {
    const { user, context, historySpy } = renderHarness({ words });
    await openPerson(user);
    expect(screen.getAllByRole("button", { name: / occurrences$/ })).toHaveLength(10);
    for (const { code } of PRESETS) {
      expect(chip(code)).toBeDisabled();
      expect(chip(code)).toHaveAccessibleName(/, 0 occurrences$/);
      await user.click(chip(code));
    }
    expect(screen.getByRole("button", { name: "Smart Highlight" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expectSelection(context(), []);
    expect(context().ctxWordsColorMap.size).toBe(0);
    expect(saveMetadata).not.toHaveBeenCalled();
    expect(historySpy).not.toHaveBeenCalled();
  });

  it("guards view-only chip/highlight mutations while keeping the explanation available", async () => {
    const { user, context, historySpy } = renderHarness({ inViewMode: true });
    await openPerson(user);
    for (const { code } of PRESETS) {
      expect(chip(code)).toBeDisabled();
      await user.click(chip(code));
      fireEvent.click(chip(code));
    }
    const highlight = screen.getByRole("button", { name: "Smart Highlight" });
    expect(highlight).toBeDisabled();
    await user.click(highlight);
    fireEvent.click(highlight);
    expectSelection(context(), []);
    expect(context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expect(context().ctxStudyMetadata).toEqual({ words: {} });
    expect(saveMetadata).not.toHaveBeenCalled();
    expect(historySpy).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "About Person, Gender, Number" }));
    expect(screen.getByRole("dialog", { name: "Person, Gender, Number" })).toHaveAttribute("open");
  });

  it("opens/closes a native dialog containing the full Overview, Legend and Disclaimer", async () => {
    const { user } = renderHarness();
    const info = screen.getByRole("button", { name: "About Person, Gender, Number" });
    expect(info).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(info);
    const dialog = screen.getByRole("dialog", { name: "Person, Gender, Number" });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
    for (const heading of ["Overview", "Legend", "Disclaimer"]) {
      expect(within(dialog).getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(dialog).toHaveTextContent(
      'This tool highlights every word carrying grammatical person (verb conjugation, pronominal suffix, or independent pronoun) to surface person and number shifts, a structural device in Hebrew poetry that often marks strophe and stanza boundaries. Common patterns include address shifting between speaker and community ("I will praise" to "let us praise"), and address to YHWH shifting from direct ("you") to descriptive ("he") \u2014 a classic hymnic pivot.',
    );
    expect(dialog).toHaveTextContent("Each code is Person, Gender, Number.");
    expect(dialog).toHaveTextContent("Person: 1st (speaker), 2nd (addressee), 3rd (other)");
    expect(dialog).toHaveTextContent("Gender: m (masculine), f (feminine), c (common \u2014 1st person only)");
    expect(dialog).toHaveTextContent("Number: s (singular), p (plural)");
    expect(dialog).toHaveTextContent('For example, 2ms means 2nd person, masculine, singular \u2014 "you," addressing one person.');
    expect(dialog).toHaveTextContent(
      'When a verb is conjugated with both a subject and a pronominal object suffix (e.g. "he will bless us"), the smart highlighter colors the word by subject only to reflect who is acting, not who is receiving the action.',
    );
    await user.click(within(dialog).getByRole("heading", { name: "Overview" }));
    expect(dialog).toHaveAttribute("open");
    expect(HTMLDialogElement.prototype.close).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
    await user.click(info);
    fireEvent.click(dialog);
    expect(dialog).not.toHaveAttribute("open");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(2);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(2);
    expect(saveMetadata).not.toHaveBeenCalled();
  });
});

describe("existing Syntax section regressions", () => {
  it("preserves all parts-of-speech counts, additive selections, whole-section highlighting and clear", async () => {
    const morphologies = [
      "V-Qal-Perf-3ms", "N-ms", "Adj-ms", "Adv-NegPrt", "Adv",
      "Part-DirObj", "Pro-3ms", "Interrog", "Interjection", "Conj", "N-proper", "Prep",
    ];
    const labels = [
      "Verb", "Noun", "Adjective", "Negative Particle", "Adverb", "Object Marker",
      "Pronoun", "Interrogative", "Interjection", "Conjunction", "Proper Noun", "Preposition",
    ];
    const { user, context } = renderHarness({
      words: morphologies.map((morphology, index) => makeWord(index + 1, morphology)),
    });
    labels.forEach((label) => expect(legacyChip(label, 1)).toBeEnabled());
    await user.click(legacyChip("Verb", 1));
    await user.click(legacyChip("Noun", 1));
    expectSelection(context(), [1, 2]);
    await user.click(legacyChip("Verb", 1));
    expectSelection(context(), [2]);
    expect(context().ctxSelectedStrophes).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("parts-of-speech");
    expect([...context().ctxWordsColorMap.keys()].sort((a, b) => a - b))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12]);
    expectDefaultWord(10);
    expect(wordBlock(12)).toHaveStyle({ borderColor: "#000000" });
    for (const [id, color] of context().ctxWordsColorMap) {
      const { source, ...persisted } = color;
      expect(source).toBe("syntax");
      expect(lastSavedMetadata().words[id].color).toEqual(persisted);
      if (color.fill) expect(wordBlock(id)).toHaveStyle({ backgroundColor: color.fill });
    }
    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    for (let id = 1; id <= 12; id++) expectDefaultWord(id);
    expect(context().ctxActiveHighlightIds).toEqual(NO_HIGHLIGHTS);
    expect(lastSavedMetadata()).toEqual({ words: {} });
    expect(saveMetadata).toHaveBeenCalledTimes(2);
  });

  it("keeps Perfect and Imperfect disjoint in counts/selections and applies distinct conjugation colors", async () => {
    const { user, context } = renderHarness({
      words: [
        makeWord(1, "V-Qal-Perf-3ms"),
        makeWord(2, "V-Piel-Imperf.h-1cs"),
        makeWord(3, "V-Niphal-Perfect-3mp"),
        makeWord(4, "V-Pual-Imperfect-2mp"),
      ],
    });
    await user.click(screen.getByRole("button", { name: "Verb Conjugations" }));
    expect(legacyChip("Perfect", 2)).toBeEnabled();
    expect(legacyChip("Imperfect", 2)).toBeEnabled();
    await user.click(legacyChip("Perfect", 2));
    expectSelection(context(), [1, 3]);
    await user.click(legacyChip("Imperfect", 2));
    expectSelection(context(), [1, 2, 3, 4]);
    await user.click(legacyChip("Perfect", 2));
    expectSelection(context(), [2, 4]);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    const saved = lastSavedMetadata();
    expect(context().ctxActiveHighlightIds.syntax).toBe("verb-conjugations");
    expect(saved.words[1].color).toEqual(saved.words[3].color);
    expect(saved.words[2].color).toEqual(saved.words[4].color);
    expect(saved.words[1].color?.fill).not.toEqual(saved.words[2].color?.fill);
    expect(context().ctxWordsColorMap.size).toBe(4);
    for (const id of [1, 2, 3, 4]) {
      const color = saved.words[id].color;
      expect(color?.fill).toBeTruthy();
      expect(wordBlock(id)).toHaveStyle({ backgroundColor: color?.fill, color: color?.text });
    }
    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    for (const id of [1, 2, 3, 4]) expectDefaultWord(id);
    expect(lastSavedMetadata()).toEqual({ words: {} });
    expect(saveMetadata).toHaveBeenCalledTimes(2);
  });

  it("preserves seven verbal-stem selections and exact whole-section Smart Highlight/Clear palettes", async () => {
    const stems = [
      { label: "Qal", fill: "#F8BBD0", text: "#000000" },
      { label: "Niphal", fill: "#E91E63", text: "#FFFFFF" },
      { label: "Piel", fill: "#B3E5FC", text: "#000000" },
      { label: "Pual", fill: "#03A9F4", text: "#FFFFFF" },
      { label: "Hifil", fill: "#DCEDC8", text: "#000000" },
      { label: "Hofal", fill: "#4CAF50", text: "#FFFFFF" },
      { label: "Hitpael", fill: "#388E3C", text: "#FFFFFF" },
    ];
    const { user, context } = renderHarness({
      words: stems.map(({ label }, index) => makeWord(index + 1, `V-${label}-Perf-3ms`)),
    });
    await user.click(screen.getByRole("button", { name: "Verbal Stems" }));
    stems.forEach(({ label }) => expect(legacyChip(label, 1)).toBeEnabled());
    await user.click(legacyChip("Qal", 1));
    await user.click(legacyChip("Piel", 1));
    expectSelection(context(), [1, 3]);
    await user.click(legacyChip("Qal", 1));
    expectSelection(context(), [3]);
    await user.click(screen.getByRole("button", { name: "Smart Highlight" }));
    expect(context().ctxActiveHighlightIds.syntax).toBe("verbal-stems");
    expect(context().ctxWordsColorMap.size).toBe(7);
    stems.forEach(({ label, fill, text }, index) => {
      expectPalette(legacyChip(label, 1), fill, text);
      expectPalette(wordBlock(index + 1), fill, text);
      expect(lastSavedMetadata().words[index + 1].color).toEqual({ fill, text, border: "#D9D9D9" });
    });
    await user.click(screen.getByRole("button", { name: "Clear Highlight" }));
    for (let id = 1; id <= 7; id++) expectDefaultWord(id);
    expect(context().ctxWordsColorMap.size).toBe(0);
    expect(lastSavedMetadata()).toEqual({ words: {} });
    expect(saveMetadata).toHaveBeenCalledTimes(2);
  });

  it.each(["Parts of Speech", "Verb Conjugations", "Verbal Stems"])(
    "keeps %s Smart Highlight disabled in view mode",
    async (section) => {
      const { user } = renderHarness({ inViewMode: true });
      if (section !== "Parts of Speech") {
        await user.click(screen.getByRole("button", { name: section }));
      }
      const highlight = screen.getByRole("button", { name: "Smart Highlight" });
      expect(highlight).toBeDisabled();
      await user.click(highlight);
      expect(saveMetadata).not.toHaveBeenCalled();
    },
  );
});
