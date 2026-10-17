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
  { id: "h", label: "h", palette: createPalette("#E1BEE7") },          // light purple/lilac
  { id: "kh-ch", label: "kh/ ch", palette: createPalette("#CE93D8") },  // lavender
  { id: "k-q", label: "k/ q", palette: createPalette("#BA68C8") },     // medium purple
  { id: "g", label: "g", palette: createPalette("#AB47BC") },          // purple
  { id: "d", label: "d", palette: createPalette("#81C784") },          // light green
  { id: "t", label: "t", palette: createPalette("#388E3C", "#FFFFFF") }, // dark green
  { id: "n", label: "n", palette: createPalette("#EF9A9A") },          // light red/pink
  { id: "m", label: "m", palette: createPalette("#F44336", "#FFFFFF") }, // red
  { id: "v", label: "v", palette: createPalette("#A1887F", "#FFFFFF") }, // medium brown
  { id: "b", label: "b", palette: createPalette("#795548", "#FFFFFF") }, // brown
  { id: "f", label: "f", palette: createPalette("#969696", "#FFFFFF") }, // medium gray
  { id: "p", label: "p", palette: createPalette("#616161", "#FFFFFF") }, // dark gray
  { id: "y", label: "y", palette: createPalette("#B3E5FC") },          // very light blue
  { id: "r", label: "r", palette: createPalette("#64B5F6") },          // lighter blue
  { id: "l", label: "l", palette: createPalette("#2196F3", "#FFFFFF") }, // blue
];

export const LETTER_CHIPS: LetterChip[] = [
  // Each letter uses the color of the sound it makes (matching Sound Distribution palette, page_17.png)
  { id: "aleph", label: "א", palette: createPalette("#E3E6F7") },                    // silent
  { id: "bet", label: "ב", palette: createPalette("#795548", "#FFFFFF") },           // b sound
  { id: "gimel", label: "ג", palette: createPalette("#AB47BC") },                    // g sound
  { id: "dalet", label: "ד", palette: createPalette("#81C784") },                    // d sound
  { id: "he", label: "ה", palette: createPalette("#E1BEE7") },                       // h sound
  { id: "vav", label: "ו", palette: createPalette("#D7CCC8") },                      // v sound
  { id: "zayin", label: "ז", palette: createPalette("#FF9800") },                    // z sound
  { id: "het", label: "ח", palette: createPalette("#CE93D8") },                      // kh/ch sound
  { id: "tet", label: "ט", palette: createPalette("#388E3C", "#FFFFFF") },           // t sound
  { id: "yod", label: "י", palette: createPalette("#B3E5FC") },                      // y sound
  { id: "kaf", label: "כ", palette: createPalette("#CE93D8") },                      // kh/ch sound (most common without dagesh)
  { id: "final-kaf", label: "ך", palette: createPalette("#CE93D8") },               // kh/ch sound (same as kaf)
  { id: "lamed", label: "ל", palette: createPalette("#2196F3", "#FFFFFF") },         // l sound
  { id: "mem", label: "מ", palette: createPalette("#F44336", "#FFFFFF") },           // m sound
  { id: "final-mem", label: "ם", palette: createPalette("#F44336", "#FFFFFF") },     // m sound (same as mem)
  { id: "nun", label: "נ", palette: createPalette("#EF9A9A") },                      // n sound
  { id: "final-nun", label: "ן", palette: createPalette("#EF9A9A") },               // n sound (same as nun)
  { id: "samekh", label: "ס", palette: createPalette("#FFF176") },                   // s sound
  { id: "ayin", label: "ע", palette: createPalette("#C5CAE9") },                     // silent
  { id: "pe", label: "פ", palette: createPalette("#616161", "#FFFFFF") },            // p sound
  { id: "tsadi", label: "צ", palette: createPalette("#FFB74D") },                    // ts sound
  { id: "final-tsadi", label: "ץ", palette: createPalette("#FFB74D") },              // ts sound (same as tsadi)
  { id: "qof", label: "ק", palette: createPalette("#BA68C8") },                      // k/q sound
  { id: "resh", label: "ר", palette: createPalette("#64B5F6") },                     // r sound
  { id: "sin", label: "שׂ", palette: createPalette("#FFF176") },                     // s sound
  { id: "shin", label: "שׁ", palette: createPalette("#FFD54F") },                    // sh sound
  { id: "tav", label: "ת", palette: createPalette("#388E3C", "#FFFFFF") },           // t sound
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
  { id: "aleph", label: "א", memberIds: ["aleph"], palette: createPalette("#E3E6F7") },                                     // silent
  { id: "bet", label: "ב", memberIds: ["bet"], palette: createPalette("#795548", "#FFFFFF") },                              // b sound
  { id: "gimel", label: "ג", memberIds: ["gimel"], palette: createPalette("#AB47BC") },                                     // g sound
  { id: "dalet", label: "ד", memberIds: ["dalet"], palette: createPalette("#81C784") },                                     // d sound
  { id: "he", label: "ה", memberIds: ["he"], palette: createPalette("#E1BEE7") },                                           // h sound
  { id: "vav", label: "ו", memberIds: ["vav"], palette: createPalette("#D7CCC8") },                                         // v sound
  { id: "zayin", label: "ז", memberIds: ["zayin"], palette: createPalette("#FF9800") },                                     // z sound
  { id: "het", label: "ח", memberIds: ["het"], palette: createPalette("#CE93D8") },                                         // kh/ch sound
  { id: "tet", label: "ט", memberIds: ["tet"], palette: createPalette("#388E3C", "#FFFFFF") },                              // t sound
  { id: "yod", label: "י", memberIds: ["yod"], palette: createPalette("#B3E5FC") },                                         // y sound
  { id: "kaf-group", label: "כ ך", memberIds: ["kaf", "final-kaf"], palette: createPalette("#CE93D8") },                   // kh/ch sound (most common for kaf)
  { id: "lamed", label: "ל", memberIds: ["lamed"], palette: createPalette("#2196F3", "#FFFFFF") },                          // l sound
  { id: "mem-group", label: "מ ם", memberIds: ["mem", "final-mem"], palette: createPalette("#F44336", "#FFFFFF") },         // m sound
  { id: "nun-group", label: "נ ן", memberIds: ["nun", "final-nun"], palette: createPalette("#EF9A9A") },                    // n sound
  { id: "samekh", label: "ס", memberIds: ["samekh"], palette: createPalette("#FFF176") },                                   // s sound
  { id: "ayin", label: "ע", memberIds: ["ayin"], palette: createPalette("#C5CAE9") },                                       // silent
  { id: "pe", label: "פ", memberIds: ["pe"], palette: createPalette("#616161", "#FFFFFF") },                                // p sound
  { id: "tsadi-group", label: "צ ץ", memberIds: ["tsadi", "final-tsadi"], palette: createPalette("#FFB74D") },              // ts sound
  { id: "qof", label: "ק", memberIds: ["qof"], palette: createPalette("#BA68C8") },                                         // k/q sound
  { id: "resh", label: "ר", memberIds: ["resh"], palette: createPalette("#64B5F6") },                                       // r sound
  { id: "shin-sin-group", label: "שׂ שׁ", memberIds: ["sin", "shin"], palette: createPalette("#FFD54F") },                  // sh/s sound (sin first per spec)
  { id: "tav", label: "ת", memberIds: ["tav"], palette: createPalette("#388E3C", "#FFFFFF") },                              // t sound
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
  { text: "ph", soundId: "f" },  // פ without dagesh
  { text: "p", soundId: "p" },
  { text: "f", soundId: "f" },
  { text: "l", soundId: "l" },
  { text: "r", soundId: "r" },
  { text: "y", soundId: "y" },
];

