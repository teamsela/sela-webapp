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
  occurrences?: number;
};

const createPalette = (fill: string, text = DEFAULT_TEXT_COLOR): InlinePalette => ({
  fill,
  border: DEFAULT_BORDER_COLOR,
  text,
});

const SOUND_PALETTES = {
  s: createPalette("#FFF176"),
  sh: createPalette("#FFD54F"),
  ts: createPalette("#FFB74D"),
  z: createPalette("#FF9800"),
  h: createPalette("#E1BEE7"),
  "kh-ch": createPalette("#CE93D8"),
  "k-q": createPalette("#BA68C8"),
  g: createPalette("#AB47BC"),
  d: createPalette("#81C784"),
  t: createPalette("#388E3C", "#FFFFFF"),
  n: createPalette("#EF9A9A"),
  m: createPalette("#F44336", "#FFFFFF"),
  v: createPalette("#A1887F", "#FFFFFF"),
  b: createPalette("#795548", "#FFFFFF"),
  f: createPalette("#969696", "#FFFFFF"),
  p: createPalette("#616161", "#FFFFFF"),
  y: createPalette("#B3E5FC"),
  r: createPalette("#64B5F6"),
  l: createPalette("#2196F3", "#FFFFFF"),
};

const LETTER_ONLY_PALETTES = {
  aleph: createPalette("#E3E6F7"),
  ayin: createPalette("#C5CAE9"),
  vav: createPalette("#D7CCC8"),
};

export const SOUND_CHIPS: SoundChip[] = [
  { id: "s", label: "s", palette: SOUND_PALETTES.s },
  { id: "sh", label: "sh", palette: SOUND_PALETTES.sh },
  { id: "ts", label: "ts", palette: SOUND_PALETTES.ts },
  { id: "z", label: "z", palette: SOUND_PALETTES.z },
  { id: "h", label: "h", palette: SOUND_PALETTES.h },
  { id: "kh-ch", label: "kh/ ch", palette: SOUND_PALETTES["kh-ch"] },
  { id: "k-q", label: "k/ q", palette: SOUND_PALETTES["k-q"] },
  { id: "g", label: "g", palette: SOUND_PALETTES.g },
  { id: "d", label: "d", palette: SOUND_PALETTES.d },
  { id: "t", label: "t", palette: SOUND_PALETTES.t },
  { id: "n", label: "n", palette: SOUND_PALETTES.n },
  { id: "m", label: "m", palette: SOUND_PALETTES.m },
  { id: "v", label: "v", palette: SOUND_PALETTES.v },
  { id: "b", label: "b", palette: SOUND_PALETTES.b },
  { id: "f", label: "f", palette: SOUND_PALETTES.f },
  { id: "p", label: "p", palette: SOUND_PALETTES.p },
  { id: "y", label: "y", palette: SOUND_PALETTES.y },
  { id: "r", label: "r", palette: SOUND_PALETTES.r },
  { id: "l", label: "l", palette: SOUND_PALETTES.l },
];

