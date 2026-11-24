import { ColorData, PassageProps, StropheProps, WordProps, StudyMetadata, WordMetadata } from "./data";
import { psalmBook, genesisBook, isaiahBook, jonahBook, proverbsBook, ecclesiastesBook, songsBook, exodusBook, leviticusBook, numbersBook, deuteronomyBook, joshuaBook, judgesBook, ruthBook, firstSamuelBook, secondSamuelBook, firstKingsBook, secondKingsBook, firstChroniclesBook, secondChroniclesBook, ezraBook, nehemiahBook, estherBook, jobBook, jeremiahBook, lamentationsBook, ezekielBook, danielBook, hoseaBook, joelBook, amosBook, obadiahBook, micahBook, nahumBook, habakkukBook, zephaniahBook, haggaiBook, zechariahBook, malachiBook } from "./chapterCounts";
import { ColorActionType, StropheNote } from "./types";
import { z } from 'zod';

const otBookSchema = z.enum(['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 
  'joshua', 'judges', 'ruth', '1 samuel', '2 samuel', 
  '1 kings', '2 kings', '1 chronicles', '2 chronicles', 
  'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs', 
  'ecclesiastes', 'songs', 'isaiah', 'jeremiah', 'lamentations', 
  'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 
  'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi'])

export type PassageInfo = {
    book: string|null|undefined,
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
};

export function parsePassageInfo(inputString: string, bookString: string) : PassageInfo | Error {
  const book = otBookSchema.parse(bookString);
  const passageFormatRegex = /^(\d+)(:(\d+))?(-(\d+)(:(\d+))?)?$/;
  const normalizedInput = inputString.trim();
  const match = normalizedInput.match(passageFormatRegex);

  if (!match) {
    return Error("Type in passage, e.g.: '23' or '48:1-4'");
  }

  const [, strStartChapter, , strStartVerse, , strEndChapter, , strEndVerse] = match;
  const bookMap = {
    genesis: genesisBook,
    exodus: exodusBook,
    leviticus: leviticusBook,
    numbers: numbersBook,
    deuteronomy: deuteronomyBook,
    joshua: joshuaBook,
    judges: judgesBook,
    ruth: ruthBook,
    '1 samuel': firstSamuelBook,
    '2 samuel': secondSamuelBook,
    '1 kings': firstKingsBook,
    '2 kings': secondKingsBook,
    '1 chronicles': firstChroniclesBook,
    '2 chronicles': secondChroniclesBook,
    ezra: ezraBook,
    nehemiah: nehemiahBook,
    esther: estherBook,
    job: jobBook,
    psalms: psalmBook,
    proverbs: proverbsBook,
    ecclesiastes: ecclesiastesBook,
    songs: songsBook,
    isaiah: isaiahBook,
    jeremiah: jeremiahBook,
    lamentations: lamentationsBook,
    ezekiel: ezekielBook,
    daniel: danielBook,
    hosea: hoseaBook,
    joel: joelBook,
    amos: amosBook,
    obadiah: obadiahBook,
    jonah: jonahBook,
    micah: micahBook,
    nahum: nahumBook,
    habakkuk: habakkukBook,
    zephaniah: zephaniahBook,
    haggai: haggaiBook,
    zechariah: zechariahBook,
    malachi: malachiBook
  }[book];
  const startChapter = parseInt(strStartChapter, 10);
  const startChapterVerseCount = bookMap[startChapter];

  if (startChapter <= 0 || startChapterVerseCount === undefined) {
    return Error("Invalid Chapter");
  }

  let startVerse = strStartVerse ? parseInt(strStartVerse, 10) : 1;
  let endChapter = startChapter;
  let endVerse = strStartVerse ? startVerse : startChapterVerseCount;

  if (!strEndChapter) {
    if (!strStartVerse) {
      endVerse = startChapterVerseCount;
    }
  } else {
    const rawEndNumber = parseInt(strEndChapter, 10);

    if (!strStartVerse && !strEndVerse) {
      endChapter = rawEndNumber;
      const endChapterVerseCount = bookMap[endChapter];
      if (endChapter <= 0 || endChapterVerseCount === undefined) {
        return Error("Invalid Chapter");
      }
      startVerse = 1;
      endVerse = endChapterVerseCount;
    } else if (!strStartVerse && strEndVerse) {
      endChapter = rawEndNumber;
      const endChapterVerseCount = bookMap[endChapter];
      if (endChapter <= 0 || endChapterVerseCount === undefined) {
        return Error("Invalid Chapter");
      }
      startVerse = 1;
      endVerse = parseInt(strEndVerse, 10);
    } else if (strStartVerse && strEndVerse) {
      endChapter = rawEndNumber;
      const endChapterVerseCount = bookMap[endChapter];
      if (endChapter <= 0 || endChapterVerseCount === undefined) {
        return Error("Invalid Chapter");
      }
      endVerse = parseInt(strEndVerse, 10);
    } else {
      // With a start verse and no explicit end verse (e.g. "2:10-3"), infer
      // chapter range when the trailing number cannot be a valid same-chapter
      // end verse.
      const treatAsChapter =
        rawEndNumber > startChapterVerseCount || rawEndNumber < startVerse;
      if (treatAsChapter) {
        endChapter = rawEndNumber;
        const endChapterVerseCount = bookMap[endChapter];
        if (endChapter <= 0 || endChapterVerseCount === undefined) {
          return Error("Invalid Chapter");
        }
        endVerse = endChapterVerseCount;
      } else {
        endVerse = rawEndNumber;
      }
    }
  }

  const result: PassageInfo = {
    book: bookString,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  };

  const endChapterVerseCount = bookMap[result.endChapter];

  if (!endChapterVerseCount) {
    return Error("Invalid Chapter");
  } else if (result.endChapter < result.startChapter) {
    return Error("End chapter must be greater than or equal to start chapter");
  } else if (result.startVerse <= 0 || result.startVerse > startChapterVerseCount) {
    return Error(
      "Invalid start verse: Chapter " +
        result.startChapter +
        " only has " +
        startChapterVerseCount +
        " verses"
    );
  } else if (
    result.endVerse <= 0 ||
    (result.startChapter === result.endChapter && result.startVerse > result.endVerse) ||
    result.endVerse > endChapterVerseCount
  ) {
    return Error("Invalid end verse");
  }

  return result;
}

