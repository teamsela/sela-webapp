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
import { flattenPassageWords } from "@/lib/passage";

type SoundsSectionId = "sound-distribution" | "letter-distribution";

type ChipPalette = {
  fill?: string;
  border?: string;
  text?: string;
};

// A single displayed chip. `memberIds` are the underlying chip ids the chip
// selects/highlights together (one id for sounds, possibly several for grouped
// letters such as כ ך). This uniform shape lets Sound and Letter share one code
// path for selection, highlighting and counting.
type DisplayChip = {
  key: string;
  label: string;
  palette: ChipPalette;
  memberIds: string[];
  count: number;
};

const DistributionChip = ({
  label,
  count,
  fill,
  border,
  text,
  isSelected,
  isHighlighted,
  memberIds,
  onClick,
}: {
  label: string;
  count: number;
  fill?: string;
  border?: string;
  text?: string;
  isSelected: boolean;
  isHighlighted: boolean;
  memberIds: string[];
  onClick: () => void;
}) => {
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
        data-testid="distribution-chip"
        data-member-ids={memberIds.join(",")}
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

// Tooltip modal shared by both distributions — identical markup, different copy.
const DistributionInfoModal = ({
  titleId,
  title,
  body,
  note,
  onClose,
}: {
  titleId: string;
  title: string;
  body: string;
  note: string;
  onClose: () => void;
}) =>
  createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <IconX size={18} stroke={2} />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <IconInfoCircle size={22} stroke={2.2} />
          <h3 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <p>{body}</p>
          <p className="text-xs italic text-gray-500 dark:text-gray-400">
            <span className="font-semibold not-italic">Note:</span> {note}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );

// Close the tooltip on Escape while it is open. Shared by both sections.
const useEscapeToClose = (isOpen: boolean, close: () => void) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);
};

