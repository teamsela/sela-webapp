"use client";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { MdInfoOutline } from "react-icons/md";

import { DEFAULT_BORDER_COLOR } from "@/lib/colors";
import { PassageProps, WordProps } from "@/lib/data";
import { countSelectedLines, countSelectedWords } from "@/lib/counter";
import { getAccentLevel, scanAccents, AccentLevel, AccentToken, ScanResult } from "@/lib/poeticAccents";
import { deriveUniformWordPalette } from "@/lib/utils";

import { FormatContext } from "..";
import AccordionToggleIcon from "./common/AccordionToggleIcon";
import PausalForms from "./PausalForms";
import { HighlightGroup, useHighlightManager } from "./useHighlightManager";

const STRUCTURE_HIGHLIGHT_ID = "accents-in-poetry";

// The poetic-accent system only applies to Job, Psalms and Proverbs.
const POETIC_BOOKS = new Set(["psalms", "proverbs", "job"]);

type CategoryKey = "level-1" | "level-2" | "level-3" | "level-4" | "conjunctive";

type CategoryPalette = { fill: string; border: string; text: string };

/**
 * Hardcoded Smart Highlight palette, drawn from the app's existing swatch set
 * (see FALLBACK_SWATCH_GROUPS in @/lib/colors). Disjunctive levels run darkest
 * red (strongest) -> light pink (weakest); conjunctives use light green.
 */
const CATEGORY_PALETTE: Record<CategoryKey, CategoryPalette> = {
  "level-1": { fill: "#B71C1C", border: "#B71C1C", text: "#FFFFFF" },
  "level-2": { fill: "#D32F2F", border: "#D32F2F", text: "#FFFFFF" },
  "level-3": { fill: "#FFCDD2", border: "#FFCDD2", text: "#000000" },
  "level-4": { fill: "#FFE6E9", border: "#FFE6E9", text: "#000000" },
  conjunctive: { fill: "#C8E6C9", border: "#C8E6C9", text: "#525252" },
};

const DISJUNCTIVE_ROWS: { key: CategoryKey; label: string; level: AccentLevel }[] = [
  { key: "level-1", label: "Level 1", level: 1 },
  { key: "level-2", label: "Level 2", level: 2 },
  { key: "level-3", label: "Level 3", level: 3 },
  { key: "level-4", label: "Level 4", level: 4 },
];

const CATEGORY_KEYS: CategoryKey[] = [
  "level-1",
  "level-2",
  "level-3",
  "level-4",
  "conjunctive",
];

const levelKey = (level: AccentLevel | null): CategoryKey =>
  level ? (`level-${level}` as CategoryKey) : "conjunctive";

const EMPTY_SCAN: ScanResult = { ids: [], underIds: [], counts: {}, spans: {} };

/**
 * fill = words that receive a solid fill; border = words shown as an outline
 * only. Border covers the earlier word of a cross-word accent AND the words of a
 * maqqef-joined unit whose accent straddles the maqqef. Maqqef "leaner" words
 * that carry no accent mark of their own receive neither.
 */
type CategoryData = { count: number; fillWords: WordProps[]; borderWords: WordProps[] };

const flattenWords = (passageProps?: PassageProps): WordProps[] => {
  if (!passageProps?.stanzaProps) {
    return [];
  }
  const words: WordProps[] = [];
  passageProps.stanzaProps.forEach((stanza) =>
    stanza.strophes.forEach((strophe) =>
      strophe.lines.forEach((line) => line.words.forEach((word) => words.push(word))),
    ),
  );
  return words;
};

// Build the Smart Highlight payload for a specific set of levels: each colored
// level fills its fill words and outlines (border only) its border words with
// the level's hardcoded palette color.
const buildGroupsForKeys = (
  keys: CategoryKey[],
  categories: Record<CategoryKey, CategoryData>,
): HighlightGroup[] => {
  const groups: HighlightGroup[] = [];
  keys.forEach((key) => {
    const { fillWords, borderWords } = categories[key];
    const palette = CATEGORY_PALETTE[key];
    if (fillWords.length > 0) {
      groups.push({
        label: `${key}-fill`,
        words: fillWords,
        palette: { fill: palette.fill, border: palette.fill, text: palette.text },
      });
    }
    if (borderWords.length > 0) {
      groups.push({
        label: `${key}-border`,
        words: borderWords,
        palette: { border: palette.fill },
      });
    }
  });
  return groups;
};

