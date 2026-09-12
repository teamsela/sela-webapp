import React, { useCallback, useEffect, useState } from "react";

import AccordionToggleIcon from "./common/AccordionToggleIcon";
import InfoModal from "./common/InfoModal";
import useEscapeToClose from "./common/useEscapeToClose";
import { LETTER_CHIP_MAP, SOUND_CHIP_MAP } from "@/lib/hebrewHighlights";
import { WordProps } from "@/lib/data";
import {
  SecondaryTag,
  SOUNDPLAY_MIN_SHARED,
  SOUNDPLAY_STRONG_SHARED,
  WordplayCandidate,
  WordplayTool,
  WORDPLAY_MIN_SHARED,
  WORDPLAY_STRONG_SHARED,
} from "@/lib/wordplay";
import {
  candidateKey,
  TierFilter,
  TraitFilter,
  useWordplayController,
} from "./Wordplay/useWordplayController";

const chipLabel = (tool: WordplayTool, id: string): string => {
  if (tool === "soundplay") {
    return SOUND_CHIP_MAP.get(id)?.label ?? id;
  }
  return LETTER_CHIP_MAP.get(id)?.label ?? id;
};

const chipPalette = (tool: WordplayTool, id: string) =>
  tool === "soundplay"
    ? SOUND_CHIP_MAP.get(id)?.palette
    : LETTER_CHIP_MAP.get(id)?.palette;

const SECONDARY_TAG_LABELS: Record<SecondaryTag, string> = {
  "same-pos": "Same part of speech",
  "same-preposition": "Same preposition",
  proximity: "Proximity (same / adjacent strophe)",
};

const TOOL_COPY: Record<
  WordplayTool,
  { title: string; short: string; tooltipBody: string; tooltipNote: string }
> = {
  soundplay: {
    title: "Soundplay — Shared Hebrew Sounds",
    short: "Shared Sounds",
    tooltipBody:
      "Soundplay compares the transliterated consonant sounds of each word as it appears in the passage (the conjugated form). Vowels are ignored because in Hebrew they mostly encode grammar. A pair of different words that shares four or more sounds is surfaced as a possible soundplay.",
    tooltipNote:
      "Highlights reuse the Sound Distribution colors and appear in the Hebrew text and transliteration.",
  },
  wordplay: {
    title: "Wordplay — Shared Hebrew Letters",
    short: "Shared Letters",
    tooltipBody:
      "Wordplay compares the Hebrew letters of each word's dictionary (unconjugated) form. A pair of different words that shares three letters — or two letters where at least one is a rare letter (ח ע ט ז צ ק שׂ) — is surfaced as a possible wordplay.",
    tooltipNote:
      "Highlights reuse the Letter Distribution colors and appear in the Hebrew text.",
  },
};

// Tier filters are INCLUSION toggles (default on): they choose which generator
// tier to show. Trait filters (opening/ending) are POSITIVE refinements (default
// off): enabling one narrows the list to candidates that have that trait.
const TIER_LABELS: Record<WordplayTool, Record<TierFilter, string>> = {
  soundplay: {
    strong: `${SOUNDPLAY_STRONG_SHARED} shared sounds`,
    min: `${SOUNDPLAY_MIN_SHARED} shared sounds`,
  },
  wordplay: {
    strong: `${WORDPLAY_STRONG_SHARED} lexical letters`,
    min: `${WORDPLAY_MIN_SHARED} lexical letters`,
  },
};

const TRAIT_LABELS: Record<TraitFilter, string> = {
  opening: "Similar opening",
  ending: "Similar ending",
};

const SharedChip = ({
  tool,
  id,
}: {
  tool: WordplayTool;
  id: string;
}) => {
  const palette = chipPalette(tool, id);
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs"
      style={{
        backgroundColor: palette?.fill ?? "#EFEFEF",
        color: palette?.text ?? "#000000",
        border: `1px solid ${palette?.border ?? "#D9D9D9"}`,
      }}
    >
      {chipLabel(tool, id)}
    </span>
  );
};