const HEBREW_LETTERS = /[^\u05D0-\u05EA]/g;

/**
 * The group a word belongs to for "repeated" words in a passage:
 * - its root group (motifData.root) when it has one,
 * - otherwise its Strong's number (particles, proper names, unrooted words: exact match),
 * - otherwise (untagged words such as לוֹ) its consonantal spelling.
 * Proper names never join a root group; God's name (יהוה, יָהּ) is one group of its own.
 */
export function wordGroupKey(word: WordProps): string | undefined {
  if (word.motifData?.root) {
    return word.motifData.root.id;
  }
  if (word.strongNumber) {
    return `s${word.strongNumber}`;
  }
  const consonants = (word.wlcWord || "").replace(HEBREW_LETTERS, "");
  return consonants ? `w${consonants}` : undefined;
}

const CANTILLATION = /[֑-ֽ֯׀׃־]/g; // accents, meteg, paseq, sof pasuq, maqaf

export type GroupLabel = {
  /** Hebrew chip text, unpointed so it names the root and its family rather than one word:
   *  the root letters (ישׁב), or the letters of the word for exact-match groups (כי) */
  hebrew: string;
  /** English chip text: the root's sense, or the word's gloss */
  english: string;
  /** BDB homonym numeral, used only to tell apart chips that would otherwise look the same */
  homonym?: string;
  /** A pointed word from the group for the tooltip (יָשַׁב, דִּבֵּר, כִּי) */
  word?: string;
};

