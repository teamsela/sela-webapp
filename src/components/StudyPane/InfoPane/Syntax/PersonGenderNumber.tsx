import { useContext, useEffect, useId, useMemo } from "react";

import { DEFAULT_BORDER_COLOR } from "@/lib/colors";
import { WordProps } from "@/lib/data";
import {
  getPersonGenderNumberCodes,
  PERSON_GENDER_NUMBER_CHIPS,
  PERSON_GENDER_NUMBER_HIGHLIGHT_PREFIX,
  PersonGenderNumberCode,
} from "@/lib/personGenderNumber";
import { deriveUniformWordPalette } from "@/lib/utils";

import { FormatContext } from "../..";
import AccordionToggleIcon from "../common/AccordionToggleIcon";
import { HighlightGroup } from "../useHighlightManager";
import PersonGenderNumberInfo from "./PersonGenderNumberInfo";
import SyntaxSmartHighlight from "./SmartHighlight";
import SyntaxLabel from "./SyntaxLabel";

const HIGHLIGHT_PREFIX = PERSON_GENDER_NUMBER_HIGHLIGHT_PREFIX;
const ALL_CODES = PERSON_GENDER_NUMBER_CHIPS.map(({ code }) => code);

type Props = {
  words: WordProps[];
  isOpen: boolean;
  onToggle: () => void;
  activeHighlightId: string | null;
  onHighlight: (highlightId: string, groups: HighlightGroup[]) => void;
};

const PersonGenderNumber = ({
  words, isOpen, onToggle, activeHighlightId, onHighlight,
}: Props) => {
  const {
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords,
    ctxSetSelectedStrophes, ctxWordsColorMap, ctxStudyMetadata, ctxInViewMode,
    ctxSelectedPersonGenderNumberCodes: selectedCodes,
    ctxSetSelectedPersonGenderNumberCodes: setSelectedCodes,
  } = useContext(FormatContext);
  const panelId = useId();
  const wordCodes = useMemo(
    () => words.map((word) => ({ word, codes: getPersonGenderNumberCodes(word.morphology) })),
    [words],
  );
  const wordsByCode = useMemo(() => {
    const map = new Map<PersonGenderNumberCode, WordProps[]>(
      PERSON_GENDER_NUMBER_CHIPS.map(({ code }) => [code, []]),
    );
    wordCodes.forEach(({ word, codes }) => {
      codes.forEach((code) => map.get(code)?.push(word));
    });
    return map;
  }, [wordCodes]);
  const selectedWordIds = useMemo(
    () => new Set(ctxSelectedWords.map((word) => word.wordId)),
    [ctxSelectedWords],
  );

  // Keep chip scope in sync with external deselection without selecting another
  // chip merely because it shares an ambiguous verb with the clicked chip.
  useEffect(() => {
    const next = selectedCodes.filter((code) => {
      const matches = wordsByCode.get(code) ?? [];
      return matches.length > 0 && matches.every((word) => selectedWordIds.has(word.wordId));
    });
    if (next.length !== selectedCodes.length) setSelectedCodes(next);
  }, [selectedCodes, selectedWordIds, setSelectedCodes, wordsByCode]);

  const toggleChip = (code: PersonGenderNumberCode) => {
    const matches = wordsByCode.get(code) ?? [];
    if (ctxInViewMode || !matches.length) return;
    const deselect = selectedCodes.includes(code);
    const nextCodes = deselect
      ? selectedCodes.filter((selected) => selected !== code)
      : [...selectedCodes, code];
    const retainedIds = new Set(
      nextCodes.flatMap((selected) => wordsByCode.get(selected) ?? []).map((word) => word.wordId),
    );
    const matchIds = new Set(matches.map((word) => word.wordId));
    const nextWords = deselect
      ? ctxSelectedWords.filter((word) => !matchIds.has(word.wordId) || retainedIds.has(word.wordId))
      : [...ctxSelectedWords, ...matches.filter((word) => !selectedWordIds.has(word.wordId))];
    setSelectedCodes(nextCodes);
    ctxSetSelectedWords(nextWords);
    ctxSetNumSelectedWords(nextWords.length);
    ctxSetSelectedStrophes([]);
  };

  const scope = selectedCodes.length ? selectedCodes : ALL_CODES;
  const groups = useMemo<HighlightGroup[]>(() => {
    const byPrimaryCode = new Map<PersonGenderNumberCode, WordProps[]>(
      ALL_CODES.map((code) => [code, []]),
    );
    wordCodes.forEach(({ word, codes }) => {
      if (codes.some((code) => scope.includes(code))) {
        byPrimaryCode.get(codes[0])?.push(word);
      }
    });
    return PERSON_GENDER_NUMBER_CHIPS.map((chip) => ({
      label: chip.code,
      words: byPrimaryCode.get(chip.code) ?? [],
      palette: { fill: chip.fill, text: chip.text, border: DEFAULT_BORDER_COLOR },
    })).filter((group) => group.words.length > 0);
  }, [scope, wordCodes]);

  const activeId = activeHighlightId?.startsWith(HIGHLIGHT_PREFIX) ? activeHighlightId : null;
  // Store the scope in the existing highlight ID so undo/redo restores chip colors too.
  const highlightedCodes = new Set(activeId?.slice(HIGHLIGHT_PREFIX.length).split(",") ?? []);
  const highlightId = activeId ?? `${HIGHLIGHT_PREFIX}${scope.join(",")}`;

  return (
    <div className="mx-4 border-b border-stroke dark:border-strokedark">
      <div className="flex items-center gap-2 px-2 py-4">
        <button
          type="button"
          className="ClickBlock flex min-w-0 items-center gap-2 text-left text-sm font-medium md:text-base"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <AccordionToggleIcon isOpen={isOpen} />
          <span className={isOpen ? "text-primary" : "text-black dark:text-white"}>
            Person, Gender, Number
          </span>
        </button>
        <PersonGenderNumberInfo />
      </div>
      {isOpen && (
        <div id={panelId} className="space-y-4 px-1 pb-4">
          <div
            className="mx-auto grid max-w-[25rem] gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 8.25rem), 1fr))" }}
          >
            {PERSON_GENDER_NUMBER_CHIPS.map((chip) => {
              const matches = wordsByCode.get(chip.code) ?? [];
              const palette = matches.length === 0 ? undefined : activeId
                ? highlightedCodes.has(chip.code) ? { fill: chip.fill, text: chip.text } : undefined
                : deriveUniformWordPalette(matches, {
                    colorMap: ctxWordsColorMap,
                    metadataMap: ctxStudyMetadata.words,
                  });
              return (
                <SyntaxLabel
                  key={chip.code}
                  label={chip.code}
                  gloss={chip.gloss}
                  wordCount={matches.length}
                  palette={palette}
                  isActive={false}
                  isSelected={selectedCodes.includes(chip.code)}
                  isDisabled={ctxInViewMode}
                  onToggleSelection={() => toggleChip(chip.code)}
                />
              );
            })}
          </div>
          <div className="flex justify-center pt-2">
            <SyntaxSmartHighlight
              highlightId={highlightId}
              groups={groups}
              activeHighlightId={activeHighlightId}
              onToggle={onHighlight}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonGenderNumber;
