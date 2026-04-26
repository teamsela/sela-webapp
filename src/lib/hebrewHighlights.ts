import { DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, clampPaletteToUserColors } from "@/lib/colors";
import { ColorData, WordProps } from "@/lib/data";
export { transliterateHebrew } from "@/lib/transliterate";

type InlinePalette = Omit<ColorData, "source">;

export type SoundChip = {
  id: string;
  label: string;
  palette: InlinePalette;
};

export type LetterChip = {
  id: string;
  label: string;
  palette: InlinePalette;
};

type TransliterationPattern = {
  text: string;
  soundId: string;
};

type HebrewClusterMatch = {
  text: string;
  letterId?: string;
  soundIds: string[];
};

export type InlineTextSegment = {
  text: string;
  highlightId?: string;
};

const createPalette = (fill: string, text = DEFAULT_TEXT_COLOR): InlinePalette => ({
  fill,
  border: DEFAULT_BORDER_COLOR,
  text,
});

export const SOUND_CHIPS: SoundChip[] = [
  { id: "s", label: "s", palette: createPalette("#FFF176") },          // yellow
  { id: "sh", label: "sh", palette: createPalette("#FFD54F") },        // gold/amber
  { id: "ts", label: "ts", palette: createPalette("#FFB74D") },        // orange (between sh and z)
  { id: "z", label: "z", palette: createPalette("#FF9800") },          // dark orange
  { id: "kh-ch", label: "kh/ch", palette: createPalette("#CE93D8") },  // lavender
  { id: "k-q", label: "k/q", palette: createPalette("#9C27B0", "#FFFFFF") }, // purple
  { id: "g", label: "g", palette: createPalette("#AB47BC") },          // purple (not green)
  { id: "h", label: "h", palette: createPalette("#E1BEE7") },          // light purple/lilac
  { id: "d", label: "d", palette: createPalette("#81C784") },          // light green
  { id: "t", label: "t", palette: createPalette("#388E3C", "#FFFFFF") }, // dark green
  { id: "n", label: "n", palette: createPalette("#EF9A9A") },          // light red/pink
  { id: "m", label: "m", palette: createPalette("#F44336", "#FFFFFF") }, // red
  { id: "b", label: "b", palette: createPalette("#795548", "#FFFFFF") }, // brown
  { id: "v", label: "v", palette: createPalette("#D7CCC8") },          // light grey-brown
  { id: "p", label: "p", palette: createPalette("#616161", "#FFFFFF") }, // dark gray
  { id: "f", label: "f", palette: createPalette("#E0E0E0") },          // light gray
  { id: "l", label: "l", palette: createPalette("#2196F3", "#FFFFFF") }, // blue
  { id: "r", label: "r", palette: createPalette("#64B5F6") },          // lighter blue
  { id: "y", label: "y", palette: createPalette("#B3E5FC") },          // very light blue
];

export const LETTER_CHIPS: LetterChip[] = [
  { id: "aleph", label: "א", palette: createPalette("#FFECB3") },
  { id: "bet", label: "ב", palette: createPalette("#C5CAE9") },
  { id: "gimel", label: "ג", palette: createPalette("#B2DFDB") },
  { id: "dalet", label: "ד", palette: createPalette("#FFCDD2") },
  { id: "he", label: "ה", palette: createPalette("#FFF9C4") },
  { id: "vav", label: "ו", palette: createPalette("#B3E5FC") },
  { id: "zayin", label: "ז", palette: createPalette("#C8E6C9") },
  { id: "het", label: "ח", palette: createPalette("#F8BBD0") },
  { id: "tet", label: "ט", palette: createPalette("#E1BEE7") },
  { id: "yod", label: "י", palette: createPalette("#DCEDC8") },
  { id: "kaf", label: "כ", palette: createPalette("#D1C4E9") },
  { id: "final-kaf", label: "ך", palette: createPalette("#EDE7F6") },
  { id: "lamed", label: "ל", palette: createPalette("#BBDEFB") },
  { id: "mem", label: "מ", palette: createPalette("#F0F4C3") },
  { id: "final-mem", label: "ם", palette: createPalette("#F7FAE6") },
  { id: "nun", label: "נ", palette: createPalette("#FFE0B2") },
  { id: "final-nun", label: "ן", palette: createPalette("#FFF3E0") },
  { id: "samekh", label: "ס", palette: createPalette("#FFEB3B") },
  { id: "ayin", label: "ע", palette: createPalette("#CFD8DC") },
  { id: "pe", label: "פ", palette: createPalette("#FFD54F") },
  { id: "tsadi", label: "צ", palette: createPalette("#4FC3F7") },
  { id: "final-tsadi", label: "ץ", palette: createPalette("#B3E5FC") },
  { id: "qof", label: "ק", palette: createPalette("#9575CD", "#FFFFFF") },
  { id: "resh", label: "ר", palette: createPalette("#90A4AE") },
  { id: "sin", label: "שׂ", palette: createPalette("#FFF176") },
  { id: "shin", label: "שׁ", palette: createPalette("#FF9800") },
  { id: "tav", label: "ת", palette: createPalette("#64B5F6") },
];