/** Removes vowel points, dagesh and accents, keeping the letters and the shin/sin dot (שׁ/שׂ). */
export function unpointed(hebrew: string): string {
  return hebrew
    .normalize("NFD")
    .replace(/[\u0591-\u05BD\u05BF\u05C4\u05C5\u05C7\u034F]/g, "") // \u034F: joiner in some source words
    .replace(/\u05C0|\u05C3|\u05BE/g, "")
    .normalize("NFC")
    .trim();
}

/**
 * Concise STEP Bible gloss ("heart", "servant") of the most frequent word in the group,
 * counting only words that satisfy `include`.
 */
/**
 * Divine names are shown in English by their Hebrew name rather than a translation
 * ("Yahweh", not "LORD"), to point readers to the original.
 */
const DIVINE_NAME_ENGLISH: Record<number, string> = {
  3068: "Yahweh", // יהוה
  3050: "Yahweh", // יָהּ
  3069: "Yahweh", // יֱהוִה
  430: "Elohim", // אֱלֹהִים
  410: "El", // אֵל
  433: "Eloah", // אֱלוֹהַּ
  426: "Elah", // Aramaic אֱלָהּ
  136: "Adonai", // אֲדֹנָי
};

function passageGloss(words: WordProps[], include: (w: WordProps) => boolean): string | undefined {
  const byStrong = new Map<number, { count: number; gloss: string }>();
  words.filter(include).forEach((w) => {
    const gloss = DIVINE_NAME_ENGLISH[w.strongNumber] ?? w.wordInformation?.gloss?.trim();
    if (!gloss) return;
    const entry = byStrong.get(w.strongNumber) ?? { count: 0, gloss };
    entry.count += 1;
    byStrong.set(w.strongNumber, entry);
  });
  return Array.from(byStrong.values()).sort((a, b) => b.count - a.count)[0]?.gloss;
}

/** Chip label for a repeated-word group (see wordGroupKey). */
export function groupLabel(groupKey: string, words: WordProps[]): GroupLabel {
  const lead = words[0];
  if (groupKey.startsWith("r")) {
    const root = words.map((w) => w.motifData?.root).find((r) => r?.id === groupKey);
    if (root) {
      const english = passageGloss(words, (w) => w.motifData?.root?.id === groupKey) || root.gloss || root.label;
      return { hebrew: root.letters || unpointed(root.label), english, homonym: root.homonym, word: root.label };
    }
  }
  const motif = lead?.motifData;
  const word = (motif?.lemma || lead?.wlcWord || "").replace(CANTILLATION, "").trim();
  const english = passageGloss(words, () => true) || motif?.lemmaGloss || lead?.ETCBCgloss?.trim() || lead?.gloss || word;
  return { hebrew: unpointed(word), english, word };
}

/**
 * When two chips in the same panel would read the same (e.g. ענה "answer" and ענה "sing" both
 * appear), add the homonym numeral to the Hebrew label and the root sense to tell them apart.
 */
export function disambiguateGroupLabels(labels: GroupLabel[]): GroupLabel[] {
  // compare Hebrew by letters only (shin/sin dots aside), so labels of homonymous roots collide
  const letters = (s: string) => s.replace(HEBREW_LETTERS, "");
  const hebrewCounts = new Map<string, number>();
  const englishCounts = new Map<string, number>();
  labels.forEach((l) => {
    hebrewCounts.set(letters(l.hebrew), (hebrewCounts.get(letters(l.hebrew)) ?? 0) + 1);
    englishCounts.set(l.english, (englishCounts.get(l.english) ?? 0) + 1);
  });
  return labels.map((l) => ({
    ...l,
    hebrew: (hebrewCounts.get(letters(l.hebrew)) ?? 0) > 1 && l.homonym ? `${l.hebrew} ${l.homonym}` : l.hebrew,
    english: (englishCounts.get(l.english) ?? 0) > 1 && l.hebrew !== l.english ? `${l.english} (${l.hebrew})` : l.english,
  }));
}

