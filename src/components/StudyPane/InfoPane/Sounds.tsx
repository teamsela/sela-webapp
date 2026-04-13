import React, { useContext, useEffect, useMemo, useState } from "react";

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
  const statusClassName = isHighlighted
    ? "outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md"
    : isSelected
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
          <span>{label}</span>
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
    ctxSoundHighlightEnabled,
    ctxSetSoundHighlightEnabled,
    ctxSelectedLetterChipIds,
    ctxSetSelectedLetterChipIds,
    ctxLetterHighlightEnabled,
    ctxSetLetterHighlightEnabled,
  } = useContext(FormatContext);
  const [openSection, setOpenSection] = useState<SoundsSectionId>("sound-distribution");

  const [showTooltip, setShowTooltip] = useState(false);

  const toggleSection = (sectionId: SoundsSectionId) => {
    setOpenSection((prev) => (prev === sectionId ? prev : sectionId));
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

  useEffect(() => {
    if (ctxSelectedSoundChipIds.length === 0 && ctxSoundHighlightEnabled) {
      ctxSetSoundHighlightEnabled(false);
    }
  }, [ctxSelectedSoundChipIds, ctxSetSoundHighlightEnabled, ctxSoundHighlightEnabled]);

  useEffect(() => {
    if (ctxSelectedLetterChipIds.length === 0 && ctxLetterHighlightEnabled) {
      ctxSetLetterHighlightEnabled(false);
    }
  }, [ctxSelectedLetterChipIds, ctxSetLetterHighlightEnabled, ctxLetterHighlightEnabled]);

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
    if (ctxSelectedSoundChipIds.length === 0) {
      return;
    }

    const next = !ctxSoundHighlightEnabled;
    ctxSetSoundHighlightEnabled(next);
    if (next) {
      ctxSetLetterHighlightEnabled(false);
    }
  };

  const toggleLetterHighlight = () => {
    if (ctxSelectedLetterChipIds.length === 0) {
      return;
    }

    const next = !ctxLetterHighlightEnabled;
    ctxSetLetterHighlightEnabled(next);
    if (next) {
      ctxSetSoundHighlightEnabled(false);
    }
  };

  const soundTooltip =
    "Different Hebrew letters can produce similar sounds. This tool helps you detect sound patterns and rhymes based on how words are heard, not how they are written. The highlighted Hebrew sound patterns are only visible in the English transliteration and Hebrew text, not in the default English display.";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        <div className="mx-4 border-b border-stroke dark:border-strokedark">
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
              className="relative ml-1 inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500"
              onClick={(e) => { e.stopPropagation(); setShowTooltip((v) => !v); }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              title={soundTooltip}
            >
              i
              {showTooltip && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-lg dark:border-strokedark dark:bg-boxdark dark:text-bodydark">
                  {soundTooltip}
                </div>
              )}
            </span>
          </button>

          {openSection === "sound-distribution" && (
            <div className="space-y-4 p-4">
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
                    isHighlighted={ctxSoundHighlightEnabled && ctxSelectedSoundChipIds.includes(chip.id)}
                    onClick={() => toggleSoundChip(chip.id)}
                  />
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <SoundsHighlightButton
                  active={ctxSoundHighlightEnabled}
                  disabled={ctxSelectedSoundChipIds.length === 0}
                  onClick={toggleSoundHighlight}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            className="ClickBlock flex w-full items-center gap-2 px-2 py-4 text-left text-sm font-medium md:text-base"
            onClick={() => toggleSection("letter-distribution")}
          >
            <AccordionToggleIcon isOpen={openSection === "letter-distribution"} />
            <span className={openSection === "letter-distribution" ? "text-primary" : "text-black dark:text-white"}>
              Hebrew Letters Distribution
            </span>
          </button>

          {openSection === "letter-distribution" && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-4 gap-1">
                {LETTER_CHIP_GROUPS.map((group) => {
                  const groupCount = group.memberIds.reduce(
                    (sum, id) => sum + (letterCounts.get(id) || 0),
                    0,
                  );
                  const isSelected = group.memberIds.every((id) =>
                    ctxSelectedLetterChipIds.includes(id),
                  );
                  const isHighlighted = ctxLetterHighlightEnabled && isSelected;

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
                  active={ctxLetterHighlightEnabled}
                  disabled={ctxSelectedLetterChipIds.length === 0}
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
