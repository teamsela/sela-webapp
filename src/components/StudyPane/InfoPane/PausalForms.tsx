"use client";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { MdInfoOutline } from "react-icons/md";

import { DEFAULT_BORDER_COLOR } from "@/lib/colors";
import { WordProps } from "@/lib/data";
import { ScanResult } from "@/lib/poeticAccents";
import { parsePausalCatalogue, selectPausalTokens } from "@/lib/pausalForms";
import { PAUSAL_FORMS_RAW } from "@/lib/pausalFormsData";
import { deriveUniformWordPalette } from "@/lib/utils";

import { FormatContext } from "..";
import AccordionToggleIcon from "./common/AccordionToggleIcon";
import { HighlightGroup, useHighlightManager } from "./useHighlightManager";

const PAUSAL_HIGHLIGHT_ID = "pausal-forms";

// The pausal-forms catalogue covers Psalms only.
const PAUSAL_BOOK = "psalms";

// Yellow fill applied to pausal words (drawn from the app swatch set); black text
// keeps the pointed Hebrew readable. Change these to adjust the highlight color.
const PAUSAL_FILL = "#FFF176";
const PAUSAL_TEXT = "#000000";

// The catalogue is embedded (see @/lib/pausalFormsData); parse it once at load.
const PAUSAL_CATALOGUE = parsePausalCatalogue(PAUSAL_FORMS_RAW);

const PAUSAL_INFO_TITLE_ID = "pausal-forms-info-title";

// Reference popup describing what a pausal form is and how Smart Highlight colors
// the words. Portaled to document.body so it overlays the whole study view.
const PausalInfoModal = ({ onClose }: { onClose: () => void }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={PAUSAL_INFO_TITLE_ID}
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
          id={PAUSAL_INFO_TITLE_ID}
          className="pr-10 text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          Pausal Forms
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          A <em>pausal form</em> is a word whose vowels or stress shift because it falls at a major
          prosodic break in the verse. In the Masoretic system those breaks are marked by specific
          cantillation accents, so a pausal form is located by the accent it carries.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <strong>Smart Highlight</strong> clears any existing colors on the page, then fills every
          word carrying a catalogued pausal-form accent with yellow. The count shows how many words
          are highlighted.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          The catalogue covers <strong>Psalms</strong> only, so the tool is enabled when a Psalms
          study is open.
        </p>
      </div>
    </div>,
    document.body,
  );

type PausalFormsProps = {
  /** Every word of the loaded passage in reading order. */
  allWords: WordProps[];
  /** Result of `scanAccents` over `allWords` (index-aligned with it). */
  scan: ScanResult;
};

/**
 * "Pausal Forms" accordion (second section of the Structure tab). A single
 * "All Pausal Forms" label with a live count, plus a Smart Highlight button that
 * clears the page and fills every pausal word yellow. Enabled for Psalms only.
 */