// Deselect a section's chips when the user clicks outside it. Uses "click" (not
// "mousedown") to avoid racing with useDragToSelect's mousedown→mouseup
// word-deselect mechanism in the passage. Shared by both sections.
const useClickOutsideToDeselect = (
  active: boolean,
  sectionRef: React.RefObject<HTMLElement>,
  suppressed: boolean,
  clear: () => void,
) => {
  useEffect(() => {
    if (!active) return;
    const handleClick = (e: MouseEvent) => {
      if (suppressed) return;
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        clear();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [active, sectionRef, suppressed, clear]);
};

// Per-id occurrence counts for a chip set (unifies the mirror count memos).
const useOccurrenceCounts = <W,>(
  words: W[],
  ids: string[],
  counter: (word: W, id: string) => number,
) =>
  useMemo(() => {
    const counts = new Map<string, number>();
    ids.forEach((id) => counts.set(id, 0));
    words.forEach((word) => {
      ids.forEach((id) => {
        counts.set(id, (counts.get(id) || 0) + counter(word, id));
      });
    });
    return counts;
    // Recompute only when the passage words change (ids/counter are stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

// Everything that distinguishes the Sound section from the Letter section.
type DistributionConfig = {
  sectionId: SoundsSectionId;
  title: string;
  infoAriaLabel: string;
  modalTitleId: string;
  tooltipBody: string;
  tooltipNote: string;
  chips: DisplayChip[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  highlightedIds: string[];
  enabled: boolean;
  onToggleChip: (memberIds: string[]) => void;
  onToggleHighlight: () => void;
};

// One implementation rendering either distribution from its config. Owns its own
// tooltip open-state plus the Escape / click-outside effects so both sections
// behave identically.
const DistributionSection = ({
  config,
  isOpen,
  isMounted,
  onToggleSection,
}: {
  config: DistributionConfig;
  isOpen: boolean;
  isMounted: boolean;
  onToggleSection: (sectionId: SoundsSectionId) => void;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const closeTooltip = React.useCallback(() => setShowTooltip(false), []);
  const clearSelection = React.useCallback(
    () => config.setSelectedIds([]),
    [config],
  );

  useEscapeToClose(showTooltip, closeTooltip);
  useClickOutsideToDeselect(
    config.selectedIds.length > 0,
    sectionRef,
    showTooltip,
    clearSelection,
  );

  const highlightActive = config.enabled && config.selectedIds.length === 0;

  return (
    <div ref={sectionRef} className="ClickBlock mx-4 border-b border-stroke dark:border-strokedark">
      <button
        type="button"
        className="ClickBlock flex w-full items-center gap-2 px-2 py-4 text-left text-sm font-medium md:text-base"
        onClick={() => onToggleSection(config.sectionId)}
      >
        <AccordionToggleIcon isOpen={isOpen} />
        <span className={isOpen ? "text-primary" : "text-black dark:text-white"}>{config.title}</span>
        <span
          className="relative ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          onClick={(e) => {
            e.stopPropagation();
            setShowTooltip(true);
          }}
          role="button"
          aria-label={config.infoAriaLabel}
        >
          i
        </span>
      </button>

      {isMounted && showTooltip && (
        <DistributionInfoModal
          titleId={config.modalTitleId}
          title={config.title}
          body={config.tooltipBody}
          note={config.tooltipNote}
          onClose={closeTooltip}
        />
      )}

      {isOpen && (
        <div
          className="space-y-4 p-4"
          onClick={(e) => {
            // Deselect chips when clicking blank space (not on a button).
            if (!(e.target as HTMLElement).closest("button")) {
              config.setSelectedIds([]);
            }
          }}
        >
          <div className="grid grid-cols-4 gap-1">
            {config.chips.map((chip) => {
              const isSelected = chip.memberIds.every((id) => config.selectedIds.includes(id));
              const isHighlighted =
                config.enabled && chip.memberIds.every((id) => config.highlightedIds.includes(id));
              return (
                <DistributionChip
                  key={chip.key}
                  label={chip.label}
                  count={chip.count}
                  fill={chip.palette.fill}
                  border={chip.palette.border}
                  text={chip.palette.text}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  memberIds={chip.memberIds}
                  onClick={() => config.onToggleChip(chip.memberIds)}
                />
              );
            })}
          </div>
          <div className="flex justify-center pt-2">
            <SoundsHighlightButton active={highlightActive} disabled={false} onClick={config.onToggleHighlight} />
          </div>
        </div>
      )}
    </div>
  );
};

const SOUND_TOOLTIP_BODY =
  "Some Hebrew letters can produce similar sounds. For example, the letters \u05DB and \u05E7 can both produce the \u201ck\u201d sound. Hebrew poetry can create patterns between words that sound similar even if they are spelled differently, such as \u05E7\u05D5\u05B9\u05DC (Kol) and \u05DB\u05BC\u05B9\u05DC (Kol) in Psalm 29:9. This tool helps you detect sound patterns and sound echoes throughout a passage based on how words are heard, not how they are written.";
const SOUND_TOOLTIP_NOTE =
  "Highlights from this tool are only visible in the Hebrew text and English transliteration, not in the default English display.";
const LETTER_TOOLTIP_BODY =
  "Some Hebrew letters can produce different sounds. For example, the letter \u05D1 can produce a \u201cb\u201d or \u201cv\u201d sound. Hebrew poetry can also create patterns between words that are spelled similarly, even when they do not sound similar when read aloud, such as \u05E7\u05B6\u05D1\u05B6\u05E8 (Qever) and \u05D1\u05BC\u05B9\u05E7\u05B6\u05E8 (Boqer) in Psalm 88:12,14. This tool helps you detect visual literary patterns and letter echoes throughout a passage based on how words are written, not how they are heard.";
const LETTER_TOOLTIP_NOTE =
  "Highlights from this tool are only visible in the Hebrew text, not in the default English gloss or transliteration display.";

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
    ctxSetHighlightRestrictWordIds,
  } = useContext(FormatContext);
  const [openSection, setOpenSection] = useState<SoundsSectionId | null>("sound-distribution");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSection = (sectionId: SoundsSectionId) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const allWords = useMemo(
    () => flattenPassageWords(ctxPassageProps),
    [ctxPassageProps],
  );

  // Per-id occurrence counts for both distributions (mirror memos unified).
  const soundCounts = useOccurrenceCounts(
    allWords,
    SOUND_CHIPS.map((c) => c.id),
    countSoundOccurrences,
  );
  const letterCounts = useOccurrenceCounts(
    allWords,
    LETTER_CHIPS.map((c) => c.id),
    countLetterOccurrences,
  );

  const soundChips: DisplayChip[] = useMemo(
    () =>
      SOUND_CHIPS.map((chip) => ({
        key: chip.id,
        label: chip.label,
        palette: chip.palette,
        memberIds: [chip.id],
        count: soundCounts.get(chip.id) || 0,
      })),
    [soundCounts],
  );

  const letterChips: DisplayChip[] = useMemo(
    () =>
      LETTER_CHIP_GROUPS.map((group) => ({
        key: group.id,
        label: group.label,
        palette: group.palette,
        memberIds: group.memberIds,
        count: group.memberIds.reduce((sum, id) => sum + (letterCounts.get(id) || 0), 0),
      })),
    [letterCounts],
  );

  // Generic chip toggle: select/deselect all member ids as a unit.
  const makeToggleChip =
    (selectedIds: string[], setSelectedIds: (ids: string[]) => void) => (memberIds: string[]) => {
      const allSelected = memberIds.every((id) => selectedIds.includes(id));
      setSelectedIds(
        allSelected
          ? selectedIds.filter((id) => !memberIds.includes(id))
          : [...selectedIds.filter((id) => !memberIds.includes(id)), ...memberIds],
      );
    };

  // Generic Smart/Clear Highlight handler shared by both distributions. `self`
  // is the distribution being toggled; `other` is cleared so only one is active.
  const makeToggleHighlight = (
    self: {
      selected: string[];
      setSelected: (ids: string[]) => void;
      highlighted: string[];
      setHighlighted: (ids: string[]) => void;
      enabled: boolean;
      setEnabled: (v: boolean) => void;
      allMemberIds: string[];
    },
    other: {
      setSelected: (ids: string[]) => void;
      setHighlighted: (ids: string[]) => void;
      setEnabled: (v: boolean) => void;
    },
  ) => () => {
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    // Distribution highlights apply passage-wide, so drop any Wordplay pair
    // restriction that may still be active.
    ctxSetHighlightRestrictWordIds([]);
    if (self.selected.length > 0) {
      self.setHighlighted([...new Set([...self.highlighted, ...self.selected])]);
      self.setEnabled(true);
      self.setSelected([]);
      other.setSelected([]);
      other.setHighlighted([]);
      other.setEnabled(false);
    } else if (self.enabled) {
      self.setHighlighted([]);
      self.setEnabled(false);
    } else {
      // Nothing selected and nothing highlighted — highlight all chips.
      self.setHighlighted(self.allMemberIds);
      self.setEnabled(true);
      other.setHighlighted([]);
      other.setEnabled(false);
    }
  };

  const soundConfig: DistributionConfig = {
    sectionId: "sound-distribution",
    title: "Hebrew Sound Distribution",
    infoAriaLabel: "About sound distribution",
    modalTitleId: "sound-dist-modal-title",
    tooltipBody: SOUND_TOOLTIP_BODY,
    tooltipNote: SOUND_TOOLTIP_NOTE,
    chips: soundChips,
    selectedIds: ctxSelectedSoundChipIds,
    setSelectedIds: ctxSetSelectedSoundChipIds,
    highlightedIds: ctxHighlightedSoundChipIds,
    enabled: ctxSoundHighlightEnabled,
    onToggleChip: makeToggleChip(ctxSelectedSoundChipIds, ctxSetSelectedSoundChipIds),
    onToggleHighlight: makeToggleHighlight(
      {
        selected: ctxSelectedSoundChipIds,
        setSelected: ctxSetSelectedSoundChipIds,
        highlighted: ctxHighlightedSoundChipIds,
        setHighlighted: ctxSetHighlightedSoundChipIds,
        enabled: ctxSoundHighlightEnabled,
        setEnabled: ctxSetSoundHighlightEnabled,
        allMemberIds: soundChips.flatMap((c) => c.memberIds),
      },
      {
        setSelected: ctxSetSelectedLetterChipIds,
        setHighlighted: ctxSetHighlightedLetterChipIds,
        setEnabled: ctxSetLetterHighlightEnabled,
      },
    ),
  };

  const letterConfig: DistributionConfig = {
    sectionId: "letter-distribution",
    title: "Hebrew Letters Distribution",
    infoAriaLabel: "About letter distribution",
    modalTitleId: "letter-dist-modal-title",
    tooltipBody: LETTER_TOOLTIP_BODY,
    tooltipNote: LETTER_TOOLTIP_NOTE,
    chips: letterChips,
    selectedIds: ctxSelectedLetterChipIds,
    setSelectedIds: ctxSetSelectedLetterChipIds,
    highlightedIds: ctxHighlightedLetterChipIds,
    enabled: ctxLetterHighlightEnabled,
    onToggleChip: makeToggleChip(ctxSelectedLetterChipIds, ctxSetSelectedLetterChipIds),
    onToggleHighlight: makeToggleHighlight(
      {
        selected: ctxSelectedLetterChipIds,
        setSelected: ctxSetSelectedLetterChipIds,
        highlighted: ctxHighlightedLetterChipIds,
        setHighlighted: ctxSetHighlightedLetterChipIds,
        enabled: ctxLetterHighlightEnabled,
        setEnabled: ctxSetLetterHighlightEnabled,
        allMemberIds: letterChips.flatMap((c) => c.memberIds),
      },
      {
        setSelected: ctxSetSelectedSoundChipIds,
        setHighlighted: ctxSetHighlightedSoundChipIds,
        setEnabled: ctxSetSoundHighlightEnabled,
      },
    ),
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        <DistributionSection
          config={soundConfig}
          isOpen={openSection === "sound-distribution"}
          isMounted={isMounted}
          onToggleSection={toggleSection}
        />
        <DistributionSection
          config={letterConfig}
          isOpen={openSection === "letter-distribution"}
          isMounted={isMounted}
          onToggleSection={toggleSection}
        />

        <div className="px-8 py-5 text-sm leading-6 text-slate-600">
          Individual-letter highlights stay in the browser for now and are not saved to the database. You can still use the main formatting tools on words and strophes, but these sound and letter views act like browsing filters.
        </div>
      </div>
    </div>
  );
};

export default Sounds;
