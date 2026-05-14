import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

import { FormatContext } from "..";
import AccordionToggleIcon from "./common/AccordionToggleIcon";
import {
  countLetterOccurrences,
  countSoundOccurrences,
  LETTER_CHIP_GROUPS,
  LETTER_CHIPS,
  SOUND_CHIPS,
} from "@/lib/hebrewHighlights";

type SoundsSectionId = "sound-distribution" | "letter-distribution";

type DistributionChipProps = {
  label: string;
  count: number;
  fill?: string;
  border?: string;
  text?: string;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
};

const DistributionChip = ({
  label,
  count,
  fill,
  border,
  text,
  isSelected,
  isHighlighted,
  onClick,
}: DistributionChipProps) => {
  // Yellow outline shows whenever the chip is selected (pending Smart Highlight).
  // Highlighted chips keep their fill color AND get the outline when also selected.
  const statusClassName = isSelected
    ? "outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-sm"
    : "outline-offset-[-4px]";

  // Colors only show when highlighted — default is white/gray (matching PDF page 7)
  const chipFill = isHighlighted ? (fill ?? "#FFFFFF") : "#FFFFFF";
  const chipBorder = isHighlighted ? (border ?? "#D9D9D9") : "#D9D9D9";
  const chipText = isHighlighted ? (text ?? "#525252") : "#525252";

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className={`wordBlock flex w-full rounded border ${statusClassName}`}
        style={{
          background: chipFill,
          border: `2px solid ${chipBorder}`,
          color: chipText,
        }}
      >
        <span className="flex w-full select-none items-center justify-center gap-2 px-2 py-1.5 text-center text-base leading-none hover:opacity-80">
          <span className="text-black">{label}</span>
          <span className="flex h-6.5 min-w-6.5 items-center justify-center rounded-full bg-[#EFEFEF] px-1 text-sm text-black">
            {count}
          </span>
        </span>
      </button>
    </div>
  );
};