export const SOUND_CHIP_MAP = new Map(SOUND_CHIPS.map((chip) => [chip.id, chip]));
export const LETTER_CHIP_MAP = new Map(LETTER_CHIPS.map((chip) => [chip.id, chip]));

/**
 * Grouped letter chips for display. Final forms share a single chip
 * with the base letter (e.g. כ ך), matching the PDF spec that shows
 * 22 grouped chips rather than 27 individual ones.
 *
 * The `memberIds` array lists the individual LETTER_CHIP ids that belong
 * to the group. Selecting a group selects/deselects all member ids.
 */
export type LetterChipGroup = {
  id: string;
  label: string;
  memberIds: string[];
  palette: InlinePalette;
};

export const LETTER_CHIP_GROUPS: LetterChipGroup[] = [
  { id: "aleph", label: "א", memberIds: ["aleph"], palette: createPalette("#FFECB3") },
  { id: "bet", label: "ב", memberIds: ["bet"], palette: createPalette("#C5CAE9") },
  { id: "gimel", label: "ג", memberIds: ["gimel"], palette: createPalette("#B2DFDB") },
  { id: "dalet", label: "ד", memberIds: ["dalet"], palette: createPalette("#FFCDD2") },
  { id: "he", label: "ה", memberIds: ["he"], palette: createPalette("#FFF9C4") },
  { id: "vav", label: "ו", memberIds: ["vav"], palette: createPalette("#B3E5FC") },
  { id: "zayin", label: "ז", memberIds: ["zayin"], palette: createPalette("#C8E6C9") },
  { id: "het", label: "ח", memberIds: ["het"], palette: createPalette("#F8BBD0") },
  { id: "tet", label: "ט", memberIds: ["tet"], palette: createPalette("#E1BEE7") },
  { id: "yod", label: "י", memberIds: ["yod"], palette: createPalette("#DCEDC8") },
  { id: "kaf-group", label: "כ ך", memberIds: ["kaf", "final-kaf"], palette: createPalette("#D1C4E9") },
  { id: "lamed", label: "ל", memberIds: ["lamed"], palette: createPalette("#BBDEFB") },
  { id: "mem-group", label: "מ ם", memberIds: ["mem", "final-mem"], palette: createPalette("#F0F4C3") },
  { id: "nun-group", label: "נ ן", memberIds: ["nun", "final-nun"], palette: createPalette("#FFE0B2") },
  { id: "samekh", label: "ס", memberIds: ["samekh"], palette: createPalette("#FFEB3B") },
  { id: "ayin", label: "ע", memberIds: ["ayin"], palette: createPalette("#CFD8DC") },
  { id: "pe", label: "פ", memberIds: ["pe"], palette: createPalette("#FFD54F") },
  { id: "tsadi-group", label: "צ ץ", memberIds: ["tsadi", "final-tsadi"], palette: createPalette("#4FC3F7") },
  { id: "qof", label: "ק", memberIds: ["qof"], palette: createPalette("#9575CD", "#FFFFFF") },
  { id: "resh", label: "ר", memberIds: ["resh"], palette: createPalette("#90A4AE") },
  { id: "shin-sin-group", label: "שׂ שׁ", memberIds: ["sin", "shin"], palette: createPalette("#FF9800") },
  { id: "tav", label: "ת", memberIds: ["tav"], palette: createPalette("#64B5F6") },
];