const PausalForms = ({ allWords, scan }: PausalFormsProps) => {
  const {
    ctxStudyBook,
    ctxSelectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxWordsColorMap,
    ctxStudyMetadata,
    ctxInViewMode,
  } = useContext(FormatContext);

  const { toggleHighlight, activeHighlightId } = useHighlightManager("pausal");
  const [isOpen, setIsOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  const isPsalms = (ctxStudyBook ?? "").trim().toLowerCase() === PAUSAL_BOOK;

  // Words that carry a mark of a catalogued pausal accent for their
  // (offset-corrected) verse. Selection uses the scan's claimed marks, so both
  // words of a cross-word compound fill while a maqqef leaner does not.
  const pausalWords = useMemo<WordProps[]>(() => {
    if (!isPsalms || !allWords.length) {
      return [];
    }
    const { indices } = selectPausalTokens(allWords, scan.spans, PAUSAL_CATALOGUE);
    return indices.map((index) => allWords[index]);
  }, [isPsalms, allWords, scan]);

  const count = pausalWords.length;

  const paletteOptions = useMemo(
    () => ({ colorMap: ctxWordsColorMap, metadataMap: ctxStudyMetadata.words }),
    [ctxWordsColorMap, ctxStudyMetadata.words],
  );

  const selectedWordIds = useMemo(() => {
    const set = new Set<number>();
    ctxSelectedWords.forEach((word) => set.add(word.wordId));
    return set;
  }, [ctxSelectedWords]);

  const allSelected =
    count > 0 && pausalWords.every((word) => selectedWordIds.has(word.wordId));

  // When the pausal words are colored, the label reflects their uniform fill —
  // exactly like the Accents-in-Poetry category buttons.
  const uniform = count > 0 ? deriveUniformWordPalette(pausalWords, paletteOptions) : undefined;
  const activeColors = uniform?.fill
    ? { fill: uniform.fill, border: uniform.border ?? uniform.fill, text: uniform.text ?? "#000000" }
    : undefined;

  const highlightDisabled = ctxInViewMode || !isPsalms || count === 0;
  const isHighlightActive = activeHighlightId !== null;

  // Clicking the "All Pausal Forms" label stages/unstages the pausal words in the
  // shared selection so they can also be colored from the toolbar.
  const toggleSelection = () => {
    if (!count || ctxInViewMode) {
      return;
    }
    const ids = new Set(pausalWords.map((word) => word.wordId));
    let next = [...ctxSelectedWords];
    if (allSelected) {
      next = next.filter((word) => !ids.has(word.wordId));
    } else {
      const existing = new Set(next.map((word) => word.wordId));
      pausalWords.forEach((word) => {
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

  // Smart Highlight: clear all page colors, then fill every pausal word yellow.
  // Toggling while active restores the pre-highlight state.
  const handleSmartHighlight = () => {
    if (highlightDisabled) {
      return;
    }
    if (isHighlightActive) {
      toggleHighlight(activeHighlightId, []);
      return;
    }
    const group: HighlightGroup = {
      label: "pausal-forms",
      words: pausalWords,
      palette: { fill: PAUSAL_FILL, border: PAUSAL_FILL, text: PAUSAL_TEXT },
    };
    toggleHighlight(PAUSAL_HIGHLIGHT_ID, [group]);
  };

  const labelStyle = activeColors
    ? {
        background: activeColors.fill,
        borderColor: activeColors.border,
        color: activeColors.text,
      }
    : { background: "#FFFFFF", borderColor: DEFAULT_BORDER_COLOR, color: "#1c2434" };

  return (
    <div className="mx-4 border-b border-stroke dark:border-strokedark">
      <button
        type="button"
        className="ClickBlock flex w-full items-center gap-2 py-4 px-2 text-left text-sm font-medium md:text-base"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <AccordionToggleIcon isOpen={isOpen} />
        <span className={isOpen ? "text-primary" : "text-black dark:text-white"}>Pausal Forms</span>
        <span
          role="button"
          aria-label="About pausal forms"
          className="ClickBlock inline-flex cursor-pointer items-center justify-center text-primary transition hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo(true);
          }}
        >
          <MdInfoOutline size="18px" />
        </span>
      </button>

      {isMounted && showInfo && <PausalInfoModal onClose={closeInfo} />}

      {isOpen && (
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleSelection}
              disabled={ctxInViewMode || !isPsalms || count === 0}
              aria-pressed={allSelected}
              style={labelStyle}
              className={`ClickBlock relative flex w-full items-center justify-between rounded-md border-2 px-4 py-1 text-lg transition
                ${
                  ctxInViewMode || !isPsalms || count === 0
                    ? "cursor-not-allowed opacity-50"
                    : "hover:opacity-90"
                }
                ${allSelected ? "outline outline-[3px] outline-offset-1 outline-[#FFC300] drop-shadow-md" : ""}`}
            >
              <span className="flex-1 select-none text-center leading-none">All Pausal Forms</span>
              <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] px-2 text-sm text-black">
                {count}
              </span>
            </button>
          </div>

          {!isPsalms && (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Pausal forms are catalogued for Psalms. Load Psalms to enable this tool.
            </p>
          )}

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
        </div>
      )}
    </div>
  );
};

export default PausalForms;