// The active highlight id encodes exactly which levels are currently colored, so
// the applied set survives re-renders and history without a parallel piece of
// state. The bare STRUCTURE_HIGHLIGHT_ID is reserved to mean "all levels" (the
// highlight-all case).
const idForKeys = (keys: CategoryKey[]): string =>
  `${STRUCTURE_HIGHLIGHT_ID}::${keys.join(",")}`;

const keysFromHighlightId = (
  id: string | null,
  allKeys: CategoryKey[],
): CategoryKey[] => {
  if (!id) {
    return [];
  }
  if (id === STRUCTURE_HIGHLIGHT_ID) {
    return allKeys;
  }
  const prefix = `${STRUCTURE_HIGHLIGHT_ID}::`;
  const parts = new Set(
    (id.startsWith(prefix) ? id.slice(prefix.length) : "").split(",").filter(Boolean),
  );
  return CATEGORY_KEYS.filter((key) => parts.has(key));
};

type AccentCategoryButtonProps = {
  label: string;
  count: number;
  /** When set, the category's words uniformly carry this color (highlight or custom). */
  activeColors?: { fill: string; border?: string; text?: string };
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
};

const AccentCategoryButton = ({
  label,
  count,
  activeColors,
  selected,
  disabled,
  onClick,
}: AccentCategoryButtonProps) => {
  const style = activeColors
    ? {
        background: activeColors.fill,
        borderColor: activeColors.border ?? activeColors.fill,
        color: activeColors.text ?? "#000000",
      }
    : { background: "#FFFFFF", borderColor: DEFAULT_BORDER_COLOR, color: "#1c2434" };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      style={style}
      className={`ClickBlock relative flex w-full items-center justify-between rounded-md border-2 px-4 py-1 text-lg transition
        ${disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-90"}
        ${selected ? "outline outline-[3px] outline-offset-1 outline-[#FFC300] drop-shadow-md" : ""}`}
    >
      <span className="flex-1 select-none text-center leading-none">{label}</span>
      <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] px-2 text-sm text-black">
        {count}
      </span>
    </button>
  );
};

// Static reference copy for the "Accents in Poetry" info popup.
const ACCENT_INFO_TITLE_ID = "accents-in-poetry-info-title";

const ACCENT_INFO_DISJUNCTIVE_LEVELS: { level: string; accents: string }[] = [
  { level: "Level 1", accents: "Silluq" },
  { level: "Level 2", accents: "Etnachta, Ole Veyored, Revi'i Mugrash, Geresh, Shalshelet G" },
  { level: "Level 3", accents: "Revi'i, Dechi, Sinnor" },
  { level: "Level 4", accents: "Azla Legarmeh, Mahpakh Legarmeh, Pazer" },
];

const ACCENT_INFO_CONJUNCTIVES =
  "Azla, Mahpakh, Munach, Mer'kha, Tarcha, Ole, Illuy, Galgal, Shalshelet, Sinnorit, Sinnorit Mahpakh, Paseq";

// Reference popup describing the poetic accent system and how Smart Highlight
// colors words. Opened from the info icon in the "Accents in Poetry" header and
// rendered through a portal so it overlays the whole study view.
const AccentsInfoModal = ({ onClose }: { onClose: () => void }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ACCENT_INFO_TITLE_ID}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <IconX size={18} stroke={2} />
        </button>

        <h3
          id={ACCENT_INFO_TITLE_ID}
          className="pr-10 text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          Accent Levels (Poetic System)
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          These are the accent marks used in the poetic books: Psalms, Job, Proverbs. Use this
          tool to highlight words in the passage by their accent function and rank.
        </p>

        <h4 className="mt-5 text-base font-bold text-gray-900 dark:text-gray-100">
          Disjunctive Accents
        </h4>
        <div className="mt-1 space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {ACCENT_INFO_DISJUNCTIVE_LEVELS.map((row) => (
            <p key={row.level}>
              {row.level}: {row.accents}
            </p>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          When using the smart highlighter, if a disjunctive accent is split over 2 words, the
          first word will be given a border color instead of fill color
        </p>

        <h4 className="mt-5 text-base font-bold text-gray-900 dark:text-gray-100">
          Conjunctives Accents
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {ACCENT_INFO_CONJUNCTIVES}
        </p>
      </div>
    </div>,
    document.body,
  );