const COMBINING_MARK = /\p{M}/u;
const HEBREW_LETTER = /\p{Script=Hebrew}/u;
const DAGESH = "\u05BC";
const HOLAM = "\u05B9";
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
    case "ו": {
      // Vav with holam (וֹ \u05B9) = "o" vowel; with dagesh/shuruk (וּ \u05BC) = "u" vowel.
      // In both cases vav is a vowel carrier and makes no consonant sound.
      // Only bare vav (no holam, no shuruk) is the "v" consonant.
      const isVowelCarrier = marks.has(HOLAM) || marks.has(DAGESH);
      return { text: cluster, letterId: "vav", soundIds: isVowelCarrier ? [] : ["v"] };
    }
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
  // Use passage transliteration (heb_bible form with prefixes/suffixes) so the count
  // matches the highlights visible in transliteration mode.
  const transliteration = word.passageTransliteration || word.wordInformation?.transliteration || "";
  if (transliteration) {
    return splitTransliterationSegments(transliteration).filter(
      (segment) => segment.highlightId === soundId,
    ).length;
  }

  const hebrew = word.wlcWord || "";
  return splitHebrewClusters(hebrew).filter((cluster) =>
    cluster.soundIds.includes(soundId),
  ).length;
};

export const countLetterOccurrences = (word: WordProps, letterId: string): number => {
  // Use wlcWord (heb_bible passage form) so the count matches the highlights
  // visible in Hebrew mode, including all prefixes and suffixes.
  const hebrew = word.wlcWord || "";
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
