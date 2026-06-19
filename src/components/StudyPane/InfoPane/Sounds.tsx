"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// All accordion sections rendered in the Sounds tab. "read-aloud" and
// "wordplays" power the text-to-speech tools; "sound-distribution" and
// "letter-distribution" power the Hebrew sound/letter highlight tools.
type SoundsSectionId =
  | "read-aloud"
  | "wordplays"
  | "sound-distribution"
  | "letter-distribution";

type ReadAloudButtonState = "ready" | "disabled" | "playing";

const sectionButtonClassName =
  "ClickBlock flex w-full items-center gap-2 px-2 py-4 text-left text-sm font-medium md:text-base";

const sectionLabelClassName = (isOpen: boolean) =>
  isOpen ? "text-primary" : "text-black dark:text-white";

type SpeedPopoverPosition = {
  top: number;
  left: number;
};

type SpeechWord = {
  wordId: number;
  text: string;
};

type SpeechChunk = {
  wordIds: number[];
  words: SpeechWord[];
  text: string;
};

type AzureWordBoundary = {
  audioOffsetMs: number;
  text: string;
  textOffset: number;
  wordLength: number;
};

type AzureChunkAudio = {
  blob: Blob;
  wordBoundaries: AzureWordBoundary[];
};

type TtsEngine = "azure" | "browser";

// Per-tab LRU cache of synthesized Azure audio. Synthesis for a given
// (rate, text) is deterministic, so re-reading a line, replaying after a
// stop, or toggling speed back and forth can play straight from memory with
// no network round trip. Lives at module scope so it survives across
// playbacks (but resets on full page reload). Bounded by entries and bytes.
const AZURE_AUDIO_CACHE_MAX_ENTRIES = 256;
const AZURE_AUDIO_CACHE_MAX_BYTES = 48 * 1024 * 1024; // 48 MB

const azureAudioCache = new Map<string, AzureChunkAudio>();
let azureAudioCacheBytes = 0;

const azureCacheKey = (rate: number, text: string) => `${rate}|${text}`;

const getCachedAzureAudio = (key: string): AzureChunkAudio | undefined => {
  const cached = azureAudioCache.get(key);
  if (!cached) {
    return undefined;
  }
  // Mark most-recently-used by reinserting at the tail.
  azureAudioCache.delete(key);
  azureAudioCache.set(key, cached);
  return cached;
};

const setCachedAzureAudio = (key: string, audio: AzureChunkAudio) => {
  if (audio.blob.size > AZURE_AUDIO_CACHE_MAX_BYTES) {
    return; // Never cache a single entry larger than the whole budget.
  }

  const existing = azureAudioCache.get(key);
  if (existing) {
    azureAudioCacheBytes -= existing.blob.size;
    azureAudioCache.delete(key);
  }

  azureAudioCache.set(key, audio);
  azureAudioCacheBytes += audio.blob.size;

  while (
    azureAudioCache.size > AZURE_AUDIO_CACHE_MAX_ENTRIES ||
    azureAudioCacheBytes > AZURE_AUDIO_CACHE_MAX_BYTES
  ) {
    const oldestKey = azureAudioCache.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    const oldest = azureAudioCache.get(oldestKey);
    if (oldest) {
      azureAudioCacheBytes -= oldest.blob.size;
    }
    azureAudioCache.delete(oldestKey);
  }
};