export const LETTER_CHIPS: LetterChip[] = [
  // Each letter uses the color of the sound it makes (matching Sound Distribution palette, page_17.png)
  { id: "aleph", label: "א", palette: LETTER_ONLY_PALETTES.aleph },
  { id: "bet", label: "ב", palette: SOUND_PALETTES.b },
  { id: "gimel", label: "ג", palette: SOUND_PALETTES.g },
  { id: "dalet", label: "ד", palette: SOUND_PALETTES.d },
  { id: "he", label: "ה", palette: SOUND_PALETTES.h },
  { id: "vav", label: "ו", palette: LETTER_ONLY_PALETTES.vav },
  { id: "zayin", label: "ז", palette: SOUND_PALETTES.z },
  { id: "het", label: "ח", palette: SOUND_PALETTES["kh-ch"] },
  { id: "tet", label: "ט", palette: SOUND_PALETTES.t },
  { id: "yod", label: "י", palette: SOUND_PALETTES.y },
  { id: "kaf", label: "כ", palette: SOUND_PALETTES["kh-ch"] },
  { id: "final-kaf", label: "ך", palette: SOUND_PALETTES["kh-ch"] },
  { id: "lamed", label: "ל", palette: SOUND_PALETTES.l },
  { id: "mem", label: "מ", palette: SOUND_PALETTES.m },
  { id: "final-mem", label: "ם", palette: SOUND_PALETTES.m },
  { id: "nun", label: "נ", palette: SOUND_PALETTES.n },
  { id: "final-nun", label: "ן", palette: SOUND_PALETTES.n },
  { id: "samekh", label: "ס", palette: SOUND_PALETTES.s },
  { id: "ayin", label: "ע", palette: LETTER_ONLY_PALETTES.ayin },
  { id: "pe", label: "פ", palette: SOUND_PALETTES.p },
  { id: "final-pe", label: "ף", palette: SOUND_PALETTES.p },
  { id: "tsadi", label: "צ", palette: SOUND_PALETTES.ts },
  { id: "final-tsadi", label: "ץ", palette: SOUND_PALETTES.ts },
  { id: "qof", label: "ק", palette: SOUND_PALETTES["k-q"] },
  { id: "resh", label: "ר", palette: SOUND_PALETTES.r },
  { id: "sin", label: "שׂ", palette: SOUND_PALETTES.s },
  { id: "shin", label: "שׁ", palette: SOUND_PALETTES.sh },
  { id: "tav", label: "ת", palette: SOUND_PALETTES.t },
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

const createLetterChipGroup = (
  id: string,
  label: string,
  memberIds: string[],
  paletteSourceId = memberIds[0],
): LetterChipGroup => {
  const palette = LETTER_CHIP_MAP.get(paletteSourceId)?.palette;
  if (!palette) {
    throw new Error(`Unknown letter palette source: ${paletteSourceId}`);
  }
  return { id, label, memberIds, palette };
};

export const LETTER_CHIP_GROUPS: LetterChipGroup[] = [
  createLetterChipGroup("aleph", "א", ["aleph"]),
  createLetterChipGroup("bet", "ב", ["bet"]),
  createLetterChipGroup("gimel", "ג", ["gimel"]),
  createLetterChipGroup("dalet", "ד", ["dalet"]),
  createLetterChipGroup("he", "ה", ["he"]),
  createLetterChipGroup("vav", "ו", ["vav"]),
  createLetterChipGroup("zayin", "ז", ["zayin"]),
  createLetterChipGroup("het", "ח", ["het"]),
  createLetterChipGroup("tet", "ט", ["tet"]),
  createLetterChipGroup("yod", "י", ["yod"]),
  createLetterChipGroup("kaf-group", "כ ך", ["kaf", "final-kaf"]),
  createLetterChipGroup("lamed", "ל", ["lamed"]),
  createLetterChipGroup("mem-group", "מ ם", ["mem", "final-mem"]),
  createLetterChipGroup("nun-group", "נ ן", ["nun", "final-nun"]),
  createLetterChipGroup("samekh", "ס", ["samekh"]),
  createLetterChipGroup("ayin", "ע", ["ayin"]),
  createLetterChipGroup("pe-group", "פ ף", ["pe", "final-pe"]),
  createLetterChipGroup("tsadi-group", "צ ץ", ["tsadi", "final-tsadi"]),
  createLetterChipGroup("qof", "ק", ["qof"]),
  createLetterChipGroup("resh", "ר", ["resh"]),
  createLetterChipGroup("shin-sin-group", "שׂ שׁ", ["sin", "shin"], "shin"),
  createLetterChipGroup("tav", "ת", ["tav"]),
];

const FINAL_FORM_GROUPS = LETTER_CHIP_GROUPS.filter((group) =>
  group.memberIds.some((id) => id.startsWith("final-")),
);

const FINAL_FORM_TO_BASE = new Map(
  FINAL_FORM_GROUPS.flatMap((group) => {
    const baseId = group.memberIds.find((id) => !id.startsWith("final-"));
    return baseId
      ? group.memberIds
          .filter((id) => id.startsWith("final-"))
          .map((finalId) => [finalId, baseId] as const)
      : [];
  }),
);

const BASE_TO_FINAL_FORMS = new Map(
  FINAL_FORM_GROUPS.flatMap((group) => {
    const baseId = group.memberIds.find((id) => !id.startsWith("final-"));
    return baseId ? [[baseId, group.memberIds] as const] : [];
  }),
);

export const normalizeHebrewLetterId = (letterId: string): string =>
  FINAL_FORM_TO_BASE.get(letterId) ?? letterId;

export const expandHebrewLetterIds = (letterIds: string[]): string[] => {
  const expanded = new Set<string>();
  letterIds.forEach((letterId) => {
    (BASE_TO_FINAL_FORMS.get(letterId) ?? [letterId]).forEach((memberId) =>
      expanded.add(memberId),
    );
  });
  return [...expanded];
};

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
    if (highlightId) {
      previous.occurrences = (previous.occurrences ?? 0) + 1;
    }
    return;
  }

  segments.push(
    highlightId
      ? { text, highlightId, occurrences: 1 }
      : { text },
  );
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
    case "ף":
      return {
        text: cluster,
        letterId: "final-pe",
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
