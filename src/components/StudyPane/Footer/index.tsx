"use client";

import { useContext, useMemo, useState } from "react";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import clsx from "clsx";

import BSBModal from "@/components/Modals/Footer/BSBModal";
import DiscoveryModal from "@/components/Modals/Footer/DiscoveryModal";
import ESVModal from "@/components/Modals/Footer/ESVModal";
import OHBModal from "@/components/Modals/Footer/OHBModal";
import StepBibleModal from "@/components/Modals/Footer/StepBibleModal";
import { FormatContext } from "../index";

import WordAnalysisModal from "./WordAnalysisModal";

export const Footer = () => {
  const { ctxSelectedWords } = useContext(FormatContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const activeWord = useMemo(() => {
    if (!ctxSelectedWords.length) {
      return null;
    }

    return ctxSelectedWords[ctxSelectedWords.length - 1];
  }, [ctxSelectedWords]);

  const wordInformation = activeWord?.wordInformation;
  const morphology =
    wordInformation?.morphology?.trim() ||
    activeWord?.morphology?.trim() ||
    "";
  const hasWordInfo = Boolean(
    wordInformation &&
      (wordInformation.hebrew ||
        wordInformation.transliteration ||
        wordInformation.gloss ||
        morphology ||
        wordInformation.meaning)
  );

  const inlineWordSummary = hasWordInfo ? (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-200">
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base font-semibold text-gray-900 dark:text-gray-100">
        <span>{wordInformation?.hebrew}</span>
        {wordInformation?.transliteration && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            ({wordInformation.transliteration})
          </span>
        )}
        {wordInformation?.gloss && (
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {wordInformation.gloss}
          </span>
        )}
        {morphology && (
          <span className="text-xs font-medium tracking-wide text-gray-600 dark:text-gray-400">
            Morphology: {morphology}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => setShowAnalysisModal(true)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 text-primary transition hover:border-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Open word analysis"
      >
        <IconInfoCircle size={18} stroke={2.4} />
      </button>
    </div>
  ) : (
    <span className="text-sm italic text-gray-500 dark:text-gray-400">
      {activeWord
        ? "No additional word information is available for this selection."
        : "Select a word to view detailed information."}
    </span>
  );

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 py-3 shadow-inner backdrop-blur dark:border-slate-700 dark:bg-gray-900/95">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className={clsx(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isExpanded
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-slate-300 text-slate-600 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              )}
              aria-expanded={isExpanded}
              aria-controls="word-information-bar"
            >
              <IconInfoCircle size={18} stroke={2.2} />
              <span>Word Information</span>
              <IconChevronDown
                size={16}
                stroke={2}
                className={clsx("transition-transform", isExpanded ? "rotate-180" : "rotate-0")}
              />
            </button>

            {isExpanded && (
              <div id="word-information-bar" className="min-w-0">
                {inlineWordSummary}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Copyright Information for</span>
            <DiscoveryModal triggerClassName="px-0 hover:underline" />
            <span>,</span>
            <StepBibleModal triggerClassName="px-0 hover:underline" />
            <span>,</span>
            <BSBModal triggerClassName="px-0 hover:underline" />
            <span>,</span>
            <ESVModal triggerClassName="px-0 hover:underline" />
            <span>,</span>
            <OHBModal triggerClassName="px-0 hover:underline" />
          </div>
        </div>
      </footer>

      <WordAnalysisModal
        open={showAnalysisModal && hasWordInfo}
        onClose={() => setShowAnalysisModal(false)}
        wordInformation={wordInformation}
      />
    </>
  );
};