const transliterationPatterns: TransliterationPattern[] = [
  { text: "kh", soundId: "kh-ch" },
  { text: "ch", soundId: "kh-ch" },
  { text: "sh", soundId: "sh" },
  { text: "ts", soundId: "ts" },
  { text: "q", soundId: "k-q" },
  { text: "k", soundId: "k-q" },
  { text: "s", soundId: "s" },
  { text: "z", soundId: "z" },
  { text: "g", soundId: "g" },
  { text: "h", soundId: "h" },
  { text: "d", soundId: "d" },
  { text: "t", soundId: "t" },
  { text: "n", soundId: "n" },
  { text: "m", soundId: "m" },
  { text: "b", soundId: "b" },
  { text: "v", soundId: "v" },
  { text: "p", soundId: "p" },
  { text: "f", soundId: "f" },
  { text: "l", soundId: "l" },
  { text: "r", soundId: "r" },
  { text: "y", soundId: "y" },
];

const COMBINING_MARK = /\p{M}/u;
const HEBREW_LETTER = /\p{Script=Hebrew}/u;
const DAGESH = "\u05BC";
const SHIN_DOT = "\u05C1";
const SIN_DOT = "\u05C2";

const pushInlineSegment = (
  segments: InlineTextSegment[],
  text: string,
  highlightId?: string,
) => {
  if (!text) {
    return;
  }

  const previous = segments[segments.length - 1];
  if (previous && previous.highlightId === highlightId) {
    previous.text += text;
    return;
  }

  segments.push({ text, highlightId });
};

const getHebrewClusterMetadata = (cluster: string): HebrewClusterMatch => {
  const normalized = cluster.normalize("NFKD");
  let base = "";
  const marks = new Set<string>();

  for (const char of normalized) {
    if (!base && HEBREW_LETTER.test(char)) {
      base = char;
      continue;
    }

    if (COMBINING_MARK.test(char)) {
      marks.add(char);
    }
  }

  const hasDagesh = marks.has(DAGESH);
  const hasShinDot = marks.has(SHIN_DOT);
  const hasSinDot = marks.has(SIN_DOT);

  switch (base) {
    case "א":
      return { text: cluster, letterId: "aleph", soundIds: [] };
    case "ב":
      return {
        text: cluster,
        letterId: "bet",
        soundIds: [hasDagesh ? "b" : "v"],
      };
    case "ג":
      return { text: cluster, letterId: "gimel", soundIds: ["g"] };
    case "ד":
      return { text: cluster, letterId: "dalet", soundIds: ["d"] };
    case "ה":
      return { text: cluster, letterId: "he", soundIds: ["h"] };
    case "ו":
      return { text: cluster, letterId: "vav", soundIds: ["v"] };
    case "ז":
      return { text: cluster, letterId: "zayin", soundIds: ["z"] };
    case "ח":
      return { text: cluster, letterId: "het", soundIds: ["kh-ch"] };
    case "ט":
      return { text: cluster, letterId: "tet", soundIds: ["t"] };
    case "י":
      return { text: cluster, letterId: "yod", soundIds: ["y"] };
    case "כ":
      return {
        text: cluster,
        letterId: "kaf",
        soundIds: [hasDagesh ? "k-q" : "kh-ch"],
      };
    case "ך":
      return {
        text: cluster,
        letterId: "final-kaf",
        soundIds: [hasDagesh ? "k-q" : "kh-ch"],
      };
    case "ל":
      return { text: cluster, letterId: "lamed", soundIds: ["l"] };
    case "מ":
      return { text: cluster, letterId: "mem", soundIds: ["m"] };
    case "ם":
      return { text: cluster, letterId: "final-mem", soundIds: ["m"] };
    case "נ":
      return { text: cluster, letterId: "nun", soundIds: ["n"] };
    case "ן":
      return { text: cluster, letterId: "final-nun", soundIds: ["n"] };
    case "ס":
      return { text: cluster, letterId: "samekh", soundIds: ["s"] };
    case "ע":
      return { text: cluster, letterId: "ayin", soundIds: [] };
    case "פ":
      return {
        text: cluster,
        letterId: "pe",
        soundIds: [hasDagesh ? "p" : "f"],
      };
    case "צ":
      return { text: cluster, letterId: "tsadi", soundIds: ["ts"] };
    case "ץ":
      return { text: cluster, letterId: "final-tsadi", soundIds: ["ts"] };
    case "ק":
      return { text: cluster, letterId: "qof", soundIds: ["k-q"] };
    case "ר":
      return { text: cluster, letterId: "resh", soundIds: ["r"] };
    case "ש":
      return {
        text: cluster,
        letterId: hasSinDot ? "sin" : "shin",
        soundIds: [hasSinDot ? "s" : "sh"],
      };
    case "ת":
      return { text: cluster, letterId: "tav", soundIds: ["t"] };
    default:
      return { text: cluster, soundIds: [] };
  }
};