/** Map of group key (see wordGroupKey) to the passage's words in that group, in passage order. */
export function extractIdenticalWordsFromPassage(passageProps: PassageProps): Map<string, WordProps[]> {
  const groups = new Map<string, WordProps[]>();
  passageProps.stanzaProps.forEach((stanza) => {
    stanza.strophes.forEach((strophe) => {
      strophe.lines.forEach((line) => {
        line.words.forEach((word) => {
          const key = wordGroupKey(word);
          if (!key) return;
          const group = groups.get(key);
          if (group) group.push(word);
          else groups.set(key, [word]);
        });
      });
    });
  });
  return groups;
}

/** All words in the same group as `word` (including itself), in passage order. */
export function wordsInSameGroups(word: WordProps, groups: Map<string, WordProps[]>): WordProps[] {
  const key = wordGroupKey(word);
  return key ? [...(groups.get(key) ?? [word])] : [word];
}

function measureStringWidth(context: CanvasRenderingContext2D, text: string): number {
  // Measure the width of the text
  const metrics = context.measureText(text);
  
  // Return the width
  return metrics.width;
}

// Function to break a string into lines under a fixed width constraint
export function wrapText(
  text: string,
  context: CanvasRenderingContext2D,
  maxWidth: number
): number {
  
  // Split the text by spaces to form words
  const words = text.split(/[\s-]+/);
  let lineCount : number = 0;
  let currentLine = '';
  
  // Iterate over words
  for (const word of words) {
    const testLine = currentLine + (currentLine === '' ? '' : ' ') + word;
    
    // Measure the width of the test line
    const testLineWidth = measureStringWidth(context, testLine);    

    // Check if the test line width is within the max width constraint
    if (testLineWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      // If the test line is too wide, add the current line to the lines array
      lineCount++;

      // Start a new line with the current word
      currentLine = word;
    }
  }
  
  // Add the last line
  if (currentLine) {
    lineCount++;
    (measureStringWidth(context, currentLine) >= maxWidth) && lineCount++;
  }
  
  return lineCount;
}

export function getWordById(passage: PassageProps, id: number) : WordProps | null {
  for (let stanza of passage.stanzaProps) {
    for (let strophe of stanza.strophes) {
      for (let line of strophe.lines) {
        for (let word of line.words) {
          if (word.wordId === id) {
            return word;
          }
        }
      }
    }
  }
  return null;
}

type UniformPaletteOptions = {
  colorMap?: Map<number, ColorData>;
  metadataMap?: Record<number, WordMetadata | undefined> | Record<string, WordMetadata | undefined>;
};

const resolveWordColorValue = (
  word: WordProps,
  key: keyof Omit<ColorData, "source">,
  options?: UniformPaletteOptions,
): string | undefined => {
  const colorFromMap = options?.colorMap?.get(word.wordId)?.[key];
  if (colorFromMap !== undefined) {
    return colorFromMap;
  }

  const metadataMap = options?.metadataMap as
    | Record<number, WordMetadata | undefined>
    | Record<string, WordMetadata | undefined>
    | undefined;

  if (metadataMap) {
    const metadataEntry =
      (metadataMap as Record<number, WordMetadata | undefined>)[word.wordId] ??
      (metadataMap as Record<string, WordMetadata | undefined>)[word.wordId.toString()];
    // An explicit map is authoritative after Clear, even if embedded word data is stale.
    return metadataEntry?.color?.[key];
  }

  return word.metadata?.color?.[key];
};

