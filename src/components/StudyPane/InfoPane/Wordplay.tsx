import React, { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

import { FormatContext } from "..";
import AccordionToggleIcon from "./common/AccordionToggleIcon";
import { LETTER_CHIP_MAP, SOUND_CHIP_MAP } from "@/lib/hebrewHighlights";
import { WordProps } from "@/lib/data";
import {
  SecondaryTag,
  WordplayCandidate,
  WordplayScope,
  WordplayTool,
  findCandidates,
  wordLetterIds,
  wordSoundIds,
} from "@/lib/wordplay";

// Base-letter ids that also have a final form; when highlighting the passage we
// expand a base id to include its final form so ק≈ק and צ≈ץ both light up.
const LETTER_ID_FINAL_FORMS: Record<string, string[]> = {
  kaf: ["kaf", "final-kaf"],
  mem: ["mem", "final-mem"],
  nun: ["nun", "final-nun"],
  tsadi: ["tsadi", "final-tsadi"],
  pe: ["pe", "final-pe"],
};

const expandLetterIdsForHighlight = (ids: string[]): string[] => {
  const expanded = new Set<string>();
  ids.forEach((id) => {
    (LETTER_ID_FINAL_FORMS[id] ?? [id]).forEach((member) => expanded.add(member));
  });
  return [...expanded];
};

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
type TierFilter = "strong" | "min";
type TraitFilter = "opening" | "ending";

const TIER_LABELS: Record<WordplayTool, Record<TierFilter, string>> = {
  soundplay: { strong: "5 shared sounds", min: "4 shared sounds" },
  wordplay: { strong: "3 root letters", min: "2 root letters" },
};

const TRAIT_LABELS: Record<TraitFilter, string> = {
  opening: "Similar opening",
  ending: "Similar ending",
};

const WordplayInfoModal = ({
  title,
  body,
  note,
  onClose,
}: {
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
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300"
          aria-label="Close"
        >
          <IconX size={18} stroke={2} />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <IconInfoCircle size={22} stroke={2.2} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
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
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-full border px-3 py-1 text-xs transition ${
      active
        ? "border-primary bg-primary text-white"
        : "border-slate-300 text-slate-600 hover:border-primary/60 dark:text-slate-300"
    }`}
  >
    {label}
  </button>
);

const Wordplay = () => {
  const {
    ctxPassageProps,
    ctxSelectedWords,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetHighlightedSoundChipIds,
    ctxSetSoundHighlightEnabled,
    ctxSetSelectedSoundChipIds,
    ctxSetHighlightedLetterChipIds,
    ctxSetLetterHighlightEnabled,
    ctxSetSelectedLetterChipIds,
    ctxSoundHighlightEnabled,
    ctxLetterHighlightEnabled,
    ctxSetHighlightRestrictWordIds,
  } = useContext(FormatContext);

  const [tool, setTool] = useState<WordplayTool>("wordplay");
  const [scopeMode, setScopeMode] = useState<"whole" | "adjacent">("whole");
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeCandidateKey, setActiveCandidateKey] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Tier filters default ON (inclusion). Trait filters default OFF (enabling one
  // narrows to candidates with that trait — never hides otherwise-valid matches).
  const [tierFilters, setTierFilters] = useState<Record<TierFilter, boolean>>({
    strong: true,
    min: true,
  });
  const [traitFilters, setTraitFilters] = useState<Record<TraitFilter, boolean>>({
    opening: false,
    ending: false,
  });
  const [secondaryFilters, setSecondaryFilters] = useState<Record<SecondaryTag, boolean>>({
    "same-pos": false,
    "same-preposition": false,
    proximity: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clear any orphaned passage highlight/restriction when the panel unmounts
  // (e.g. the user switches to another InfoPane tab) so a highlight can't be left
  // stranded with no way to clear it from this panel.
  useEffect(
    () => () => {
      ctxSetHighlightRestrictWordIds([]);
      ctxSetHighlightedSoundChipIds([]);
      ctxSetSoundHighlightEnabled(false);
      ctxSetHighlightedLetterChipIds([]);
      ctxSetLetterHighlightEnabled(false);
    },
    // Run only on unmount; setters are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!showTooltip) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTooltip(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTooltip]);

  const allWords = useMemo(() => {
    const words: WordProps[] = [];
    for (const stanza of ctxPassageProps.stanzaProps ?? []) {
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

  const scope: WordplayScope = useMemo(() => {
    if (scopeMode === "whole") {
      return { mode: "whole" };
    }
    const focusWord = ctxSelectedWords[0] ?? allWords[0];
    return {
      mode: "adjacent",
      focusStanzaId: focusWord?.stanzaId ?? 0,
      focusStropheId: focusWord?.stropheId ?? 0,
    };
  }, [scopeMode, ctxSelectedWords, allWords]);

  const candidates = useMemo(
    () => findCandidates(allWords, tool, { scope }),
    [allWords, tool, scope],
  );

  // Words that carry no lexical/sound form and are therefore skipped by the
  // current tool — surfaced so the scholar knows results are on a subset.
  const skippedWordCount = useMemo(() => {
    const hasData = (word: WordProps) =>
      tool === "wordplay"
        ? wordLetterIds(word).length > 0
        : wordSoundIds(word).length > 0;
    return allWords.filter((word) => !hasData(word)).length;
  }, [allWords, tool]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      // Tier is an inclusion filter: show the candidate only if its tier is on.
      const tierOk = candidate.strongMatch ? tierFilters.strong : tierFilters.min;
      if (!tierOk) return false;

      // Trait filters are positive refinements: an enabled trait requires the
      // candidate to have it. Disabled traits never hide anything.
      if (traitFilters.opening && !candidate.sameOpening) return false;
      if (traitFilters.ending && !candidate.sameEnding) return false;

      // Secondary tags are restrictive (AND): every enabled secondary tag must be
      // present on the candidate. With none enabled there is no secondary filtering.
      const activeSecondary = (Object.keys(secondaryFilters) as SecondaryTag[]).filter(
        (tag) => secondaryFilters[tag],
      );
      return activeSecondary.every((tag) => candidate.secondaryTags.includes(tag));
    });
  }, [candidates, tierFilters, traitFilters, secondaryFilters]);

  const candidateKey = (candidate: WordplayCandidate) =>
    `${candidate.wordA.wordId}-${candidate.wordB.wordId}`;

  const clearHighlight = () => {
    setActiveCandidateKey(null);
    ctxSetHighlightRestrictWordIds([]);
    ctxSetHighlightedSoundChipIds([]);
    ctxSetSoundHighlightEnabled(false);
    ctxSetSelectedSoundChipIds([]);
    ctxSetHighlightedLetterChipIds([]);
    ctxSetLetterHighlightEnabled(false);
    ctxSetSelectedLetterChipIds([]);
  };

  // If the active candidate is filtered out (scope/tag change) or disappears,
  // drop its now-orphaned passage highlight so the UI can't show a highlight with
  // no corresponding visible/active row.
  useEffect(() => {
    if (!activeCandidateKey) return;
    const stillVisible = filteredCandidates.some(
      (c) => `${c.wordA.wordId}-${c.wordB.wordId}` === activeCandidateKey,
    );
    if (!stillVisible) {
      clearHighlight();
    }
    // clearHighlight only calls stable context setters; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCandidates, activeCandidateKey]);

  const highlightCandidate = (candidate: WordplayCandidate) => {
    const key = candidateKey(candidate);
    if (activeCandidateKey === key) {
      clearHighlight();
      return;
    }

    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    // Restrict the passage highlight to just this candidate pair so the shared
    // sounds/letters light up on the two words rather than the whole passage.
    ctxSetHighlightRestrictWordIds([candidate.wordA.wordId, candidate.wordB.wordId]);
    const uniqueShared = [...new Set(candidate.sharedIds)];

    if (candidate.tool === "soundplay") {
      ctxSetHighlightedSoundChipIds(uniqueShared);
      ctxSetSoundHighlightEnabled(true);
      ctxSetSelectedSoundChipIds([]);
      ctxSetHighlightedLetterChipIds([]);
      ctxSetLetterHighlightEnabled(false);
      ctxSetSelectedLetterChipIds([]);
    } else {
      ctxSetHighlightedLetterChipIds(expandLetterIdsForHighlight(uniqueShared));
      ctxSetLetterHighlightEnabled(true);
      ctxSetSelectedLetterChipIds([]);
      ctxSetHighlightedSoundChipIds([]);
      ctxSetSoundHighlightEnabled(false);
      ctxSetSelectedSoundChipIds([]);
    }
    setActiveCandidateKey(key);
  };

  const switchTool = (nextTool: WordplayTool) => {
    if (nextTool === tool) return;
    clearHighlight();
    setTool(nextTool);
  };

  const copy = TOOL_COPY[tool];
  const tierLabels = TIER_LABELS[tool];
  const highlightActive =
    Boolean(activeCandidateKey) || ctxSoundHighlightEnabled || ctxLetterHighlightEnabled;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
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
          <WordplayInfoModal
            title={copy.title}
            body={copy.tooltipBody}
            note={copy.tooltipNote}
            onClose={() => setShowTooltip(false)}
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
              onClick={() => setScopeMode("whole")}
            />
            <ToggleChip
              label="±2 strophes"
              active={scopeMode === "adjacent"}
              onClick={() => setScopeMode("adjacent")}
            />
          </div>
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
        <span className="text-sm font-medium text-black dark:text-white">
          {filteredCandidates.length} result{filteredCandidates.length === 1 ? "" : "s"}
        </span>
        {highlightActive && (
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