export const splitTransliterationSegments = (text: string): InlineTextSegment[] => {
  const segments: InlineTextSegment[] = [];
  let index = 0;

  while (index < text.length) {
    const slice = text.slice(index);
    const lowerSlice = slice.toLowerCase();
    const match = transliterationPatterns.find((pattern) =>
      lowerSlice.startsWith(pattern.text),
    );

    if (match) {
      pushInlineSegment(
        segments,
        text.slice(index, index + match.text.length),
        match.soundId,
      );
      index += match.text.length;
      continue;
    }

    pushInlineSegment(segments, text[index]);
    index += 1;
  }

  return segments;
};

export const splitHebrewClusters = (text: string): HebrewClusterMatch[] => {
  const clusters: HebrewClusterMatch[] = [];
  let currentCluster = "";

  const flushCluster = () => {
    if (!currentCluster) {
      return;
    }
    clusters.push(getHebrewClusterMetadata(currentCluster));
    currentCluster = "";
  };

  for (const char of text) {
    if (!currentCluster) {
      currentCluster = char;
      continue;
    }

    if (COMBINING_MARK.test(char)) {
      currentCluster += char;
      continue;
    }

    flushCluster();
    currentCluster = char;
  }

  flushCluster();
  return clusters;
};

export const countSoundOccurrences = (word: WordProps, soundId: string): number => {
  const transliteration = word.wordInformation?.transliteration ?? "";
  if (transliteration) {
    return splitTransliterationSegments(transliteration).filter(
      (segment) => segment.highlightId === soundId,
    ).length;
  }

  const hebrew = word.wordInformation?.hebrew || word.wlcWord || "";
  return splitHebrewClusters(hebrew).filter((cluster) =>
    cluster.soundIds.includes(soundId),
  ).length;
};

export const countLetterOccurrences = (word: WordProps, letterId: string): number => {
  const hebrew = word.wordInformation?.hebrew || word.wlcWord || "";
  return splitHebrewClusters(hebrew).filter(
    (cluster) => cluster.letterId === letterId,
  ).length;
};

export const wordContainsSound = (word: WordProps, soundId: string): boolean =>
  countSoundOccurrences(word, soundId) > 0;

export const wordContainsLetter = (word: WordProps, letterId: string): boolean =>
  countLetterOccurrences(word, letterId) > 0;

export const buildHighlightedTransliterationSegments = (
  text: string,
  selectedSoundIds: Set<string>,
): InlineTextSegment[] =>
  splitTransliterationSegments(text).map((segment) =>
    segment.highlightId && selectedSoundIds.has(segment.highlightId)
      ? segment
      : { text: segment.text },
  );

export const buildHighlightedHebrewSegments = (
  text: string,
  selectedSoundIds: Set<string>,
  selectedLetterIds: Set<string>,
): InlineTextSegment[] => {
  const segments: InlineTextSegment[] = [];

  splitHebrewClusters(text).forEach((cluster) => {
    const soundMatch = cluster.soundIds.find((soundId) => selectedSoundIds.has(soundId));
    if (soundMatch) {
      pushInlineSegment(segments, cluster.text, soundMatch);
      return;
    }

    if (cluster.letterId && selectedLetterIds.has(cluster.letterId)) {
      pushInlineSegment(segments, cluster.text, cluster.letterId);
      return;
    }

    pushInlineSegment(segments, cluster.text);
  });

  return segments;
};