const Structure = () => {
  const {
    ctxPassageProps,
    ctxStudyBook,
    ctxSelectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSelectedStrophes,
    ctxSetSelectedStrophes,
    ctxSetAccentBorderWordIds,
    ctxWordsColorMap,
    ctxStudyMetadata,
    ctxInViewMode,
    ctxInTextCounterOn,
    ctxSetInTextCounterOn,
    ctxCounterMode,
    ctxSetCounterMode,
  } = useContext(FormatContext);

  const { toggleHighlight, activeHighlightId } = useHighlightManager("structure");
  const [isOpen, setIsOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Word and Line Counter. Selected Words/Lines are live off the shared selection;
  // In-Text Counter on/off + Word/Prosodic mode live in FormatContext so the
  // passage's in-text gutter can read them.
  const [isCounterOpen, setIsCounterOpen] = useState(true);

  const selectedWordCount = useMemo(
    () => countSelectedWords(ctxSelectedWords ?? [], ctxSelectedStrophes ?? []),
    [ctxSelectedWords, ctxSelectedStrophes],
  );
  const selectedLineCount = useMemo(
    () => countSelectedLines(ctxSelectedWords ?? [], ctxSelectedStrophes ?? []),
    [ctxSelectedWords, ctxSelectedStrophes],
  );

  const closeInfo = useCallback(() => setShowInfo(false), []);

  // The info popup is portaled to document.body, so gate it behind mount.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close the info popup on Escape while it is open.
  useEffect(() => {
    if (!showInfo) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeInfo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showInfo, closeInfo]);

  const isPoeticBook = POETIC_BOOKS.has((ctxStudyBook ?? "").trim().toLowerCase());
  const allWords = useMemo(() => flattenWords(ctxPassageProps), [ctxPassageProps]);

  // Run the claim-based scanner over the passage in reading order.
  const scan = useMemo<ScanResult>(() => {
    if (!isPoeticBook || !allWords.length) {
      return EMPTY_SCAN;
    }
    const tokens: AccentToken[] = allWords.map((word) => ({
      hebrew: word.wlcWord ?? "",
      chapter: word.chapter,
      verse: word.verse,
    }));
    return scanAccents(tokens);
  }, [isPoeticBook, allWords]);

  // Aggregate occurrences into per-level (and conjunctive) buckets. Each accent
  // occurrence counts once. Coloring follows the accent MARKS, not the whole
  // prosodic (maqqef-joined) word:
  //   • the word that carries the resolving mark gets a solid fill;
  //   • the earlier word of a cross-word accent, and every word of a maqqef unit
  //     whose accent straddles the maqqef, get an outline (border) only;
  //   • a maqqef "leaner" carrying no mark of its own gets neither.
  const categories = useMemo(() => {
    const makeBucket = (): CategoryData => ({ count: 0, fillWords: [], borderWords: [] });
    const makeSeen = (): Record<CategoryKey, Set<number>> => ({
      "level-1": new Set(),
      "level-2": new Set(),
      "level-3": new Set(),
      "level-4": new Set(),
      conjunctive: new Set(),
    });
    const buckets: Record<CategoryKey, CategoryData> = {
      "level-1": makeBucket(),
      "level-2": makeBucket(),
      "level-3": makeBucket(),
      "level-4": makeBucket(),
      conjunctive: makeBucket(),
    };
    const fillSeen = makeSeen();
    const borderSeen = makeSeen();

    const addFill = (key: CategoryKey, t: number) => {
      const word = allWords[t];
      if (!word || fillSeen[key].has(word.wordId)) {
        return;
      }
      fillSeen[key].add(word.wordId);
      buckets[key].fillWords.push(word);
    };
    const addBorder = (key: CategoryKey, t: number) => {
      const word = allWords[t];
      if (!word || borderSeen[key].has(word.wordId)) {
        return;
      }
      borderSeen[key].add(word.wordId);
      buckets[key].borderWords.push(word);
    };

    Object.entries(scan.spans).forEach(([id, occurrences]) => {
      if (!occurrences?.length) {
        return;
      }
      const key = levelKey(getAccentLevel(id));

      occurrences.forEach((occ) => {
        buckets[key].count += 1;
        const claimTokens = new Set((occ.claims ?? []).map((claim) => claim.t));

        // Head = the prosodic word the accent resolves on.
        if (occ.head.length <= 1) {
          // Standalone word (no maqqef): solid fill.
          occ.head.forEach((t) => addFill(key, t));
        } else {
          const headMarked = occ.head.filter((t) => claimTokens.has(t));
          if (headMarked.length >= 2) {
            // Accent straddles the maqqef → outline the words it touches.
            headMarked.forEach((t) => addBorder(key, t));
          } else {
            // Accent sits on one word of the unit → fill it; leaner(s) stay blank.
            headMarked.forEach((t) => addFill(key, t));
          }
        }

        // Lead = the earlier word(s) of a cross-word accent (outline only).
        if (occ.lead.length === 1) {
          addBorder(key, occ.lead[0]);
        } else if (occ.lead.length > 1) {
          occ.lead.filter((t) => claimTokens.has(t)).forEach((t) => addBorder(key, t));
        }
      });
    });

    // A word that earns a solid fill anywhere in a category outranks an outline
    // it may also have picked up from another accent in the same category.
    CATEGORY_KEYS.forEach((key) => {
      buckets[key].borderWords = buckets[key].borderWords.filter(
        (word) => !fillSeen[key].has(word.wordId),
      );
    });

    return buckets;
  }, [scan, allWords]);

  const selectedWordIds = useMemo(() => {
    const set = new Set<number>();
    ctxSelectedWords.forEach((word) => set.add(word.wordId));
    return set;
  }, [ctxSelectedWords]);

  // A category counts as "selected" only when every one of its fill words is in
  // the shared selection — the same condition that shows a category button as
  // pressed. This is the single source of truth for both the button state and
  // the Smart Highlight payload, so the highlighted levels always match the
  // levels shown as selected.
  const isCategoryFullySelected = useCallback(
    (key: CategoryKey) => {
      const { fillWords } = categories[key];
      return fillWords.length > 0 && fillWords.every((word) => selectedWordIds.has(word.wordId));
    },
    [categories, selectedWordIds],
  );

  const selectedCategoryKeys = useMemo(
    () => CATEGORY_KEYS.filter(isCategoryFullySelected),
    [isCategoryFullySelected],
  );

  const paletteOptions = useMemo(
    () => ({ colorMap: ctxWordsColorMap, metadataMap: ctxStudyMetadata.words }),
    [ctxWordsColorMap, ctxStudyMetadata.words],
  );

  // Track the accent "portion" (border) words of any category whose fill words
  // are fully selected (i.e. selected via its Level/All button). When the user
  // then applies a fill color from the toolbar, these words receive a matching
  // border — the same fill/border split Smart Highlight produces. Portion words
  // are never part of the editable selection.
  useEffect(() => {
    const borderPartners = new Set<number>();
    selectedCategoryKeys.forEach((key) => {
      categories[key].borderWords.forEach((word) => borderPartners.add(word.wordId));
    });
    ctxSetAccentBorderWordIds(Array.from(borderPartners));
  }, [categories, selectedCategoryKeys, ctxSetAccentBorderWordIds]);

  // Clear the association when the panel is closed / unmounted.
  useEffect(() => () => ctxSetAccentBorderWordIds([]), [ctxSetAccentBorderWordIds]);

  const toggleCategorySelection = (words: WordProps[]) => {
    if (!words.length) {
      return;
    }
    const idsToToggle = new Set(words.map((word) => word.wordId));
    const allSelected = words.every((word) => selectedWordIds.has(word.wordId));
    let next = [...ctxSelectedWords];

    if (allSelected) {
      next = next.filter((word) => !idsToToggle.has(word.wordId));
    } else {
      const existing = new Set(next.map((word) => word.wordId));
      words.forEach((word) => {
        if (!existing.has(word.wordId)) {
          next.push(word);
          existing.add(word.wordId);
        }
      });
    }

    ctxSetSelectedWords(next);
    ctxSetNumSelectedWords(next.length);
    ctxSetSelectedStrophes([]);
  };

  // Levels that carry any accent (fill or border-only), i.e. the ones eligible to
  // be colored. "Highlight all" targets exactly this set.
  const nonEmptyCategoryKeys = useMemo(
    () =>
      CATEGORY_KEYS.filter(
        (key) => categories[key].fillWords.length > 0 || categories[key].borderWords.length > 0,
      ),
    [categories],
  );

  const hasAnyAccent = nonEmptyCategoryKeys.length > 0;
  const highlightDisabled = ctxInViewMode || !hasAnyAccent;

  // Levels currently colored, recovered from the active highlight id (the bare id
  // means every level). This is the "applied" tier of the state machine, mirroring
  // the Sounds tab's `highlightedIds`.
  const highlightedCategoryKeys = useMemo(
    () => keysFromHighlightId(activeHighlightId, nonEmptyCategoryKeys),
    [activeHighlightId, nonEmptyCategoryKeys],
  );

  // Same rule as Sounds' `highlightActive`: the button clears only when something
  // is applied AND nothing is staged. While levels are staged (selected) it reads
  // "Smart Highlight" and the next click applies/adds them.
  const isHighlightActive = activeHighlightId !== null && selectedCategoryKeys.length === 0;

  const clearStagedSelection = () => {
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    ctxSetSelectedStrophes([]);
  };

  // Three-branch state machine ported from the Sounds tab's makeToggleHighlight:
  //   1. Levels staged → merge them into the already-colored set (accumulate),
  //      re-color the union, then clear the staging.
  //   2. Nothing staged but something colored → clear all.
  //   3. Nothing staged and nothing colored → color every level.
  const handleSmartHighlight = () => {
    if (highlightDisabled) {
      return;
    }

    if (selectedCategoryKeys.length > 0) {
      const nextKeys = CATEGORY_KEYS.filter(
        (key) =>
          highlightedCategoryKeys.includes(key) || selectedCategoryKeys.includes(key),
      );
      const nextId = idForKeys(nextKeys);
      // Skip re-applying an identical set (e.g. re-staging already-colored levels);
      // just drop the staging so the colored levels stay put.
      if (nextId !== activeHighlightId) {
        toggleHighlight(nextId, buildGroupsForKeys(nextKeys, categories));
      }
      clearStagedSelection();
    } else if (activeHighlightId !== null) {
      // Toggling with the active id restores the words to their pre-highlight state.
      toggleHighlight(activeHighlightId, []);
    } else {
      toggleHighlight(
        STRUCTURE_HIGHLIGHT_ID,
        buildGroupsForKeys(nonEmptyCategoryKeys, categories),
      );
    }
  };

  const renderCategoryButton = (key: CategoryKey, label: string) => {
    const { fillWords, count } = categories[key];
    const selected = isCategoryFullySelected(key);
    const uniform = fillWords.length > 0 ? deriveUniformWordPalette(fillWords, paletteOptions) : undefined;
    const activeColors = uniform?.fill
      ? { fill: uniform.fill, border: uniform.border, text: uniform.text }
      : undefined;

    return (
      <AccentCategoryButton
        key={key}
        label={label}
        count={count}
        activeColors={activeColors}
        selected={selected}
        disabled={fillWords.length === 0}
        onClick={() => toggleCategorySelection(fillWords)}
      />
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            className="ClickBlock flex w-full items-center gap-2 py-4 px-2 text-left text-sm font-medium md:text-base"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <AccordionToggleIcon isOpen={isOpen} />
            <span className={isOpen ? "text-primary" : "text-black dark:text-white"}>
              Accents in Poetry
            </span>
            <span
              role="button"
              aria-label="About accents in poetry"
              className="ClickBlock inline-flex cursor-pointer items-center justify-center text-primary transition hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(true);
              }}
            >
              <MdInfoOutline size="18px" />
            </span>
          </button>

          {isMounted && showInfo && <AccentsInfoModal onClose={closeInfo} />}

          {isOpen && (
            <div className="space-y-4 p-4">
              {isPoeticBook ? (
                <>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Disjunctive
                    </h3>
                    <div className="flex flex-col gap-2">
                      {DISJUNCTIVE_ROWS.map((row) => renderCategoryButton(row.key, row.label))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Conjunctive
                    </h3>
                    <div className="flex flex-col gap-2">
                      {renderCategoryButton("conjunctive", "All")}
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={handleSmartHighlight}
                      disabled={highlightDisabled}
                      aria-pressed={isHighlightActive}
                      className={`ClickBlock inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-center font-medium transition lg:px-8 xl:px-10 ${
                        highlightDisabled
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : isHighlightActive
                            ? "bg-slate-300 text-slate-800 hover:bg-slate-200"
                            : "bg-primary text-white hover:bg-opacity-90"
                      }`}
                    >
                      {isHighlightActive ? "Clear Highlight" : "Smart Highlight"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Accents in Poetry applies to the poetic books &mdash; Job, Psalms and Proverbs.
                  Open a study in one of those books to analyze its cantillation accents.
                </p>
              )}
            </div>
          )}
        </div>

        <PausalForms allWords={allWords} scan={scan} />

        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            className="ClickBlock flex w-full items-center gap-2 py-4 px-2 text-left text-sm font-medium md:text-base"
            onClick={() => setIsCounterOpen((prev) => !prev)}
          >
            <AccordionToggleIcon isOpen={isCounterOpen} />
            <span className={isCounterOpen ? "text-primary" : "text-black dark:text-white"}>
              Word and Line Counter
            </span>
          </button>

          {isCounterOpen && (
            <div className="space-y-4 p-4">
              <div className="flex items-stretch gap-3">
                <div className="flex w-32 shrink-0 items-center justify-center rounded-md bg-graydark px-3 py-2 text-center text-sm font-medium leading-tight text-white">
                  Selected Words
                </div>
                <div
                  data-testid="selected-words-count"
                  className="flex flex-1 items-center justify-center rounded-md border-2 border-stroke bg-white px-4 py-2 text-lg font-semibold text-black dark:border-strokedark"
                >
                  {selectedWordCount}
                </div>
              </div>

              <div className="flex items-stretch gap-3">
                <div className="flex w-32 shrink-0 items-center justify-center rounded-md bg-graydark px-3 py-2 text-center text-sm font-medium leading-tight text-white">
                  Selected Lines
                </div>
                <div
                  data-testid="selected-lines-count"
                  className="flex flex-1 items-center justify-center rounded-md border-2 border-stroke bg-white px-4 py-2 text-lg font-semibold text-black dark:border-strokedark"
                >
                  {selectedLineCount}
                </div>
              </div>

              <div className="flex items-stretch gap-3 pt-2">
                <div className="flex w-32 shrink-0 items-center justify-center rounded-md bg-graydark px-3 py-2 text-center text-sm font-medium leading-tight text-white">
                  In-Text Counter
                </div>
                <div className="flex flex-1 overflow-hidden rounded-md border-2 border-stroke dark:border-strokedark">
                  <button
                    type="button"
                    onClick={() => ctxSetInTextCounterOn(true)}
                    aria-pressed={ctxInTextCounterOn}
                    className={`ClickBlock flex-1 px-4 py-2 text-sm font-medium transition ${
                      ctxInTextCounterOn
                        ? "bg-primary text-white"
                        : "bg-white text-black hover:bg-gray"
                    }`}
                  >
                    On
                  </button>
                  <button
                    type="button"
                    onClick={() => ctxSetInTextCounterOn(false)}
                    aria-pressed={!ctxInTextCounterOn}
                    className={`ClickBlock flex-1 px-4 py-2 text-sm font-medium transition ${
                      !ctxInTextCounterOn
                        ? "bg-primary text-white"
                        : "bg-white text-black hover:bg-gray"
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              <div className="flex items-stretch gap-3 pt-2">
                <div className="w-32 shrink-0" />
                <div
                  className={`flex flex-1 overflow-hidden rounded-md border-2 border-stroke dark:border-strokedark ${
                    ctxInTextCounterOn ? "" : "opacity-50"
                  }`}
                >
                  {[
                    { mode: "words" as const, label: "Word Count" },
                    { mode: "units" as const, label: "Prosodic Units" },
                  ].map(({ mode, label }) => {
                    const active = ctxInTextCounterOn && ctxCounterMode === mode;
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={!ctxInTextCounterOn}
                        onClick={() => ctxSetCounterMode(mode)}
                        aria-pressed={active}
                        className={`ClickBlock flex-1 px-4 py-2 text-sm font-medium transition ${
                          !ctxInTextCounterOn ? "cursor-not-allowed" : ""
                        } ${active ? "bg-primary text-white" : "bg-white text-black"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Structure;