const TTS_ADONAI_TEXT = "אֲ֝דֹנָ֗י";
const DIVINE_NAME_GLOSS_EDGE_REGEX =
  /^[\s"'()[\]{},.;:!?‘’“”]+|[\s"'()[\]{},.;:!?‘’“”]+$/g;
const DIVINE_NAME_GLOSS_REGEX = /^(?:yahweh|yhwh)(?:['’]s)?$/i;
const LATIN_DIVINE_NAME_TEXT_REGEX = /\b(?:yahweh|yhwh)(?:['’]s)?\b/gi;
const HEBREW_DIVINE_NAME_TEXT_REGEX =
  /י[֑-ׇ]*ה[֑-ׇ]*ו[֑-ׇ]*ה[֑-ׇ]*/g;

const isDivineNameGloss = (gloss: string | undefined) => {
  const normalizedGloss = gloss?.trim().replace(DIVINE_NAME_GLOSS_EDGE_REGEX, "");
  return Boolean(normalizedGloss && DIVINE_NAME_GLOSS_REGEX.test(normalizedGloss));
};

const normalizeDivineNameForTts = (text: string) =>
  text
    .normalize("NFKC")
    .replace(HEBREW_DIVINE_NAME_TEXT_REGEX, TTS_ADONAI_TEXT)
    .replace(LATIN_DIVINE_NAME_TEXT_REGEX, TTS_ADONAI_TEXT);

const getTtsWordText = (word: { gloss?: string; wlcWord: string }) => {
  if (isDivineNameGloss(word.gloss)) {
    return TTS_ADONAI_TEXT;
  }

  return normalizeDivineNameForTts(word.wlcWord.trim());
};

const ReadAloudButtonIcon = ({ state }: { state: ReadAloudButtonState }) => {
  if (state === "playing") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 192 192"
        className="h-[3.67rem] w-[3.67rem] sm:h-16 sm:w-16"
      >
        <circle cx="96" cy="96" r="96" fill="#F9C62B" />
        <circle cx="96" cy="96" r="58" fill="#FFFFFF" />
        <circle
          cx="96"
          cy="96"
          r="70"
          fill="none"
          stroke="#5E5E5E"
          strokeWidth="22"
        />
        <rect x="68" y="68" width="56" height="56" fill="#5E5E5E" />
      </svg>
    );
  }

  const outerFill = state === "ready" ? "#F9C62B" : "#D9D9D9";
  const ringStroke = state === "ready" ? "#5E5E5E" : "#BCBCBC";
  const iconFill = state === "ready" ? "#5E5E5E" : "#BCBCBC";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 192 192"
      className="h-[3.67rem] w-[3.67rem] sm:h-16 sm:w-16"
    >
      <circle cx="96" cy="96" r="96" fill={outerFill} />
      <circle cx="96" cy="96" r="58" fill="#FFFFFF" />
      <circle
        cx="96"
        cy="96"
        r="70"
        fill="none"
        stroke={ringStroke}
        strokeWidth="22"
      />
      <path
        d="M73 61.5C73 57.6129 77.2944 55.2465 80.5923 57.3254L127.258 86.8254C130.318 88.7592 130.318 93.2408 127.258 95.1746L80.5923 124.675C77.2944 126.753 73 124.387 73 120.5V61.5Z"
        fill={iconFill}
      />
    </svg>
  );
};

const ReadAloudButton = ({
  state,
  disabled,
  onClick,
}: {
  state: ReadAloudButtonState;
  disabled: boolean;
  onClick: () => void;
}) => {
  const label =
    state === "disabled"
      ? "Read aloud unavailable"
      : state === "playing"
        ? "Stop read aloud"
        : "Start read aloud";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center transition disabled:cursor-not-allowed"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <ReadAloudButtonIcon state={state} />
    </button>
  );
};

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
  onClick,
}: {
  label: string;
  count: number;
  fill?: string;
  border?: string;
  text?: string;
  isSelected: boolean;
  isHighlighted: boolean;
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
  "Some Hebrew letters can produce similar sounds. For example, the letters כ and ק can both produce the “k” sound. Hebrew poetry can create patterns between words that sound similar even if they are spelled differently, such as קוֹל (Kol) and כֹּל (Kol) in Psalm 29:9. This tool helps you detect sound patterns and sound echoes throughout a passage based on how words are heard, not how they are written.";
const SOUND_TOOLTIP_NOTE =
  "Highlights from this tool are only visible in the Hebrew text and English transliteration, not in the default English display.";
const LETTER_TOOLTIP_BODY =
  "Some Hebrew letters can produce different sounds. For example, the letter ב can produce a “b” or “v” sound. Hebrew poetry can also create patterns between words that are spelled similarly, even when they do not sound similar when read aloud, such as קֶבֶר (Qever) and בֹּקֶר (Boqer) in Psalm 88:12,14. This tool helps you detect visual literary patterns and letter echoes throughout a passage based on how words are written, not how they are heard.";
const LETTER_TOOLTIP_NOTE =
  "Highlights from this tool are only visible in the Hebrew text, not in the default English gloss or transliteration display.";

const Sounds = () => {
  const {
    ctxSelectedWords,
    ctxSelectedStrophes,
    ctxSetCurrentSpokenWordIds,
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
  const [openSection, setOpenSection] = useState<SoundsSectionId | null>(
    "read-aloud",
  );

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.7);
  const [isSpeedSelectorOpen, setIsSpeedSelectorOpen] = useState(false);
  const [speedPopoverPosition, setSpeedPopoverPosition] =
    useState<SpeedPopoverPosition | null>(null);
  const [isSpeechSynthesisAvailable, setIsSpeechSynthesisAvailable] =
    useState(false);
  const [isAzureTtsAvailable, setIsAzureTtsAvailable] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(
    [],
  );
  const [ttsError, setTtsError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const highlightFrameRef = useRef<number | null>(null);
  const speechChunksRef = useRef<SpeechChunk[]>([]);
  const currentWordIndexRef = useRef(0);
  const currentChunkIndexRef = useRef(0);
  const playbackSessionRef = useRef(0);
  const speedSelectorRef = useRef<HTMLDivElement | null>(null);
  const speedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const playbackEngineRef = useRef<TtsEngine | null>(null);

  const hasReadAloudSelection =
    ctxSelectedWords.length > 0 || ctxSelectedStrophes.length > 0;

  const selectedSpeechChunks = useMemo<SpeechChunk[]>(() => {
    if (ctxSelectedStrophes.length > 0) {
      return [...ctxSelectedStrophes]
        .sort((a, b) => a.stropheId - b.stropheId)
        .flatMap((strophe) =>
          [...strophe.lines]
            .sort((a, b) => a.lineId - b.lineId)
            .map((line) => {
              const words = [...line.words]
                .sort((a, b) => a.wordId - b.wordId)
                .map((word) => ({
                  wordId: word.wordId,
                  text: getTtsWordText(word),
                }))
                .filter((word) => word.text);
              return {
                wordIds: words.map((word) => word.wordId),
                words,
                text: words.map((word) => word.text).join(" "),
              };
            }),
        )
        .filter((chunk) => chunk.text);
    }

    const wordsByLine = new Map<string, SpeechChunk>();

    [...ctxSelectedWords]
      .sort((a, b) => a.wordId - b.wordId)
      .forEach((word) => {
        const text = getTtsWordText(word);
        if (!text) {
          return;
        }

        const speechWord = { wordId: word.wordId, text };
        const lineKey = `${word.stropheId}:${word.lineId}`;
        const existingChunk = wordsByLine.get(lineKey);
        if (existingChunk) {
          existingChunk.wordIds.push(word.wordId);
          existingChunk.words.push(speechWord);
          existingChunk.text = `${existingChunk.text} ${text}`.trim();
          return;
        }

        wordsByLine.set(lineKey, {
          wordIds: [word.wordId],
          words: [speechWord],
          text,
        });
      });

    return Array.from(wordsByLine.values()).filter((chunk) => chunk.text);
  }, [ctxSelectedStrophes, ctxSelectedWords]);

  const isReadAloudAvailable = isAzureTtsAvailable || isSpeechSynthesisAvailable;

  const readAloudState: ReadAloudButtonState = isPlaying
    ? "playing"
    : hasReadAloudSelection && isReadAloudAvailable
      ? "ready"
      : "disabled";

  const toggleSection = (section: SoundsSectionId) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const teardownCurrentAudio = useCallback(() => {
    if (typeof window !== "undefined" && highlightFrameRef.current !== null) {
      window.cancelAnimationFrame(highlightFrameRef.current);
      highlightFrameRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.onloadedmetadata = null;
      audioRef.current.ondurationchange = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const cleanupAudioPlayback = useCallback(() => {
    fetchAbortControllerRef.current?.abort();
    fetchAbortControllerRef.current = null;
    teardownCurrentAudio();
  }, [teardownCurrentAudio]);

  const startAzureHighlight = useCallback((
    audio: HTMLAudioElement,
    words: SpeechWord[],
    wordBoundaries: AzureWordBoundary[],
    playbackSession: number,
  ) => {
    if (!words.length) {
      ctxSetCurrentSpokenWordIds([]);
      return;
    }

    const timedWords = words.map((word, index) => ({
      audioOffsetMs:
        wordBoundaries[index]?.audioOffsetMs ??
        ((audio.duration * 1000) / Math.max(words.length, 1)) * index,
      wordId: word.wordId,
    }));

    currentWordIndexRef.current = 0;
    ctxSetCurrentSpokenWordIds([timedWords[0].wordId]);

    const tick = () => {
      if (playbackSessionRef.current !== playbackSession || audioRef.current !== audio) {
        return;
      }

      const currentTimeMs = audio.currentTime * 1000;
      let nextWordIndex = currentWordIndexRef.current;
      while (
        nextWordIndex + 1 < timedWords.length &&
        currentTimeMs >= timedWords[nextWordIndex + 1].audioOffsetMs
      ) {
        nextWordIndex += 1;
      }

      if (nextWordIndex !== currentWordIndexRef.current) {
        currentWordIndexRef.current = nextWordIndex;
        ctxSetCurrentSpokenWordIds([timedWords[nextWordIndex].wordId]);
      }

      if (!audio.paused && !audio.ended) {
        highlightFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    if (typeof window !== "undefined") {
      highlightFrameRef.current = window.requestAnimationFrame(tick);
    }
  }, [ctxSetCurrentSpokenWordIds]);

  const stopPlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cleanupAudioPlayback();
    utteranceRef.current = null;
    playbackEngineRef.current = null;
    ctxSetCurrentSpokenWordIds([]);
    currentChunkIndexRef.current = 0;
    setIsPlaying(false);
  }, [cleanupAudioPlayback, ctxSetCurrentSpokenWordIds]);

  const speakChunk = useCallback((
    chunkIndex: number,
    chunks: SpeechChunk[],
    rate: number,
    speechSynthesis: SpeechSynthesis,
    playbackSession: number,
  ) => {
    if (playbackSessionRef.current !== playbackSession) {
      return;
    }

    if (chunkIndex >= chunks.length) {
      utteranceRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentChunkIndexRef.current = 0;
      setIsPlaying(false);
      return;
    }

    currentChunkIndexRef.current = chunkIndex;
    ctxSetCurrentSpokenWordIds(chunks[chunkIndex].wordIds);

    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex].text);
    utterance.lang = "he-IL";
    utterance.rate = rate;
    const preferredVoice =
      availableVoices.find((voice) => voice.lang === "he-IL") ||
      availableVoices.find((voice) => voice.lang.toLowerCase().startsWith("he"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (playbackSessionRef.current !== playbackSession) {
        return;
      }
      utteranceRef.current = null;
      speakChunk(chunkIndex + 1, chunks, rate, speechSynthesis, playbackSession);
    };
    utterance.onerror = () => {
      if (playbackSessionRef.current !== playbackSession) {
        return;
      }
      utteranceRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentChunkIndexRef.current = 0;
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [availableVoices, ctxSetCurrentSpokenWordIds]);

  const handleReadAloudClick = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (
      !isReadAloudAvailable ||
      selectedSpeechChunks.length === 0
    ) {
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cleanupAudioPlayback();
    ctxSetCurrentSpokenWordIds([]);
    setTtsError(null);
    const chunks = selectedSpeechChunks;

    speechChunksRef.current = chunks;
    currentChunkIndexRef.current = 0;
    currentWordIndexRef.current = 0;
    playbackSessionRef.current += 1;
    const playbackSession = playbackSessionRef.current;
    setIsPlaying(true);
    playbackEngineRef.current = isAzureTtsAvailable ? "azure" : "browser";

    if (isAzureTtsAvailable) {
      void playAzurePipeline(chunks, speechRate, 0, playbackSession);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsPlaying(false);
      return;
    }

    speakChunk(0, chunks, speechRate, window.speechSynthesis, playbackSession);
  };

  // Look-ahead window: how many upcoming chunks to synthesize in the
  // background while the current one plays. 1 is enough to hide latency
  // because the next chunk is ready by the time the current one ends.
  const AZURE_PREFETCH_AHEAD = 1;

  const playAzurePipeline = useCallback((
    chunks: SpeechChunk[],
    rate: number,
    startIndex: number,
    playbackSession: number,
  ) => {
    const isStale = () => playbackSessionRef.current !== playbackSession;

    const finishPlayback = (errorMessage: string | null) => {
      if (isStale()) {
        return;
      }
      cleanupAudioPlayback();
      playbackEngineRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentWordIndexRef.current = 0;
      currentChunkIndexRef.current = 0;
      setTtsError(errorMessage);
      setIsPlaying(false);
    };

    if (isStale()) {
      return;
    }

    if (!chunks.length) {
      finishPlayback(null);
      return;
    }

    const controller = new AbortController();
    fetchAbortControllerRef.current = controller;

    // Each chunk is synthesized at most once; the promise is cached so the
    // look-ahead prefetch and the playback step share the same request.
    const audioCache = new Map<number, Promise<AzureChunkAudio>>();

    const fetchChunk = async (index: number): Promise<AzureChunkAudio> => {
      const key = azureCacheKey(rate, chunks[index].text);
      const cached = getCachedAzureAudio(key);
      if (cached) {
        return cached;
      }

      const response = await fetch("/api/tts/azure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: chunks[index].text,
          speakingRate: rate,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = "Azure Speech could not synthesize this selection.";
        try {
          const errorPayload = (await response.json()) as { error?: string };
          if (errorPayload.error) {
            errorMessage = errorPayload.error;
          }
        } catch {
          // Ignore parse failures and keep the fallback message.
        }
        throw new Error(errorMessage);
      }

      // The route returns raw audio/mpeg bytes; word-boundary timings come in
      // a base64-encoded header rather than the body.
      const blob = await response.blob();
      if (!blob.size) {
        throw new Error("Azure Speech returned no audio content.");
      }

      let wordBoundaries: AzureWordBoundary[] = [];
      const boundariesHeader = response.headers.get("X-Word-Boundaries");
      if (boundariesHeader) {
        try {
          const decoded = new TextDecoder().decode(
            Uint8Array.from(atob(boundariesHeader), (char) => char.charCodeAt(0)),
          );
          wordBoundaries = JSON.parse(decoded) as AzureWordBoundary[];
        } catch {
          // Missing/garbled timings just fall back to even word spacing.
        }
      }

      const result = { blob, wordBoundaries };
      setCachedAzureAudio(key, result);
      return result;
    };

    const ensureFetch = (index: number) => {
      if (index < 0 || index >= chunks.length || audioCache.has(index)) {
        return;
      }
      audioCache.set(index, fetchChunk(index));
    };

    const playFrom = async (index: number) => {
      if (isStale()) {
        return;
      }

      if (index >= chunks.length) {
        finishPlayback(null);
        return;
      }

      // Kick off this chunk plus the look-ahead window before awaiting, so
      // upcoming chunks synthesize while the current one downloads/plays.
      ensureFetch(index);
      for (let ahead = 1; ahead <= AZURE_PREFETCH_AHEAD; ahead += 1) {
        ensureFetch(index + ahead);
      }

      let chunkAudio: AzureChunkAudio;
      try {
        chunkAudio = await audioCache.get(index)!;
      } catch (error) {
        if (controller.signal.aborted || isStale()) {
          return;
        }
        finishPlayback(
          error instanceof Error
            ? error.message
            : "Azure Speech playback failed unexpectedly.",
        );
        return;
      }

      if (isStale()) {
        return;
      }

      currentChunkIndexRef.current = index;

      // Tear down the previous chunk's audio without aborting the shared
      // fetch controller (that would cancel the prefetched chunks).
      teardownCurrentAudio();
      const audioUrl = URL.createObjectURL(chunkAudio.blob);
      const audio = new Audio(audioUrl);
      audioUrlRef.current = audioUrl;
      audioRef.current = audio;

      let highlightStarted = false;
      const initializeHighlight = () => {
        if (highlightStarted) {
          return;
        }
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          return;
        }
        highlightStarted = true;
        startAzureHighlight(
          audio,
          chunks[index].words,
          chunkAudio.wordBoundaries,
          playbackSession,
        );
      };

      audio.onloadedmetadata = initializeHighlight;
      audio.ondurationchange = initializeHighlight;

      const advance = () => {
        audio.onended = null;
        audio.onerror = null;
        void playFrom(index + 1);
      };

      audio.onended = () => {
        if (isStale()) {
          return;
        }
        advance();
      };

      audio.onerror = () => {
        if (isStale()) {
          return;
        }

        const finishedNaturally =
          audio.ended ||
          (Number.isFinite(audio.duration) &&
            audio.duration > 0 &&
            audio.currentTime >= audio.duration - 0.05);

        if (finishedNaturally) {
          advance();
          return;
        }

        finishPlayback("Azure Speech playback failed.");
      };

      try {
        await audio.play();
      } catch {
        // A rejected play() during teardown/session change is benign; bail
        // unless we are still the active session (then surface as an error).
        if (isStale()) {
          return;
        }
      }
      initializeHighlight();
    };

    currentWordIndexRef.current = 0;
    void playFrom(startIndex);
  }, [
    cleanupAudioPlayback,
    ctxSetCurrentSpokenWordIds,
    startAzureHighlight,
    teardownCurrentAudio,
  ]);

  useEffect(() => {
    if (!hasReadAloudSelection && isPlaying) {
      stopPlayback();
    }
  }, [hasReadAloudSelection, isPlaying, stopPlayback]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const chunks = speechChunksRef.current;
    if (!chunks.length) {
      return;
    }
    const restartIndex = currentChunkIndexRef.current;
    playbackSessionRef.current += 1;
    const playbackSession = playbackSessionRef.current;
    setTtsError(null);

    if (playbackEngineRef.current === "azure") {
      cleanupAudioPlayback();
      currentWordIndexRef.current = 0;
      void playAzurePipeline(chunks, speechRate, restartIndex, playbackSession);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    speakChunk(
      restartIndex,
      chunks,
      speechRate,
      window.speechSynthesis,
      playbackSession,
    );
  }, [
    cleanupAudioPlayback,
    isPlaying,
    playAzurePipeline,
    speakChunk,
    speechRate,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadAzureAvailability = async () => {
      try {
        const response = await fetch("/api/tts/azure", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Azure availability check failed.");
        }

        const data = (await response.json()) as { configured?: boolean };
        if (isMounted) {
          setIsAzureTtsAvailable(Boolean(data.configured));
        }
      } catch {
        if (isMounted) {
          setIsAzureTtsAvailable(false);
        }
      }
    };

    void loadAzureAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeechSynthesisAvailable(false);
      setAvailableVoices([]);
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    const updateVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      setIsSpeechSynthesisAvailable(true);
    };

    updateVoices();
    speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      cleanupAudioPlayback();
      ctxSetCurrentSpokenWordIds([]);
    };
  }, [cleanupAudioPlayback, ctxSetCurrentSpokenWordIds]);

  useEffect(() => {
    if (!isSpeedSelectorOpen) {
      return;
    }

    const updatePopoverPosition = () => {
      const trigger = speedTriggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setSpeedPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!speedSelectorRef.current?.contains(event.target as Node)) {
        setIsSpeedSelectorOpen(false);
      }
    };

    updatePopoverPosition();
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isSpeedSelectorOpen]);

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
        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            className={sectionButtonClassName}
            onClick={() => toggleSection("read-aloud")}
          >
            <AccordionToggleIcon isOpen={openSection === "read-aloud"} />
            <span className={sectionLabelClassName(openSection === "read-aloud")}>
              Read Aloud
            </span>
          </button>
          {openSection === "read-aloud" && (
            <div className="px-4 pb-6">
              <div className="rounded-sm border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-row items-center justify-center gap-5">
                    <div
                      ref={speedSelectorRef}
                      className="relative flex flex-col items-center gap-2"
                    >
                      <ReadAloudButton
                        state={readAloudState}
                        disabled={readAloudState === "disabled"}
                        onClick={handleReadAloudClick}
                      />
                      <button
                        ref={speedTriggerRef}
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIsSpeedSelectorOpen((prev) => !prev);
                        }}
                        className="rounded-full border border-stroke px-3 py-1 text-xs font-medium text-black transition hover:border-primary hover:text-primary dark:border-strokedark dark:text-white dark:hover:border-primary dark:hover:text-primary"
                        aria-expanded={isSpeedSelectorOpen}
                        aria-label="Adjust speech speed"
                      >
                        {speechRate.toFixed(1)}x
                      </button>
                    </div>
                    <p className="max-w-sm text-sm leading-6 text-black dark:text-white">
                      {ttsError
                        ? ttsError
                        : !isReadAloudAvailable
                        ? "Read aloud is unavailable until Azure Speech is configured or a browser voice is available."
                        : isPlaying
                          ? "Read aloud is currently playing. Click the button again to stop."
                          : isAzureTtsAvailable
                            ? "Select text for Hebrew playback."
                          : hasReadAloudSelection
                            ? "Read aloud is available for the current selection."
                        : "Select a word, multiple words, or a strophe."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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

        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            className={sectionButtonClassName}
            onClick={() => toggleSection("wordplays")}
          >
            <AccordionToggleIcon isOpen={openSection === "wordplays"} />
            <span className={sectionLabelClassName(openSection === "wordplays")}>
              Wordplays
            </span>
          </button>
          {openSection === "wordplays" && (
            <div className="px-4 pb-6">
              <div className="rounded-sm border border-dashed border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
                <p className="text-sm leading-6 text-black dark:text-white">
                  Wordplay-related audio tools will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 text-sm leading-6 text-slate-600">
          Individual-letter highlights stay in the browser for now and are not saved to the database. You can still use the main formatting tools on words and strophes, but these sound and letter views act like browsing filters.
        </div>
      </div>
      {isSpeedSelectorOpen &&
        speedPopoverPosition &&
        createPortal(
          <div
            ref={speedSelectorRef}
            className="fixed z-[1000] w-56 -translate-x-1/2 rounded-lg border border-stroke bg-white p-4 shadow-lg dark:border-strokedark dark:bg-boxdark"
            style={{
              top: speedPopoverPosition.top,
              left: speedPopoverPosition.left,
            }}
          >
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(event) => setSpeechRate(Number(event.target.value))}
              className="w-full accent-primary"
              aria-label="Speech speed"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>1.5x</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Sounds;
