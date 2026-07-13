import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FormatContext } from "../..";
import { expandHebrewLetterIds } from "@/lib/hebrewHighlights";
import { flattenPassageWords } from "@/lib/passage";
import {
  SecondaryTag,
  WordplayCandidate,
  WordplayScope,
  WordplayTool,
  findCandidates,
  wordLetterIds,
  wordSoundIds,
} from "@/lib/wordplay";

export type TierFilter = "strong" | "min";
export type TraitFilter = "opening" | "ending";

export const candidateKey = (candidate: WordplayCandidate): string =>
  `${candidate.tool}-${candidate.wordA.wordId}-${candidate.wordB.wordId}`;

export const useWordplayController = () => {
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
    ctxSetHighlightRestrictWordIds,
  } = useContext(FormatContext);

  const [tool, setTool] = useState<WordplayTool>("wordplay");
  const [scopeMode, setScopeMode] = useState<"whole" | "adjacent">("whole");
  const [adjacentFocus, setAdjacentFocus] = useState<{
    stanzaId: number;
    stropheId: number;
  } | null>(null);
  const [activeCandidateKey, setActiveCandidateKey] = useState<string | null>(null);
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

  const activeCandidateKeyRef = useRef<string | null>(null);
  useEffect(() => {
    activeCandidateKeyRef.current = activeCandidateKey;
  }, [activeCandidateKey]);

  useEffect(
    () => () => {
      if (!activeCandidateKeyRef.current) return;
      ctxSetHighlightRestrictWordIds([]);
      ctxSetHighlightedSoundChipIds([]);
      ctxSetSoundHighlightEnabled(false);
      ctxSetHighlightedLetterChipIds([]);
      ctxSetLetterHighlightEnabled(false);
    },
    [
      ctxSetHighlightRestrictWordIds,
      ctxSetHighlightedLetterChipIds,
      ctxSetHighlightedSoundChipIds,
      ctxSetLetterHighlightEnabled,
      ctxSetSoundHighlightEnabled,
    ],
  );

  const allWords = useMemo(
    () => flattenPassageWords(ctxPassageProps),
    [ctxPassageProps],
  );

  useEffect(() => {
    const selected = ctxSelectedWords[0];
    if (scopeMode === "adjacent" && selected) {
      setAdjacentFocus({
        stanzaId: selected.stanzaId,
        stropheId: selected.stropheId,
      });
    }
  }, [scopeMode, ctxSelectedWords]);

  const scope: WordplayScope = useMemo(() => {
    if (scopeMode === "whole" || !adjacentFocus) {
      return { mode: "whole" };
    }
    return {
      mode: "adjacent",
      focusStanzaId: adjacentFocus.stanzaId,
      focusStropheId: adjacentFocus.stropheId,
    };
  }, [scopeMode, adjacentFocus]);

  const candidates = useMemo(
    () => findCandidates(allWords, tool, { scope }),
    [allWords, tool, scope],
  );

  const skippedWordCount = useMemo(() => {
    const hasData = (word: (typeof allWords)[number]) =>
      tool === "wordplay"
        ? wordLetterIds(word).length > 0
        : wordSoundIds(word).length > 0;
    return allWords.filter((word) => !hasData(word)).length;
  }, [allWords, tool]);

  const activeSecondaryFilters = useMemo(
    () =>
      (Object.keys(secondaryFilters) as SecondaryTag[]).filter(
        (tag) => secondaryFilters[tag],
      ),
    [secondaryFilters],
  );

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        const tierOk = candidate.strongMatch
          ? tierFilters.strong
          : tierFilters.min;
        if (!tierOk) return false;
        if (traitFilters.opening && !candidate.sameOpening) return false;
        if (traitFilters.ending && !candidate.sameEnding) return false;
        return activeSecondaryFilters.every((tag) =>
          candidate.secondaryTags.includes(tag),
        );
      }),
    [
      activeSecondaryFilters,
      candidates,
      tierFilters.min,
      tierFilters.strong,
      traitFilters.ending,
      traitFilters.opening,
    ],
  );

  const clearHighlight = useCallback(() => {
    setActiveCandidateKey(null);
    ctxSetHighlightRestrictWordIds([]);
    ctxSetHighlightedSoundChipIds([]);
    ctxSetSoundHighlightEnabled(false);
    ctxSetSelectedSoundChipIds([]);
    ctxSetHighlightedLetterChipIds([]);
    ctxSetLetterHighlightEnabled(false);
    ctxSetSelectedLetterChipIds([]);
  }, [
    ctxSetHighlightRestrictWordIds,
    ctxSetHighlightedLetterChipIds,
    ctxSetHighlightedSoundChipIds,
    ctxSetLetterHighlightEnabled,
    ctxSetSelectedLetterChipIds,
    ctxSetSelectedSoundChipIds,
    ctxSetSoundHighlightEnabled,
  ]);

  useEffect(() => {
    if (!activeCandidateKey) return;
    const stillVisible = filteredCandidates.some(
      (candidate) => candidateKey(candidate) === activeCandidateKey,
    );
    if (!stillVisible) {
      clearHighlight();
    }
  }, [activeCandidateKey, clearHighlight, filteredCandidates]);

  const highlightCandidate = (candidate: WordplayCandidate) => {
    const key = candidateKey(candidate);
    if (activeCandidateKey === key) {
      clearHighlight();
      return;
    }

    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    ctxSetHighlightRestrictWordIds([
      candidate.wordA.wordId,
      candidate.wordB.wordId,
    ]);
    const uniqueShared = [...new Set(candidate.sharedIds)];

    if (candidate.tool === "soundplay") {
      ctxSetHighlightedSoundChipIds(uniqueShared);
      ctxSetSoundHighlightEnabled(true);
      ctxSetSelectedSoundChipIds([]);
      ctxSetHighlightedLetterChipIds([]);
      ctxSetLetterHighlightEnabled(false);
      ctxSetSelectedLetterChipIds([]);
    } else {
      ctxSetHighlightedLetterChipIds(expandHebrewLetterIds(uniqueShared));
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
    if (activeCandidateKey) {
      clearHighlight();
    }
    setTool(nextTool);
  };

  const switchScope = (nextMode: "whole" | "adjacent") => {
    if (nextMode === "adjacent") {
      const focusWord = ctxSelectedWords[0] ?? null;
      if (!focusWord && !adjacentFocus) return;
      if (focusWord) {
        setAdjacentFocus({
          stanzaId: focusWord.stanzaId,
          stropheId: focusWord.stropheId,
        });
      }
    }
    setScopeMode(nextMode);
  };

  return {
    activeCandidateKey,
    canUseAdjacentScope: Boolean(ctxSelectedWords[0] || adjacentFocus),
    clearHighlight,
    filteredCandidates,
    hasActiveHighlight: Boolean(activeCandidateKey),
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
  };
};
