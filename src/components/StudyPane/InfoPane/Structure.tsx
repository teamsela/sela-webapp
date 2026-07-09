import React, { useContext, useEffect, useMemo, useState } from "react";
import { MdInfoOutline } from "react-icons/md";

import { DEFAULT_BORDER_COLOR } from "@/lib/colors";
import { PassageProps, WordProps } from "@/lib/data";
import { getAccentLevel, scanAccents, AccentLevel, AccentToken, ScanResult } from "@/lib/poeticAccents";
import { deriveUniformWordPalette } from "@/lib/utils";

import { FormatContext } from "..";
import AccordionToggleIcon from "./common/AccordionToggleIcon";
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

/** head = resolving words (fill); lead = earlier words of a spanning accent (underline / border). */
type CategoryData = { count: number; headWords: WordProps[]; leadWords: WordProps[] };

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
      className={`ClickBlock relative flex w-full items-center justify-between rounded-md border-2 px-4 py-3 text-sm font-medium transition
        ${disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-90"}
        ${selected ? "outline outline-[3px] outline-offset-1 outline-[#FFC300] drop-shadow-md" : ""}`}
    >
      <span className="flex-1 select-none text-center">{label}</span>
      <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] px-2 text-sm text-black">
        {count}
      </span>
    </button>
  );
};

const Structure = () => {
  const {
    ctxPassageProps,
    ctxStudyBook,
    ctxSelectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxSetUnderlinedWordIds,
    ctxWordsColorMap,
    ctxStudyMetadata,
    ctxInViewMode,
  } = useContext(FormatContext);

  const { toggleHighlight, activeHighlightId } = useHighlightManager("structure");
  const [isOpen, setIsOpen] = useState(true);

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
  // occurrence counts once; its head word(s) get the fill, its lead word(s) the
  // underline / border.
  const categories = useMemo(() => {
    const buckets: Record<CategoryKey, CategoryData> = {
      "level-1": { count: 0, headWords: [], leadWords: [] },
      "level-2": { count: 0, headWords: [], leadWords: [] },
      "level-3": { count: 0, headWords: [], leadWords: [] },
      "level-4": { count: 0, headWords: [], leadWords: [] },
      conjunctive: { count: 0, headWords: [], leadWords: [] },
    };
    const seenHead: Record<CategoryKey, Set<number>> = {
      "level-1": new Set(),
      "level-2": new Set(),
      "level-3": new Set(),
      "level-4": new Set(),
      conjunctive: new Set(),
    };
    const seenLead: Record<CategoryKey, Set<number>> = {
      "level-1": new Set(),
      "level-2": new Set(),
      "level-3": new Set(),
      "level-4": new Set(),
      conjunctive: new Set(),
    };

    Object.entries(scan.spans).forEach(([id, occurrences]) => {
      if (!occurrences?.length) {
        return;
      }
      const key = levelKey(getAccentLevel(id));
      const bucket = buckets[key];

      occurrences.forEach((occ) => {
        bucket.count += 1;
        occ.head.forEach((t) => {
          const word = allWords[t];
          if (word && !seenHead[key].has(word.wordId)) {
            seenHead[key].add(word.wordId);
            bucket.headWords.push(word);
          }
        });
        occ.lead.forEach((t) => {
          const word = allWords[t];
          if (word && !seenLead[key].has(word.wordId)) {
            seenLead[key].add(word.wordId);
            bucket.leadWords.push(word);
          }
        });
      });
    });

    return buckets;
  }, [scan, allWords]);

  const selectedWordIds = useMemo(() => {
    const set = new Set<number>();
    ctxSelectedWords.forEach((word) => set.add(word.wordId));
    return set;
  }, [ctxSelectedWords]);

  const paletteOptions = useMemo(
    () => ({ colorMap: ctxWordsColorMap, metadataMap: ctxStudyMetadata.words }),
    [ctxWordsColorMap, ctxStudyMetadata.words],
  );

  // Underline the lead words of any category whose head words are fully selected
  // (i.e. selected via its Level/All button). Lead words are never editable.
  useEffect(() => {
    const underlined = new Set<number>();
    CATEGORY_KEYS.forEach((key) => {
      const { headWords, leadWords } = categories[key];
      if (headWords.length > 0 && headWords.every((word) => selectedWordIds.has(word.wordId))) {
        leadWords.forEach((word) => underlined.add(word.wordId));
      }
    });
    ctxSetUnderlinedWordIds(Array.from(underlined));
  }, [categories, selectedWordIds, ctxSetUnderlinedWordIds]);

  // Clear the underline cue when the panel is closed / unmounted.
  useEffect(() => () => ctxSetUnderlinedWordIds([]), [ctxSetUnderlinedWordIds]);

  const isHighlightActive = activeHighlightId === STRUCTURE_HIGHLIGHT_ID;

  const toggleCategorySelection = (headWords: WordProps[]) => {
    if (!headWords.length) {
      return;
    }
    const idsToToggle = new Set(headWords.map((word) => word.wordId));
    const allSelected = headWords.every((word) => selectedWordIds.has(word.wordId));
    let next = [...ctxSelectedWords];

    if (allSelected) {
      next = next.filter((word) => !idsToToggle.has(word.wordId));
    } else {
      const existing = new Set(next.map((word) => word.wordId));
      headWords.forEach((word) => {
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

  // Smart Highlight colors EVERY category at once (independent of selection):
  // head words get the category fill; lead words get the category color as a
  // border only, leaving their fill untouched.
  const highlightGroups: HighlightGroup[] = useMemo(() => {
    const groups: HighlightGroup[] = [];
    CATEGORY_KEYS.forEach((key) => {
      const { headWords, leadWords } = categories[key];
      const palette = CATEGORY_PALETTE[key];
      if (headWords.length > 0) {
        groups.push({
          label: `${key}-head`,
          words: headWords,
          palette: { fill: palette.fill, border: palette.fill, text: palette.text },
        });
      }
      if (leadWords.length > 0) {
        groups.push({
          label: `${key}-lead`,
          words: leadWords,
          palette: { border: palette.fill },
        });
      }
    });
    return groups;
  }, [categories]);

  const hasAnyAccent = highlightGroups.length > 0;
  const highlightDisabled = ctxInViewMode || !hasAnyAccent;

  const handleSmartHighlight = () => {
    if (highlightDisabled) {
      return;
    }
    toggleHighlight(STRUCTURE_HIGHLIGHT_ID, highlightGroups);
  };

  const renderCategoryButton = (key: CategoryKey, label: string) => {
    const { headWords, count } = categories[key];
    const selected = headWords.length > 0 && headWords.every((word) => selectedWordIds.has(word.wordId));
    const uniform = headWords.length > 0 ? deriveUniformWordPalette(headWords, paletteOptions) : undefined;
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
        disabled={headWords.length === 0}
        onClick={() => toggleCategorySelection(headWords)}
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
            <MdInfoOutline
              className="text-primary"
              size="18px"
              title="Cantillation accents grouped by disjunctive level (1 strongest to 4 weakest) and conjunctives. Applies to Job, Psalms and Proverbs."
            />
          </button>

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
      </div>

      {isPoeticBook && (
        <div className="flex justify-center p-4">
          <button
            type="button"
            onClick={handleSmartHighlight}
            disabled={highlightDisabled}
            aria-pressed={isHighlightActive}
            className={`ClickBlock inline-flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-4 text-center font-medium transition ${
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
      )}
    </div>
  );
};

export default Structure;