const CandidateRow = ({
  candidate,
  isActive,
  onClick,
}: {
  candidate: WordplayCandidate;
  isActive: boolean;
  onClick: () => void;
}) => {
  const uniqueShared = [...new Set(candidate.sharedIds)];
  const wordText = (word: WordProps) => word.wlcWord || word.gloss || `#${word.strongNumber}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      data-testid="wordplay-candidate"
      data-tool={candidate.tool}
      data-word-a-id={candidate.wordA.wordId}
      data-word-b-id={candidate.wordB.wordId}
      data-word-a-strong={candidate.wordA.strongNumber}
      data-word-b-strong={candidate.wordB.strongNumber}
      data-shared-count={candidate.sharedCount}
      data-shared-ids={uniqueShared.join(",")}
      className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition ${
        isActive
          ? "border-primary bg-primary/5"
          : "border-stroke hover:border-primary/60 dark:border-strokedark"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hbFont text-lg text-black dark:text-white" dir="rtl">
          {wordText(candidate.wordA)} &ndash; {wordText(candidate.wordB)}
        </span>
        <span className="whitespace-nowrap rounded-full bg-[#EFEFEF] px-2 py-0.5 text-xs text-black">
          {candidate.sharedCount} shared
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {uniqueShared.map((id) => (
          <SharedChip key={id} tool={candidate.tool} id={id} />
        ))}
      </div>
      {candidate.secondaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.secondaryTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
            >
              {SECONDARY_TAG_LABELS[tag]}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

const ToggleChip = ({
  label,
  active,
  disabled = false,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={`rounded-full border px-3 py-1 text-xs transition ${
      disabled
        ? "cursor-not-allowed border-slate-200 text-slate-400"
        : active
        ? "border-primary bg-primary text-white"
        : "border-slate-300 text-slate-600 hover:border-primary/60 dark:text-slate-300"
    }`}
  >
    {label}
  </button>
);

const Wordplay = () => {
  const {
    activeCandidateKey,
    canUseAdjacentScope,
    clearHighlight,
    filteredCandidates,
    hasActiveHighlight,
    highlightCandidate,
    scopeMode,
    secondaryFilters,
    setSecondaryFilters,
    setTierFilters,
    setTraitFilters,
    skippedWordCount,
    switchScope,
    switchTool,
    tierFilters,
    tool,
    traitFilters,
  } = useWordplayController();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closeTooltip = useCallback(() => setShowTooltip(false), []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEscapeToClose(showTooltip, closeTooltip);

  const copy = TOOL_COPY[tool];
  const tierLabels = TIER_LABELS[tool];

  return (
    <div className="flex h-full flex-col overflow-y-auto" data-testid="wordplay-panel">
      <div className="mx-4 border-b border-stroke pb-4 dark:border-strokedark">
        <div className="flex items-center gap-2 px-2 py-4">
          <AccordionToggleIcon isOpen />
          <span className="text-base font-medium text-primary">Possible Wordplays</span>
          <span
            className="relative ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
            onClick={() => setShowTooltip(true)}
            role="button"
            aria-label="About wordplay"
          >
            i
          </span>
        </div>

        {isMounted && showTooltip && (
          <InfoModal
            title={copy.title}
            body={copy.tooltipBody}
            note={copy.tooltipNote}
            onClose={closeTooltip}
          />
        )}

        {/* Tool selector */}
        <div className="px-2">
          <div
            className="flex rounded-full border border-primary p-0.5"
            role="tablist"
            aria-label="Wordplay tool"
          >
            {(["wordplay", "soundplay"] as WordplayTool[]).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={tool === option}
                onClick={() => switchTool(option)}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  tool === option ? "bg-primary text-white" : "text-black dark:text-white"
                }`}
              >
                {TOOL_COPY[option].short}
              </button>
            ))}
          </div>
        </div>

        {/* Run scope */}
        <div className="mt-4 px-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Run scope
          </p>
          <div className="flex gap-2">
            <ToggleChip
              label="Whole passage"
              active={scopeMode === "whole"}
              onClick={() => switchScope("whole")}
            />
            <ToggleChip
              label="±2 strophes"
              active={scopeMode === "adjacent"}
              disabled={!canUseAdjacentScope}
              onClick={() => switchScope("adjacent")}
            />
          </div>
          {!canUseAdjacentScope && (
            <p className="mt-1 text-xs italic text-slate-500">
              Select a passage word to set the ±2-strophe focus.
            </p>
          )}
        </div>

        {/* Primary tags: tier (inclusion) + traits (positive refinement) */}
        <div className="mt-4 px-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Primary tags
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(tierLabels) as TierFilter[]).map((key) => (
              <ToggleChip
                key={key}
                label={tierLabels[key]}
                active={tierFilters[key]}
                onClick={() =>
                  setTierFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                }
              />
            ))}
            {(Object.keys(TRAIT_LABELS) as TraitFilter[]).map((key) => (
              <ToggleChip
                key={key}
                label={TRAIT_LABELS[key]}
                active={traitFilters[key]}
                onClick={() =>
                  setTraitFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                }
              />
            ))}
          </div>
        </div>

        {/* Secondary tags */}
        <div className="mt-4 px-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Secondary tags
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SECONDARY_TAG_LABELS) as SecondaryTag[]).map((tag) => (
              <ToggleChip
                key={tag}
                label={SECONDARY_TAG_LABELS[tag]}
                active={secondaryFilters[tag]}
                onClick={() =>
                  setSecondaryFilters((prev) => ({ ...prev, [tag]: !prev[tag] }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between px-6 pb-2 pt-4">
        <span
          className="text-sm font-medium text-black dark:text-white"
          data-testid="wordplay-result-count"
        >
          {filteredCandidates.length} result{filteredCandidates.length === 1 ? "" : "s"}
        </span>
        {hasActiveHighlight && (
          <button
            type="button"
            onClick={clearHighlight}
            className="rounded-full bg-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300"
          >
            Clear Highlight
          </button>
        )}
      </div>

      {skippedWordCount > 0 && (
        <p className="px-6 pb-1 text-xs italic text-slate-500">
          {skippedWordCount} word{skippedWordCount === 1 ? "" : "s"} skipped (no{" "}
          {tool === "wordplay" ? "lexical form" : "sounds"} available).
        </p>
      )}

      <div className="flex flex-col gap-2 px-4 pb-8" aria-label="Possible wordplays results">
        {filteredCandidates.length === 0 ? (
          <p className="px-2 py-4 text-sm text-slate-500">
            No possible {copy.short.toLowerCase()} found for the current scope and filters.
          </p>
        ) : (
          filteredCandidates.map((candidate) => {
            const key = candidateKey(candidate);
            return (
              <CandidateRow
                key={key}
                candidate={candidate}
                isActive={activeCandidateKey === key}
                onClick={() => highlightCandidate(candidate)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default Wordplay;