export const deriveUniformWordPalette = (
  words: WordProps[],
  options?: UniformPaletteOptions,
): Omit<ColorData, "source"> | undefined => {
  if (!words.length) {
    return undefined;
  }

  const palette: Omit<ColorData, "source"> = {};
  let hasColor = false;

  for (const key of ["fill", "border", "text"] as (keyof Omit<ColorData, "source">)[]) {
    let value = resolveWordColorValue(words[0], key, options);
    let isUniform = true;

    for (let i = 1; i < words.length; i++) {
      const current = resolveWordColorValue(words[i], key, options);
      if (current !== value) {
        isUniform = false;
        break;
      }
    }

    if (isUniform && value !== undefined) {
      palette[key] = value;
      hasColor = true;
    }
  }

  return hasColor ? palette : undefined;
};

export const deriveUniformFill = (
  words: WordProps[],
  options?: UniformPaletteOptions,
): string | undefined => {
  if (!words.length) {
    return undefined;
  }

  let value = resolveWordColorValue(words[0], "fill", options);

  for (let i = 1; i < words.length; i++) {
    const current = resolveWordColorValue(words[i], "fill", options);
    if (current !== value) {
      return undefined;
    }
  }

  return value;
};

export function wordsHasSameColor(words: WordProps[], actionType: ColorActionType) : boolean {

  if (words.length <= 1) return true;

  let previousColor : ColorData | undefined = words[0].metadata?.color;

  for (let word of words) {
    switch (actionType) {
      case ColorActionType.colorFill:
        if (word.metadata?.color?.fill != previousColor?.fill) { return false; }
        break;
      case ColorActionType.borderColor:
        if (word.metadata?.color?.border != previousColor?.border) { return false; }
        break;
      case ColorActionType.textColor:
        if (word.metadata?.color?.text != previousColor?.text) { return false; }
        break;
      default:
        break;
    }
    previousColor = word.metadata?.color;
  }

  return true;
}

export function strophesHasSameColor(strophes: StropheProps[], actionType: ColorActionType) : boolean {

  if (strophes.length <= 1) return true;

  let previousColor : ColorData | undefined = strophes[0].metadata?.color;

  for (let strophe of strophes) {
    switch (actionType) {
      case ColorActionType.colorFill:
        if (strophe.metadata.color?.fill != previousColor?.fill) { return false; }
        break;
      case ColorActionType.borderColor:
        if (strophe.metadata.color?.border != previousColor?.border) { return false; }
        break;
      default:
        break;
    }
    previousColor = strophe.metadata.color;
  }

  return true;
}

