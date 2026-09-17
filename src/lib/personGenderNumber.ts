import type { ColorData, StudyMetadata, WordProps } from "./data";

// Exact fills and font colors from Sela Mockup - 2026, pages 124 and 126.
// Do not clamp these presets to the user swatches (notably #666666).
export const PERSON_GENDER_NUMBER_CHIPS = [
  { code: "3ms", gloss: "He Him His", fill: "#BBDEFB", text: "#666666" },
  { code: "3mp", gloss: "They Them Their", fill: "#F8BBD0", text: "#666666" },
  { code: "2ms", gloss: "You Your", fill: "#3F51B5", text: "#FFFFFF" },
  { code: "2mp", gloss: "You Your", fill: "#E91E63", text: "#FFFFFF" },
  { code: "1cs", gloss: "I Me My", fill: "#FFF9C4", text: "#666666" },
  { code: "1cp", gloss: "We Us Our", fill: "#FFD54F", text: "#666666" },
  { code: "2fs", gloss: "You Your (f)", fill: "#9C27B0", text: "#FFFFFF" },
  { code: "2fp", gloss: "You Your (f)", fill: "#607D8B", text: "#FFFFFF" },
  { code: "3fs", gloss: "She Her Her", fill: "#E1BEE7", text: "#666666" },
  { code: "3fp", gloss: "They Them Their (f)", fill: "#CFD8DC", text: "#666666" },
] as const;

export type PersonGenderNumberCode = (typeof PERSON_GENDER_NUMBER_CHIPS)[number]["code"];

export const PERSON_GENDER_NUMBER_HIGHLIGHT_PREFIX = "person-gender-number__";

const codes = new Map<string, PersonGenderNumberCode>(
  PERSON_GENDER_NUMBER_CHIPS.map(({ code }) => [code, code]),
);

export const getPersonGenderNumberCodes = (
  morphology?: string | null,
): PersonGenderNumberCode[] => {
  const matches = new Set<PersonGenderNumberCode>();
  for (const token of morphology?.toLowerCase().match(/[a-z0-9_]+/g) ?? []) {
    const code = codes.get(token);
    if (code) matches.add(code);
  }
  // Preserve source order: counts include every match, but colors use the first.
  return [...matches];
};

export const getPersonGenderNumberHighlightCodes = (highlightId?: string | null) =>
  highlightId?.startsWith(PERSON_GENDER_NUMBER_HIGHLIGHT_PREFIX)
    ? getPersonGenderNumberCodes(highlightId.slice(PERSON_GENDER_NUMBER_HIGHLIGHT_PREFIX.length))
    : [];

export const setPersonGenderNumberHighlightScope = (
  metadata: StudyMetadata,
  scope: PersonGenderNumberCode[],
) => {
  const scopes = { ...metadata.personGenderNumberHighlights };
  const layerId = String(metadata.activeLayerId ?? 0);
  if (scope.length) {
    scopes[layerId] = scope;
  } else {
    delete scopes[layerId];
  }
  if (Object.keys(scopes).length) {
    metadata.personGenderNumberHighlights = scopes;
  } else {
    delete metadata.personGenderNumberHighlights;
  }
};

export const getPersonGenderNumberHighlightState = (
  metadata: StudyMetadata,
  words: WordProps[],
) => {
  const scope = metadata.personGenderNumberHighlights?.[String(metadata.activeLayerId ?? 0)];
  if (!scope?.length) return undefined;

  const wordsColorMap = new Map<number, ColorData>();
  const originalColors = new Map<number, ColorData | undefined>();
  words.forEach((word) => {
    const matches = getPersonGenderNumberCodes(word.morphology);
    const primary = PERSON_GENDER_NUMBER_CHIPS.find((chip) => chip.code === matches[0]);
    const color = metadata.words?.[word.wordId]?.color;
    // Only restore untouched preset colors, not subsequent manual formatting.
    if (primary && matches.some((code) => scope.includes(code)) &&
        color?.fill === primary.fill && color.text === primary.text) {
      wordsColorMap.set(word.wordId, { ...color, source: "syntax" });
      originalColors.set(word.wordId, undefined);
    }
  });
  if (!wordsColorMap.size) return undefined;

  return {
    highlightId: `${PERSON_GENDER_NUMBER_HIGHLIGHT_PREFIX}${scope.join(",")}`,
    wordsColorMap,
    originalColors,
  };
};
