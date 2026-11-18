import { BoxDisplayStyle, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import type { LayerDef, PassageProps, StudyMetadata, WordProps } from "@/lib/data";

/*
  The guided tour for the Psalm 23 Interface Tutorial.

  Each step points at one element (a CSS selector, usually a data-tour
  marker), says what to do, and says how to tell it was done. Steps with no
  target are shown as a centered card. Steps with neither `isDone` nor
  `checks` are read-and-continue steps.

  `isDone` receives the current snapshot and the snapshot taken when the step
  began, so a step can ask for a change ("one fewer strophe than before").
  Note: practice mode never saves, so reloading the page resets the passage
  while the tour resumes where it was; steps that build on earlier ones can
  then be skipped.
*/

/** What the tour can see of the study screen. */
export type TourSnapshot = {
  languageMode: LanguageMode;
  nonEnglishDisplayMode: NonEnglishDisplayMode;
  esvOpen: boolean;
  stropheCount: number;
  stanzaCount: number;
  lineCount: number;
  firstStropheWordCount: number;
  anyStropheCollapsed: boolean;
  verseSixLineCount: number;
  selectedWordCount: number;
  identicalWordsSelected: boolean;
  wordInfoOpen: boolean;
  infoPaneAction: InfoPaneActionType;
  anyFill: boolean;
  anyBorder: boolean;
  anyTextColor: boolean;
  anyGlossEdit: boolean;
  boxStyle: BoxDisplayStyle | undefined;
  anyIndent: boolean;
  notesOn: boolean;
  anyNoteTitle: boolean;
  anyStanzaTitle: boolean;
  layerCount: number;
  activeLayerId: number;
  firstLayerId: number | undefined;
  /** The passage's words in reading order. */
  words: TourWord[];
  /** Verse 6 as shown: one list of its words per line. */
  verseSixLines: TourWord[][];
  /** Each strophe and where it starts. */
  strophes: TourStrophe[];
  selectedWordIds: number[];
  selectedStropheIds: number[];
};

export type TourWord = { wordId: number; verse: number; gloss: string };
export type TourStrophe = { stropheId: number; firstWordId: number | undefined; firstVerse: number | undefined };

export type TourCheck = { label: string; isDone: (s: TourSnapshot, start: TourSnapshot) => boolean };

export type TourStep = {
  id: string;
  /** Section name shown above the title, e.g. "Languages". */
  section: string;
  /**
    CSS selector (or selector list) to light up. May depend on the passage:
    `s` is the screen now, `start` the screen when the step began (use it to
    keep pointing at the same word while the layout changes).
  */
  target?: string | ((s: TourSnapshot, start: TourSnapshot) => string | undefined);
  title: string;
  body: string | ((s: TourSnapshot, start: TourSnapshot) => string);
  isDone?: (s: TourSnapshot, start: TourSnapshot) => boolean;
  /** Several things to do in one step; done when all are ticked. */
  checks?: TourCheck[];
  /** Extra space between target and bubble, for controls that open a panel below themselves. */
  clearance?: number;
  /** Dim the rest of the screen (default true). Off when the user must work in a panel that opens elsewhere. */
  dim?: boolean;
  /**
    "corner" parks the bubble at the bottom right instead of next to the
    target, for steps where the user works in the passage and the toolbar
    together and the bubble would otherwise cover the words.
  */
  placement?: "near" | "corner";
};

const WORK_IN_PASSAGE = { dim: false, placement: "corner" } as const;

// A control plus the panel it opens, lit together while the rest stays dimmed.
const LANGUAGE_WITH_DROPDOWN = '[data-tour="language-switcher"], [data-tour="language-dropdown"]';
// Verse 1's number (the only one marked) and any open ESV box.
const ESV_WITH_POPOVER = '[data-tour="verse-number"], [data-tour="esv-popover"][data-open="true"]';

export const resolveTarget = (
  step: TourStep,
  s: TourSnapshot | null,
  start: TourSnapshot | null = s
): string | undefined =>
  typeof step.target === "function" ? (s ? step.target(s, start ?? s) : undefined) : step.target;

export const resolveBody = (step: TourStep, s: TourSnapshot | null, start: TourSnapshot | null = s): string =>
  typeof step.body === "function" ? (s ? step.body(s, start ?? s) : "") : step.body;

/** Is this step something the user does (as opposed to read)? */
export const isActionStep = (step: TourStep) => !!step.isDone || !!step.checks?.length;

export const isStepDone = (step: TourStep, s: TourSnapshot, start: TourSnapshot) =>
  step.checks?.length ? step.checks.every((c) => c.isDone(s, start)) : !!step.isDone?.(s, start);

/* ------------------------------------------------------------------------ */
/* Snapshot                                                                  */
/* ------------------------------------------------------------------------ */

type NoteEntry = { title?: string };

const anyNoteTitleIn = (studyNotes: string | undefined): boolean => {
  if (!studyNotes) return false;
  try {
    const parsed = JSON.parse(studyNotes) as {
      strophes?: NoteEntry[];
      layerStrophes?: Record<string, NoteEntry[]>;
    };
    const lists = [parsed.strophes ?? [], ...Object.values(parsed.layerStrophes ?? {})];
    return lists.some((list) => Array.isArray(list) && list.some((n) => !!n?.title?.trim()));
  } catch {
    return false;
  }
};

export type TourSources = {
  languageMode: LanguageMode;
  nonEnglishDisplayMode: NonEnglishDisplayMode;
  passageProps: PassageProps | undefined;
  selectedWords: WordProps[] | undefined;
  studyMetadata: StudyMetadata | undefined;
  boxStyle: BoxDisplayStyle | undefined;
  notesOn: boolean;
  studyNotes: string | undefined;
  layers: LayerDef[] | undefined;
  activeLayerId: number;
  selectedStropheIds?: number[];
  infoPaneAction: InfoPaneActionType;
  /** Read from the page: whether an ESV popover / Word Information is open. */
  esvOpen: boolean;
  wordInfoOpen: boolean;
};

export const buildTourSnapshot = (src: TourSources): TourSnapshot => {
  const stanzas = src.passageProps?.stanzaProps ?? [];
  const strophes = stanzas.flatMap((st) => st.strophes ?? []);
  const lines = strophes.flatMap((sp) => sp.lines ?? []);
  const firstStrophe = strophes[0];
  const words = Object.values(src.studyMetadata?.words ?? {});

  const selected = src.selectedWords ?? [];
  const seenStrong = new Set<number>();
  let identicalWordsSelected = false;
  for (const w of selected) {
    if (seenStrong.has(w.strongNumber)) identicalWordsSelected = true;
    seenStrong.add(w.strongNumber);
  }

  return {
    languageMode: src.languageMode,
    nonEnglishDisplayMode: src.nonEnglishDisplayMode,
    esvOpen: src.esvOpen,
    stropheCount: src.passageProps?.stropheCount ?? strophes.length,
    stanzaCount: src.passageProps?.stanzaCount ?? stanzas.length,
    lineCount: lines.length,
    firstStropheWordCount: firstStrophe ? firstStrophe.lines.reduce((n, l) => n + l.words.length, 0) : 0,
    anyStropheCollapsed: strophes.some((sp) => sp.metadata?.expanded === false),
    verseSixLineCount: lines.filter((l) => l.words.some((w) => w.verse === 6)).length,
    selectedWordCount: selected.length,
    identicalWordsSelected,
    wordInfoOpen: src.wordInfoOpen,
    infoPaneAction: src.infoPaneAction,
    anyFill: words.some((w) => !!w?.color?.fill),
    anyBorder: words.some((w) => !!w?.color?.border),
    anyTextColor: words.some((w) => !!w?.color?.text),
    anyGlossEdit: words.some((w) => !!w?.glossOverride?.trim()),
    boxStyle: src.boxStyle,
    anyIndent: words.some((w) => (w?.indent ?? 0) > 0),
    notesOn: src.notesOn,
    anyNoteTitle: anyNoteTitleIn(src.studyNotes),
    anyStanzaTitle: stanzas.some((st) => !!st.metadata?.title?.trim()),
    layerCount: src.layers?.length ?? 1,
    activeLayerId: src.activeLayerId,
    firstLayerId: src.layers?.[0]?.id,
    words: lines.flatMap((l) =>
      l.words.map((w) => ({
        wordId: w.wordId,
        verse: w.verse,
        gloss: (w.metadata?.glossOverride || w.gloss || "").trim(),
      }))
    ),
    verseSixLines: lines
      .map((l) =>
        l.words
          .filter((w) => w.verse === 6)
          .map((w) => ({ wordId: w.wordId, verse: w.verse, gloss: (w.metadata?.glossOverride || w.gloss || "").trim() }))
      )
      .filter((l) => l.length > 0),
    strophes: strophes.map((sp) => {
      const first = sp.lines?.[0]?.words?.[0];
      return { stropheId: sp.stropheId, firstWordId: first?.wordId, firstVerse: first?.verse };
    }),
    selectedWordIds: selected.map((w) => w.wordId),
    selectedStropheIds: src.selectedStropheIds ?? [],
  };
};

/* Passage helpers for steps that point at one word or strophe. */

const wordSelector = (w: TourWord | undefined) => (w ? `[data-word-id="${w.wordId}"]` : undefined);
const quoted = (w: TourWord | undefined) => (w?.gloss ? `\u201c${w.gloss}\u201d` : "the highlighted word");
const firstWordOfVerse = (s: TourSnapshot, verse: number) => s.words.find((w) => w.verse === verse);
const stropheStartingAt = (s: TourSnapshot, w: TourWord | undefined) =>
  w ? s.strophes.find((sp) => sp.firstWordId === w.wordId) : undefined;
/** The heading ends after the first two words ("A Psalm" "of David"). */
const firstWordAfterHeading = (s: TourSnapshot) => s.words[2];

/** Last word on line `index` of verse 6 (negative counts from the end). */
const lastWordOnVerseSixLine = (s: TourSnapshot, index: number) => {
  const line = s.verseSixLines.at(index);
  return line?.[line.length - 1];
};

const selected = (s: TourSnapshot, w: TourWord | undefined) => !!w && s.selectedWordIds.includes(w.wordId);

/** The strophe to move into a new stanza: the one starting at verse 4, else the second. */
const stanzaStrophe = (s: TourSnapshot) =>
  stropheStartingAt(s, firstWordOfVerse(s, 4)) ?? s.strophes[1];

const structureOf = (s: TourSnapshot) => `${s.stanzaCount}/${s.stropheCount}/${s.lineCount}`;

/* ------------------------------------------------------------------------ */
/* Steps                                                                     */
/* ------------------------------------------------------------------------ */

export const INTERFACE_TOUR_ID = "interface-v2";

const PASSAGE = '[data-strophe-line="true"]';

export const INTERFACE_TOUR_STEPS: TourStep[] = [
  // Welcome
  {
    id: "welcome",
    section: "Welcome",
    title: "Welcome to Sela",
    body:
      "This tutorial walks you through the study screen using Psalm 23. This is a practice copy: try anything you like, nothing you change is saved. Each step tells you what to do and waits until you have done it.",
  },
  {
    id: "english-gloss",
    section: "The text",
    target: PASSAGE,
    title: "A word-by-word English",
    body:
      "The English you see is a word-by-word gloss from the Discovery Bible. Each box is one Hebrew word, and the boxes follow the Hebrew word order, so the English reads a little differently from a normal translation.",
  },

  // Languages
  {
    id: "lang-hebrew",
    section: "Languages",
    target: '[data-tour="language-switcher"]',
    title: "Switch to the Hebrew",
    body: "The language switch has three choices: A (English), א (Hebrew) and Aא (both). Click א to show the Hebrew text (OHB, the Open Hebrew Bible).",
    isDone: (s) => s.languageMode === LanguageMode.Hebrew,
  },
  {
    id: "lang-transliteration",
    section: "Languages",
    target: LANGUAGE_WITH_DROPDOWN,
    title: "See the transliteration",
    body: "Click the small arrow next to א and choose Transliteration to read the Hebrew in English letters.",
    isDone: (s) =>
      s.languageMode === LanguageMode.Hebrew &&
      s.nonEnglishDisplayMode === NonEnglishDisplayMode.HebrewTransliteration,
    // The dropdown opens right below the switch: light it up with the switch
    // and keep the bubble in the corner so it doesn't cover it.
    placement: "corner",
  },
  {
    id: "lang-parallel",
    section: "Languages",
    target: '[data-tour="language-switcher"]',
    title: "English and Hebrew together",
    body: "Click Aא to see the English gloss and the Hebrew side by side.",
    isDone: (s) => s.languageMode === LanguageMode.Parallel,
  },
  {
    id: "lang-english",
    section: "Languages",
    target: '[data-tour="language-switcher"]',
    title: "Back to the English gloss",
    body: "Click A to return to the Discovery Bible English. The rest of the tutorial uses this view.",
    isDone: (s) => s.languageMode === LanguageMode.English,
  },

  // ESV
  {
    id: "esv-open",
    section: "Translation",
    title: "Read a verse in the ESV",
    body: "Click the small verse number 1 to see the verse in the English Standard Version, a regular translation.",
    isDone: (s) => s.esvOpen,
    // The ESV box opens next to the verse number: light it up with it and
    // keep the bubble in the corner so it doesn't cover it.
    target: ESV_WITH_POPOVER,
    placement: "corner",
  },
  {
    id: "esv-close",
    section: "Translation",
    title: "Close it again",
    body: "Click the verse number again to hide the ESV.",
    isDone: (s) => !s.esvOpen,
    target: ESV_WITH_POPOVER,
    placement: "corner",
  },

  // Strophes
  {
    id: "heading-word",
    section: "Strophes",
    target: (s) => wordSelector(firstWordAfterHeading(s)),
    title: "Set the heading apart",
    body: (s) =>
      `\u201cA Psalm of David\u201d is a heading. Headings and choir directions are not usually part of the poem\u2019s analysis, so we can put them in a strophe of their own. Click ${quoted(firstWordAfterHeading(s))}, the first word after the heading.`,
    isDone: (s) => {
      const w = firstWordAfterHeading(s);
      return !!w && s.selectedWordIds.includes(w.wordId);
    },
  },
  {
    id: "heading-new-strophe",
    section: "Strophes",
    target: '[data-tour="structure-newStrophe"]',
    title: "Click New strophe",
    body: "Now click New strophe. The heading stays in the first strophe, and the psalm itself starts a new one.",
    isDone: (s) => s.stropheCount >= 2 && s.firstStropheWordCount === 2,
  },
  {
    id: "strophe-collapse",
    section: "Strophes",
    target: (s) =>
      s.strophes[0] ? `[data-tour="strophe-collapse"][data-strophe-id="${s.strophes[0].stropheId}"]` : undefined,
    title: "Collapse a strophe",
    body: "Click this arrow to collapse the heading strophe out of the way. Clicking it again opens it.",
    isDone: (s) => s.anyStropheCollapsed,
  },
  {
    id: "strophe-explain",
    section: "Strophes",
    title: "What is a strophe?",
    body:
      "A strophe is a small unit of the poem, made of one or more lines that belong together. Its lines share a thought, often with parallel wording, and it ends where the grammar, image, speaker or purpose shifts, much like a paragraph in prose. We\u2019ll divide the rest of the psalm at two of its verse breaks, the same verses you saw in the ESV.",
  },
  {
    id: "verse4-word",
    section: "Strophes",
    target: (s) => wordSelector(firstWordOfVerse(s, 4)),
    title: "A turn at verse 4",
    body: (s) =>
      `In verse 4 David stops speaking about the LORD as \u201che\u201d and starts speaking to him as \u201cyou\u201d. Click ${quoted(firstWordOfVerse(s, 4))}, the first word of verse 4.`,
    isDone: (s) => {
      const w = firstWordOfVerse(s, 4);
      return !!w && s.selectedWordIds.includes(w.wordId);
    },
  },
  {
    id: "verse4-new-strophe",
    section: "Strophes",
    target: '[data-tour="structure-newStrophe"]',
    title: "Start a strophe at verse 4",
    body: "Click New strophe. Verse 4 and everything after it moves into a new strophe.",
    isDone: (s) => !!stropheStartingAt(s, firstWordOfVerse(s, 4)),
  },
  {
    id: "verse5-word",
    section: "Strophes",
    target: (s) => wordSelector(firstWordOfVerse(s, 5)),
    title: "A new picture at verse 5",
    body: (s) =>
      `In verse 5 the picture changes from a shepherd to a host preparing a table. Click ${quoted(firstWordOfVerse(s, 5))}, the first word of verse 5.`,
    isDone: (s) => {
      const w = firstWordOfVerse(s, 5);
      return !!w && s.selectedWordIds.includes(w.wordId);
    },
  },
  {
    id: "verse5-new-strophe",
    section: "Strophes",
    target: '[data-tour="structure-newStrophe"]',
    title: "Start a strophe at verse 5",
    body:
      "Click New strophe again. Tip: you can also select several words in a row and click New strophe to make just those words a strophe of their own. The words must be next to each other.",
    isDone: (s) => !!stropheStartingAt(s, firstWordOfVerse(s, 5)),
  },

  // Stanzas
  {
    id: "stanza-explain",
    section: "Stanzas",
    title: "What is a stanza?",
    body:
      "A stanza is a larger section of a Hebrew poem, made of one or more strophes. A new stanza begins where the theme, image, speaker or direction of the poem shifts, and stanzas show the poem\u2019s overall shape. Because stanzas are built from strophes, you divide the passage into strophes first, then group the strophes into stanzas.",
  },
  {
    id: "stanza-select",
    section: "Stanzas",
    target: (s) => {
      const sp = stanzaStrophe(s);
      return sp ? `[data-tour="strophe-select"][data-strophe-id="${sp.stropheId}"]` : undefined;
    },
    title: "Select a strophe",
    body: (s) =>
      stanzaStrophe(s)?.firstVerse === 4
        ? "Click this icon to select the strophe that begins at verse 4, where David turns to speak to the LORD directly."
        : "Click this icon to select the second strophe.",
    isDone: (s) => {
      const sp = stanzaStrophe(s);
      return !!sp && s.selectedStropheIds.includes(sp.stropheId);
    },
  },
  {
    id: "stanza-new",
    section: "Stanzas",
    target: '[data-tour="structure-newStanza"]',
    title: "Click New stanza",
    body: "Click New stanza. The selected strophe and the ones after it start a new stanza.",
    isDone: (s) => s.stanzaCount >= 2,
  },

  // Lines: verse 6 from four lines to two, in two merge cycles. Each word is
  // fixed when its step begins, so the highlight stays put as lines change.
  {
    id: "v6-merge1-word",
    section: "Lines",
    target: (_s, start) => wordSelector(lastWordOnVerseSixLine(start, 1)),
    title: "Join verse 6 into two lines",
    body: (_s, start) =>
      `Verse 6 is on ${start.verseSixLineCount} lines; let\u2019s join it into two. Click ${quoted(lastWordOnVerseSixLine(start, 1))}, the last word on the second line of verse 6.`,
    isDone: (s, start) => selected(s, lastWordOnVerseSixLine(start, 1)),
  },
  {
    id: "v6-merge1-button",
    section: "Lines",
    target: '[data-tour="structure-mergeWithPrevLine"]',
    title: "Click Merge with previous line",
    body: "Click Merge with previous line. The selected word and everything before it on its line join the line above.",
    isDone: (s, start) => s.verseSixLineCount < start.verseSixLineCount,
  },
  {
    id: "v6-merge2-word",
    section: "Lines",
    target: (_s, start) => wordSelector(lastWordOnVerseSixLine(start, -1)),
    title: "Once more",
    body: (_s, start) =>
      `Now click ${quoted(lastWordOnVerseSixLine(start, -1))}, the last word of verse 6.`,
    isDone: (s, start) => selected(s, lastWordOnVerseSixLine(start, -1)),
  },
  {
    id: "v6-merge2-button",
    section: "Lines",
    target: '[data-tour="structure-mergeWithPrevLine"]',
    title: "Click Merge with previous line",
    body:
      "Click Merge with previous line again to finish. Merge with next line works the same way in the other direction, and if you select several words, only those words move.",
    isDone: (s, start) => s.verseSixLineCount < start.verseSixLineCount && s.verseSixLineCount <= 2,
  },

  // Merging
  {
    id: "merge-strophe",
    section: "Merging",
    target: '[data-tour="group-strophe"]',
    title: "Merge two strophes",
    body: "Changed your mind? Select a strophe and click Merge with previous strophe or Merge with next strophe to join it to its neighbour.",
    isDone: (s, start) => s.stropheCount < start.stropheCount,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "merge-stanza",
    section: "Merging",
    target: '[data-tour="group-stanza"]',
    title: "Merge two stanzas",
    body: "Stanzas merge the same way: select a strophe and click Merge with previous stanza or Merge with next stanza.",
    isDone: (s, start) => s.stanzaCount < start.stanzaCount,
    ...WORK_IN_PASSAGE,
  },

  // Identical words
  {
    id: "identical-select",
    section: "Repeated words",
    target: PASSAGE,
    title: "Find a word’s repeats",
    body:
      "Double-click “Yahweh”. Every place the same Hebrew word appears in the passage is selected. Hebrew poetry often repeats key words to tie a poem together, and here God’s name frames the whole psalm.",
    isDone: (s) => s.identicalWordsSelected,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "word-info",
    section: "Repeated words",
    target: '[data-tour="word-info"]',
    title: "See what a word means",
    body:
      "Open Word Information. It shows the selected word in Hebrew, its transliteration, English gloss and grammar. The info icon there opens a fuller analysis.",
    isDone: (s) => s.wordInfoOpen,
  },
  {
    id: "motif-tab",
    section: "Repeated words",
    target: '[data-tour="tab-motif"]',
    title: "The Motif tab",
    body:
      "Open the Motif tab. Identical Words lists every Hebrew word used more than once in the passage. Categories groups words by area of meaning, so you can see themes that run through the psalm even when different words are used.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.motif,
  },

  // Colors
  {
    id: "colors",
    section: "Colors",
    target: '[data-tour="group-format"]',
    title: "Mark words with color",
    body:
      "With some words selected (double-click a word, or click and drag across several), try all three color tools:",
    checks: [
      { label: "Fill color (the background)", isDone: (s) => s.anyFill },
      { label: "Font color (the text)", isDone: (s) => s.anyTextColor },
      { label: "Border color", isDone: (s) => s.anyBorder },
    ],
    ...WORK_IN_PASSAGE,
  },

  // Lines again, gloss, word display
  {
    id: "lines-split",
    section: "Lines",
    target: '[data-tour="group-line"]',
    title: "Split verse 6 again",
    body: "Put verse 6 back on four lines. Click the word that should start a new line, then click New line. The words after it on that line move down with it.",
    isDone: (s, start) => s.verseSixLineCount >= 4 && s.verseSixLineCount > start.verseSixLineCount,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "edit-gloss",
    section: "Words",
    target: '[data-tour="group-word"]',
    title: "Edit the English gloss",
    body:
      "Select one English word, click Edit English gloss (the last icon in this group), type your own wording and press Enter. Only this study changes; the Hebrew stays as it is.",
    isDone: (s) => s.anyGlossEdit,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "boxes-off",
    section: "Words",
    target: '[data-tour="group-word"]',
    title: "Read without boxes",
    body: "Click the box icon (first in this group) to hide the word boxes and read the English as plain text.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.noBox,
  },
  {
    id: "uniform-width",
    section: "Words",
    target: '[data-tour="group-word"]',
    title: "Line up the words",
    body: "Click Enable uniform width (second icon). Every box becomes the same width, which makes it easy to compare lines.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.uniformBoxes,
  },
  {
    id: "indent",
    section: "Words",
    target: '[data-tour="group-word"]',
    title: "Indent to line up ideas",
    body:
      "Select a word and click Add indent (third icon) to shift it one space to the right, so matching ideas in parallel lines sit under each other. Remove indent moves it back.",
    isDone: (s) => s.anyIndent,
    ...WORK_IN_PASSAGE,
  },

  // Notes
  {
    id: "notes-on",
    section: "Notes",
    target: '[data-tour="notes-toggle"]',
    title: "Open the strophe notes",
    body: "Click the notes button to open a note beside every strophe.",
    isDone: (s) => s.notesOn,
  },
  {
    id: "notes-write",
    section: "Notes",
    target: PASSAGE,
    title: "Write a note",
    body:
      "Click into any strophe’s note and write something. Put a short title on the first line, press Enter, then write your observation underneath.",
    isDone: (s) => s.anyNoteTitle,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "notes-format",
    section: "Notes",
    target: '[aria-label="Formatting options"]',
    title: "Format your notes",
    body:
      "The button at the bottom right of a note (or a right-click inside it) opens the formatting menu: text colour, bold, italic, size and more.",
    dim: false,
  },
  {
    id: "notes-off",
    section: "Notes",
    target: '[data-tour="notes-toggle"]',
    title: "Back to the passage",
    body:
      "Click the notes button again to close the notes. The first line of each note now shows as that strophe’s title.",
    isDone: (s) => !s.notesOn,
  },
  {
    id: "stanza-title",
    section: "Notes",
    target: '[data-tour="stanza-title"]',
    title: "Name a stanza",
    body: "Each stanza can have a title too. Click just above a stanza’s first line (“Add stanza title…” appears when you hover), type a title and press Enter.",
    isDone: (s) => s.anyStanzaTitle,
    dim: false,
  },

  // Layers
  {
    id: "layers-tab",
    section: "Layers",
    target: '[data-tour="tab-layer"]',
    title: "The Layer tab",
    body:
      "Open the Layer tab. A layer is a separate set of colors, divisions and notes on the same passage, so you can study one psalm in several ways without mixing them up.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.layers,
  },
  {
    id: "layers-create",
    section: "Layers",
    target: '[data-tour="new-layer"]',
    title: "Create a layer",
    body: "Click the dashed box at the bottom of the tab, type a name for your layer and press Enter. The new layer starts with your current divisions but no colors or notes.",
    isDone: (s, start) => s.layerCount > start.layerCount,
    dim: false,
  },
  {
    id: "layers-edit",
    section: "Layers",
    target: PASSAGE,
    title: "Work in the new layer",
    body: "In this new layer, add some colors and change at least one division (a line, strophe or stanza).",
    checks: [
      { label: "Add a color", isDone: (s) => s.anyFill || s.anyBorder || s.anyTextColor },
      { label: "Change a division", isDone: (s, start) => structureOf(s) !== structureOf(start) },
    ],
    ...WORK_IN_PASSAGE,
  },
  {
    id: "layers-back",
    section: "Layers",
    target: '[data-tour="tab-layer"]',
    title: "Switch back to your first layer",
    body:
      "Click your first layer in the Layer tab. Notice that the colors and divisions you just made are not here: each layer keeps its own work.",
    isDone: (s) => s.firstLayerId !== undefined && s.activeLayerId === s.firstLayerId,
    dim: false,
  },

  // Finish
  {
    id: "finish",
    section: "Done",
    title: "That concludes the basic tutorial",
    body:
      "You have used the language views, the ESV, lines, strophes and stanzas, repeated words and the Motif tab, colors, gloss editing, word layout, notes, titles and layers. Keep exploring this practice copy, or use Copy to My Studies to keep your work.",
  },
];