const SoundsHighlightButton = ({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-center font-medium transition lg:px-8 xl:px-10 ${
      disabled
        ? "cursor-not-allowed bg-slate-200 text-slate-500"
        : active
          ? "bg-slate-300 text-slate-800 hover:bg-slate-200"
          : "bg-primary text-white hover:bg-opacity-90"
    }`}
    aria-pressed={active}
  >
    {active ? "Clear Highlight" : "Smart Highlight"}
  </button>
);

const Sounds = () => {
  const {
    ctxPassageProps,
    ctxSelectedSoundChipIds,
    ctxSetSelectedSoundChipIds,
    ctxHighlightedSoundChipIds,
    ctxSetHighlightedSoundChipIds,
    ctxSoundHighlightEnabled,
    ctxSetSoundHighlightEnabled,
    ctxSelectedLetterChipIds,
    ctxSetSelectedLetterChipIds,
    ctxHighlightedLetterChipIds,
    ctxSetHighlightedLetterChipIds,
    ctxLetterHighlightEnabled,
    ctxSetLetterHighlightEnabled,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
  } = useContext(FormatContext);
  const [openSection, setOpenSection] = useState<SoundsSectionId | null>("sound-distribution");

  const [showTooltip, setShowTooltip] = useState(false);
  const [showLetterTooltip, setShowLetterTooltip] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTooltip(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTooltip]);

  useEffect(() => {
    if (!showLetterTooltip) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLetterTooltip(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLetterTooltip]);

  const soundSectionRef = useRef<HTMLDivElement>(null);
  const letterSectionRef = useRef<HTMLDivElement>(null);

  // Deselect all sound chips when the user clicks outside the sound section.
  // Uses "click" (not "mousedown") to avoid racing with useDragToSelect's mousedown→mouseup
  // word-deselect mechanism in the passage.
  useEffect(() => {
    if (ctxSelectedSoundChipIds.length === 0) return;
    const handleClick = (e: MouseEvent) => {
      if (showTooltip) return;
      if (soundSectionRef.current && !soundSectionRef.current.contains(e.target as Node)) {
        ctxSetSelectedSoundChipIds([]);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [ctxSelectedSoundChipIds, ctxSetSelectedSoundChipIds, showTooltip]);

  // Deselect all letter chips when the user clicks outside the letter section.
  useEffect(() => {
    if (ctxSelectedLetterChipIds.length === 0) return;
    const handleClick = (e: MouseEvent) => {
      if (showLetterTooltip) return;
      if (letterSectionRef.current && !letterSectionRef.current.contains(e.target as Node)) {
        ctxSetSelectedLetterChipIds([]);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [ctxSelectedLetterChipIds, ctxSetSelectedLetterChipIds, showLetterTooltip]);

  const toggleSection = (sectionId: SoundsSectionId) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const allWords = useMemo(() => {
    const words = [];
    for (const stanza of ctxPassageProps.stanzaProps) {
      for (const strophe of stanza.strophes) {
        for (const line of strophe.lines) {
          for (const word of line.words) {
            words.push(word);
          }
        }
      }
    }
    return words;
  }, [ctxPassageProps]);

  const soundCounts = useMemo(() => {
    const counts = new Map<string, number>();
    SOUND_CHIPS.forEach((chip) => counts.set(chip.id, 0));

    allWords.forEach((word) => {
      SOUND_CHIPS.forEach((chip) => {
        counts.set(chip.id, (counts.get(chip.id) || 0) + countSoundOccurrences(word, chip.id));
      });
    });

    return counts;
  }, [allWords]);

  const letterCounts = useMemo(() => {
    const counts = new Map<string, number>();
    LETTER_CHIPS.forEach((chip) => counts.set(chip.id, 0));

    allWords.forEach((word) => {
      LETTER_CHIPS.forEach((chip) => {
        counts.set(chip.id, (counts.get(chip.id) || 0) + countLetterOccurrences(word, chip.id));
      });
    });

    return counts;
  }, [allWords]);

  const toggleSoundChip = (chipId: string) => {
    ctxSetSelectedSoundChipIds(
      ctxSelectedSoundChipIds.includes(chipId)
        ? ctxSelectedSoundChipIds.filter((id) => id !== chipId)
        : [...ctxSelectedSoundChipIds, chipId],
    );
  };

  const toggleLetterChip = (memberIds: string[]) => {
    const allSelected = memberIds.every((id) => ctxSelectedLetterChipIds.includes(id));
    ctxSetSelectedLetterChipIds(
      allSelected
        ? ctxSelectedLetterChipIds.filter((id) => !memberIds.includes(id))
        : [...ctxSelectedLetterChipIds.filter((id) => !memberIds.includes(id)), ...memberIds],
    );
  };

  const toggleSoundHighlight = () => {
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    if (ctxSelectedSoundChipIds.length > 0) {
      const merged = [...new Set([...ctxHighlightedSoundChipIds, ...ctxSelectedSoundChipIds])];
      ctxSetHighlightedSoundChipIds(merged);
      ctxSetSoundHighlightEnabled(true);
      ctxSetSelectedSoundChipIds([]);
      ctxSetSelectedLetterChipIds([]);
      ctxSetLetterHighlightEnabled(false);
    } else if (ctxSoundHighlightEnabled) {
      ctxSetHighlightedSoundChipIds([]);
      ctxSetSoundHighlightEnabled(false);
    }
  };

  const toggleLetterHighlight = () => {
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    if (ctxSelectedLetterChipIds.length > 0) {
      const merged = [...new Set([...ctxHighlightedLetterChipIds, ...ctxSelectedLetterChipIds])];
      ctxSetHighlightedLetterChipIds(merged);
      ctxSetLetterHighlightEnabled(true);
      ctxSetSelectedLetterChipIds([]);
      ctxSetSelectedSoundChipIds([]);
      ctxSetSoundHighlightEnabled(false);
    } else if (ctxLetterHighlightEnabled) {
      ctxSetHighlightedLetterChipIds([]);
      ctxSetLetterHighlightEnabled(false);
    }
  };

  const soundTooltipP1 =
    "Some Hebrew letters can produce similar sounds. For example, the letters \u05DB and \u05E7 can both produce the \u201ck\u201d sound. Hebrew poetry can create patterns between words that sound similar even if they are spelled differently, such as \u05E7\u05D5\u05B9\u05DC (Kol) and \u05DB\u05BC\u05B9\u05DC (Kol) in Psalm 29:9. This tool helps you detect sound patterns and sound echoes throughout a passage based on how words are heard, not how they are written.";
  const soundTooltipNote =
    "Highlights from this tool are only visible in the Hebrew text and English transliteration, not in the default English display.";

  const letterTooltipP1 =
    "Some Hebrew letters can produce different sounds. For example, the letter \u05D1 can produce a \u201cb\u201d or \u201cv\u201d sound. Hebrew poetry can also create patterns between words that are spelled similarly, even when they do not sound similar when read aloud, such as \u05E7\u05B6\u05D1\u05B6\u05E8 (Qever) and \u05D1\u05BC\u05B9\u05E7\u05B6\u05E8 (Boqer) in Psalm 88:12,14. This tool helps you detect visual literary patterns and letter echoes throughout a passage based on how words are written, not how they are heard.";
  const letterTooltipNote =
    "Highlights from this tool are only visible in the Hebrew text, not in the default English gloss or transliteration display.";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        <div ref={soundSectionRef} className="ClickBlock mx-4 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            className="ClickBlock flex w-full items-center gap-2 px-2 py-4 text-left text-sm font-medium md:text-base"
            onClick={() => toggleSection("sound-distribution")}
          >
            <AccordionToggleIcon isOpen={openSection === "sound-distribution"} />
            <span className={openSection === "sound-distribution" ? "text-primary" : "text-black dark:text-white"}>
              Hebrew Sound Distribution
            </span>
            <span
              className="relative ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              onClick={(e) => { e.stopPropagation(); setShowTooltip(true); }}
              role="button"
              aria-label="About sound distribution"
            >
              i
            </span>
          </button>

          {isMounted && showTooltip && createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sound-dist-modal-title"
              onClick={(e) => { if (e.target === e.currentTarget) setShowTooltip(false); }}
            >
              <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Close"
                >
                  <IconX size={18} stroke={2} />
                </button>
                <div className="flex items-center gap-2 text-primary">
                  <IconInfoCircle size={22} stroke={2.2} />
                  <h3 id="sound-dist-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Hebrew Sound Distribution
                  </h3>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  <p>{soundTooltipP1}</p>
                  <p className="text-xs italic text-gray-500 dark:text-gray-400"><span className="font-semibold not-italic">Note:</span> {soundTooltipNote}</p>
                </div>
              </div>
            </div>,
            document.body,
          )}

          {openSection === "sound-distribution" && (
            <div
              className="space-y-4 p-4"
              onClick={(e) => {
                // Deselect chips when clicking blank space (not on a button).
                if (!(e.target as HTMLElement).closest("button")) {
                  ctxSetSelectedSoundChipIds([]);
                }
              }}
            >
              <div className="grid grid-cols-4 gap-1">
                {SOUND_CHIPS.map((chip) => (
                  <DistributionChip
                    key={chip.id}
                    label={chip.label}
                    count={soundCounts.get(chip.id) || 0}
                    fill={chip.palette.fill}
                    border={chip.palette.border}
                    text={chip.palette.text}
                    isSelected={ctxSelectedSoundChipIds.includes(chip.id)}
                    isHighlighted={ctxSoundHighlightEnabled && ctxHighlightedSoundChipIds.includes(chip.id)}
                    onClick={() => toggleSoundChip(chip.id)}
                  />
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <SoundsHighlightButton
                  active={ctxSoundHighlightEnabled && ctxSelectedSoundChipIds.length === 0}
                  disabled={ctxSelectedSoundChipIds.length === 0 && !ctxSoundHighlightEnabled}
                  onClick={toggleSoundHighlight}
                />
              </div>
            </div>
          )}
        </div>

        <div ref={letterSectionRef} className="ClickBlock mx-4 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            className="ClickBlock flex w-full items-center gap-2 px-2 py-4 text-left text-sm font-medium md:text-base"
            onClick={() => toggleSection("letter-distribution")}
          >
            <AccordionToggleIcon isOpen={openSection === "letter-distribution"} />
            <span className={openSection === "letter-distribution" ? "text-primary" : "text-black dark:text-white"}>
              Hebrew Letters Distribution
            </span>
            <span
              className="relative ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              onClick={(e) => { e.stopPropagation(); setShowLetterTooltip(true); }}
              role="button"
              aria-label="About letter distribution"
            >
              i
            </span>
          </button>

          {isMounted && showLetterTooltip && createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="letter-dist-modal-title"
              onClick={(e) => { if (e.target === e.currentTarget) setShowLetterTooltip(false); }}
            >
              <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowLetterTooltip(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Close"
                >
                  <IconX size={18} stroke={2} />
                </button>
                <div className="flex items-center gap-2 text-primary">
                  <IconInfoCircle size={22} stroke={2.2} />
                  <h3 id="letter-dist-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Hebrew Letters Distribution
                  </h3>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  <p>{letterTooltipP1}</p>
                  <p className="text-xs italic text-gray-500 dark:text-gray-400"><span className="font-semibold not-italic">Note:</span> {letterTooltipNote}</p>
                </div>
              </div>
            </div>,
            document.body,
          )}

          {openSection === "letter-distribution" && (
            <div
              className="space-y-4 p-4"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest("button")) {
                  ctxSetSelectedLetterChipIds([]);
                }
              }}
            >
              <div className="grid grid-cols-4 gap-1">
                {LETTER_CHIP_GROUPS.map((group) => {
                  const groupCount = group.memberIds.reduce(
                    (sum, id) => sum + (letterCounts.get(id) || 0),
                    0,
                  );
                  const isSelected = group.memberIds.every((id) =>
                    ctxSelectedLetterChipIds.includes(id),
                  );
                  const isHighlighted = ctxLetterHighlightEnabled &&
                    group.memberIds.every((id) => ctxHighlightedLetterChipIds.includes(id));

                  return (
                    <DistributionChip
                      key={group.id}
                      label={group.label}
                      count={groupCount}
                      fill={group.palette.fill}
                      border={group.palette.border}
                      text={group.palette.text}
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      onClick={() => toggleLetterChip(group.memberIds)}
                    />
                  );
                })}
              </div>
              <div className="flex justify-center pt-2">
                <SoundsHighlightButton
                  active={ctxLetterHighlightEnabled && ctxSelectedLetterChipIds.length === 0}
                  disabled={ctxSelectedLetterChipIds.length === 0 && !ctxLetterHighlightEnabled}
                  onClick={toggleLetterHighlight}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 text-sm leading-6 text-slate-600">
          Individual-letter highlights stay in the browser for now and are not saved to the database. You can still use the main formatting tools on words and strophes, but these sound and letter views act like browsing filters.
        </div>
      </div>
    </div>
  );
};

export default Sounds;
