import { useEffect } from "react";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

import { WordInformation } from "@/lib/data";
import DiscoveryModal from "@/components/Modals/Footer/DiscoveryModal";
import StepBibleModal from "@/components/Modals/Footer/StepBibleModal";
import BSBModal from "@/components/Modals/Footer/BSBModal";
import ESVModal from "@/components/Modals/Footer/ESVModal";
import OHBModal from "@/components/Modals/Footer/OHBModal";

type WordAnalysisModalProps = {
  open: boolean;
  onClose: () => void;
  wordInformation?: WordInformation;
};

const WordAnalysisModal = ({ open, onClose, wordInformation }: WordAnalysisModalProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !wordInformation) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const meaningMarkup = wordInformation.meaning
    ? wordInformation.meaning.replace(/\n/g, "<br />")
    : "";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-analysis-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Close word analysis"
        >
          <IconX size={18} stroke={2} />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <IconInfoCircle size={22} stroke={2.2} />
          <h3 id="word-analysis-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Word analysis
          </h3>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <span className="tracking-tight">{wordInformation.hebrew}</span>
            {wordInformation.transliteration && (
              <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                ({wordInformation.transliteration})
              </span>
            )}
            {wordInformation.gloss && (
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {wordInformation.gloss}
              </span>
            )}
          </div>

          {wordInformation.strongsNumber && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Strong&apos;s Number: {wordInformation.strongsNumber}
            </p>
          )}

          {meaningMarkup && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
              <p className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Meaning</p>
              <div className="max-h-60 overflow-y-auto pr-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                <div dangerouslySetInnerHTML={{ __html: meaningMarkup }} />
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Copyright information</p>
            <p className="text-gray-500 dark:text-gray-400">
              Word data displayed here is compiled from the following resources:
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <DiscoveryModal triggerClassName="px-0 text-xs font-medium text-primary hover:underline" />
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <StepBibleModal triggerClassName="px-0 text-xs font-medium text-primary hover:underline" />
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <BSBModal triggerClassName="px-0 text-xs font-medium text-primary hover:underline" />
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <ESVModal triggerClassName="px-0 text-xs font-medium text-primary hover:underline" />
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <OHBModal triggerClassName="px-0 text-xs font-medium text-primary hover:underline" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordAnalysisModal;