export const mergeData = (
  bibleData: WordProps[],
  studyMetadata : StudyMetadata,
  options?: { useSourceStanzaBreaks?: boolean }
) : PassageProps => {

  let passageProps : PassageProps = { stanzaProps: [], stanzaCount: 0, stropheCount: 0 }

  let currentStanzaIdx = -1;
  let currentStropheIdx = -1;
  let runningStropheIdx = -1;
  let currentLineIdx = -1;
  let prevVerseNum = 0;
  // Reader mode: lay the passage out by the Bible's own (BSB) source breaks
  // instead of the user's custom strophe/stanza/line divisions.
  const useReadmeParagraphMode = options?.useSourceStanzaBreaks === true;

  bibleData.forEach((wordProps) => {

    wordProps.firstStropheInStanza = false;
    wordProps.firstWordInStrophe = false;
    wordProps.metadata = {};

    if (studyMetadata?.words) {
      const currentWordStyling = studyMetadata.words[wordProps.wordId];
      if (currentWordStyling !== undefined) {
        wordProps.metadata = currentWordStyling;
      }  
    }

    if (wordProps.metadata?.glossOverride !== undefined) {
      wordProps.gloss = wordProps.metadata.glossOverride;
    }

    let currentStanzaData = passageProps.stanzaProps[currentStanzaIdx];
    // Honor user-defined stanza divisions in BOTH normal and reader mode so the
    // strophe/stanza structure is shared (co-edited) across the two views.
    const startsNewStanza = Boolean(wordProps.metadata?.stanzaDiv);
    if (currentStanzaData === undefined || startsNewStanza) {
      passageProps.stanzaProps.push({stanzaId: ++currentStanzaIdx, strophes:[], metadata: {}});
      currentStanzaData = passageProps.stanzaProps[currentStanzaIdx];

      const currentStanzaStyling = studyMetadata.words?.[wordProps.wordId]?.stanzaMd || undefined;
      if (currentStanzaStyling !== undefined) {
        currentStanzaData.metadata = currentStanzaStyling;
      }

      currentStropheIdx = -1;
      passageProps.stanzaCount++; 
    }

    let currentStropheData = currentStanzaData.strophes[currentStropheIdx];
    // Honor user-defined strophe divisions in both normal and reader mode (see
    // stanza note above).
    const startsNewStrophe = Boolean(wordProps.metadata?.stropheDiv);
    if (currentStropheData === undefined || startsNewStrophe) {
      passageProps.stanzaProps[currentStanzaIdx].strophes.push({stropheId: ++runningStropheIdx, lines: [], metadata: {}});
      ++currentStropheIdx;
      currentStropheData = passageProps.stanzaProps[currentStanzaIdx].strophes[currentStropheIdx];

      const currentStropheStyling = studyMetadata.words?.[wordProps.wordId]?.stropheMd || undefined;
      if (currentStropheStyling !== undefined) {
        currentStropheData.metadata = currentStropheStyling;
      }
      currentLineIdx = -1;
      passageProps.stropheCount++; 

      currentStropheData.firstStropheInStanza = (currentStropheIdx === 0);
      wordProps.firstWordInStrophe = true;      
    } 

    let currentLineData = currentStropheData.lines[currentLineIdx];
    let ignoreNewLine = wordProps.metadata?.ignoreNewLine || false;
    wordProps.newVerse = prevVerseNum !== 0 && prevVerseNum !== wordProps.verse;
    const hasSourceLineBreak = useReadmeParagraphMode ? wordProps.BSBnewLine : wordProps.newLine;
    const hasManualLineBreak = Boolean(wordProps.metadata?.lineBreak);
    // A BSB source stanza break becomes an extra paragraph gap in reader mode,
    // unless the word already begins a user-defined strophe/stanza (whose own
    // spacing takes over) — avoids a redundant blank line.
    const startsNewParagraph = useReadmeParagraphMode
      && !ignoreNewLine
      && Boolean(wordProps.BSBstanzaBreak)
      && currentLineData !== undefined
      && currentLineData.words.length > 0
      && !startsNewStrophe
      && !startsNewStanza;
    if (
      currentLineData === undefined
      || startsNewParagraph
      || (!ignoreNewLine && (hasSourceLineBreak || hasManualLineBreak))
    ) {
      currentStropheData.lines.push({
        lineId: ++currentLineIdx,
        words: [],
        paragraphBreakBefore: startsNewParagraph,
      })
      currentLineData = currentStropheData.lines[currentLineIdx];
    }

    if (prevVerseNum !== wordProps.verse) {
      wordProps.showVerseNum = true;
    }
    wordProps.firstStropheInStanza = (currentStropheIdx === 0);
    wordProps.lastStropheInStanza = false;
    wordProps.lineId = currentLineIdx;
    wordProps.stropheId = currentStropheIdx;
    wordProps.stanzaId = currentStanzaIdx;

    currentLineData.words.push(wordProps);
    prevVerseNum = wordProps.verse;
  });

  passageProps.stanzaProps.map((stanza) => {
    stanza.strophes.map((strophe, stropheId) => {
      strophe.lastStropheInStanza = (stropheId === stanza.strophes.length-1);
      if (strophe.lastStropheInStanza) {
        strophe.lines.forEach((line) => {
          line.words.forEach((word) => {
            word.lastStropheInStanza = true;
          })
        })
      }      
    })
  })

  return passageProps;
}

export const formatBookAndPassage = (book:string, passage:string):string => {
  if (!book || book.trim() === "") {
    return passage;
  }
  const formattedBook = book.charAt(0).toUpperCase()+book.slice(1);
  return `${formattedBook} ${passage}`;
}
