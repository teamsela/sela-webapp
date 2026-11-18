import { BoxDisplayStyle, ColorActionType, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
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
  /** A color swatch picker (fill, border or font) is open. */
  colorPickerOpen: boolean;
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
  /**
    Lines, identified by the id of their first word: unique across the
    passage and shared by the English and Hebrew panes.
  */
  firstLineStart: number | undefined;
  verseSixLineStarts: number[];
  /** Each strophe and where it starts. */
  strophes: TourStrophe[];
  /** Each stanza, where it starts and its strophes. */
  stanzas: TourStanza[];
  selectedWordIds: number[];
  selectedStropheIds: number[];
  /** Words (in reading order) that carry a color, an edited gloss, an indent. */
  coloredWordIds: number[];
  glossEditedWordIds: number[];
  indentedWordIds: number[];
  /** Strophes whose note (in the active layer) has a title. */
  titledNoteStropheIds: number[];
};

export type TourWord = { wordId: number; verse: number; gloss: string; /** starts a line in the passage's original layout */ lineStart?: boolean };
export type TourStrophe = { stropheId: number; firstWordId: number | undefined; firstVerse: number | undefined };
export type TourStanza = { stanzaId: number; firstVerse: number | undefined; stropheIds: number[] };

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
  /** What to light up (in green) once the step is done: the result of the action. */
  result?: string | ((s: TourSnapshot, start: TourSnapshot) => string | undefined);
  /**
    Extra places the user may click during this step (selector list). Clicks
    anywhere else, outside the target and the bubble, are blocked so the
    tutorial's flow can't be knocked off course.
  */
  allow?: string;
  /** Extra space between target and bubble, for controls that open a panel below themselves. */
  clearance?: number;
  /**
    Tidy up as the step begins: clear leftover word/strophe selections (so a
    "click this word" step starts from nothing selected) and close the info
    pane (so the passage has its full width).
  */
  onStart?: { clearSelection?: boolean; closeInfoPane?: boolean };
  /** Dim the rest of the screen (default true). Off when the user must work in a panel that opens elsewhere. */
  dim?: boolean;
  /**
    "corner" parks the bubble at the bottom right instead of next to the
    target, for steps where the user works in the passage and the toolbar
    together and the bubble would otherwise cover the words.
  */
  placement?: "near" | "corner";
};

const PASSAGE_AREA = '[data-tour="passage-area"]';
const INFO_PANE = '[data-tour="info-pane"]';
const WORK_IN_PASSAGE = { dim: false, placement: "corner", allow: PASSAGE_AREA } as const;

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

export const resolveResult = (
  step: TourStep,
  s: TourSnapshot | null,
  start: TourSnapshot | null = s
): string | undefined =>
  typeof step.result === "function" ? (s ? step.result(s, start ?? s) : undefined) : step.result;

/** Is this step something the user does (as opposed to read)? */
export const isActionStep = (step: TourStep) => !!step.isDone || !!step.checks?.length;

export const isStepDone = (step: TourStep, s: TourSnapshot, start: TourSnapshot) =>
  step.checks?.length ? step.checks.every((c) => c.isDone(s, start)) : !!step.isDone?.(s, start);

/* ------------------------------------------------------------------------ */
/* Snapshot                                                                  */
/* ------------------------------------------------------------------------ */

type NoteEntry = { title?: string };

const titledNoteIndexes = (studyNotes: string | undefined, layerId: number): number[] => {
  if (!studyNotes) return [];
  try {
    const parsed = JSON.parse(studyNotes) as {
      strophes?: NoteEntry[];
      layerStrophes?: Record<string, NoteEntry[]>;
    };
    const list = parsed.layerStrophes?.[String(layerId)] ?? (layerId === 0 ? parsed.strophes : undefined) ?? [];
    return Array.isArray(list) ? list.flatMap((n, i) => (n?.title?.trim() ? [i] : [])) : [];
  } catch {
    return [];
  }
};

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
  colorAction?: ColorActionType;
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
    colorPickerOpen: [ColorActionType.colorFill, ColorActionType.borderColor, ColorActionType.textColor].includes(
      src.colorAction ?? ColorActionType.none
    ),
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
        lineStart: !!w.newLine,
      }))
    ),
    firstLineStart: lines[0]?.words[0]?.wordId,
    verseSixLineStarts: lines
      .filter((l) => l.words.some((w) => w.verse === 6))
      .flatMap((l) => (l.words[0] ? [l.words[0].wordId] : [])),
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
    stanzas: stanzas.map((st) => ({
      stanzaId: st.stanzaId,
      firstVerse: st.strophes?.[0]?.lines?.[0]?.words?.[0]?.verse,
      stropheIds: (st.strophes ?? []).map((sp) => sp.stropheId),
    })),
    selectedWordIds: selected.map((w) => w.wordId),
    selectedStropheIds: src.selectedStropheIds ?? [],
    coloredWordIds: lines.flatMap((l) => l.words).map((w) => w.wordId).filter((id) => {
      const c = src.studyMetadata?.words?.[id]?.color;
      return !!(c?.fill || c?.border || c?.text);
    }),
    glossEditedWordIds: lines.flatMap((l) => l.words).map((w) => w.wordId)
      .filter((id) => !!src.studyMetadata?.words?.[id]?.glossOverride?.trim()),
    indentedWordIds: lines.flatMap((l) => l.words).map((w) => w.wordId)
      .filter((id) => (src.studyMetadata?.words?.[id]?.indent ?? 0) > 0),
    titledNoteStropheIds: titledNoteIndexes(src.studyNotes, src.activeLayerId),
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

const ALL_TOOL_GROUPS =
  '[data-tour="group-format"], [data-tour="group-word"], [data-tour="group-line"], [data-tour="group-strophe"], [data-tour="group-stanza"]';

const wordById = (id: number | undefined) => (id === undefined ? undefined : `[data-word-id="${id}"]`);
const stropheBlock = (sp: TourStrophe | undefined) => (sp ? `[data-strophe-block="${sp.stropheId}"]` : undefined);
const stanzaBlock = (st: TourStanza | undefined) => (st ? `[data-stanza-block="${st.stanzaId}"]` : undefined);
const stropheSelector = (sp: TourStrophe | undefined) =>
  sp ? `[data-tour="strophe-select"][data-strophe-id="${sp.stropheId}"]` : undefined;
const both = (a: string | undefined, b: string | undefined) => [a, b].filter(Boolean).join(", ") || undefined;
/** Verse 6 from its first to its last word. */
const verseSixArea = (s: TourSnapshot) => {
  const v6 = s.words.filter((w) => w.verse === 6);
  return both(wordSelector(v6[0]), wordSelector(v6[v6.length - 1]));
};
const firstLine = '[data-strophe-line="true"]';
/** Whole lines, in every pane (English and Hebrew), from edge to edge. */
const linesStartingWith = (wordIds: number[]) =>
  wordIds.map((id) => `all:[data-line-start="${id}"]`).join(", ") || undefined;
const firstLineEverywhere = (s: TourSnapshot) =>
  s.firstLineStart === undefined ? firstLine : linesStartingWith([s.firstLineStart]);
const verseSixLinesEverywhere = (s: TourSnapshot) => linesStartingWith(s.verseSixLineStarts);
/** Where verse 6's lines start in the passage's original layout. */
const verseSixOriginalLineStart = (s: TourSnapshot, index: number) =>
  s.words.filter((w) => w.verse === 6 && w.lineStart).at(index);
const coloredWords = (s: TourSnapshot) =>
  both(wordById(s.coloredWordIds[0]), wordById(s.coloredWordIds[s.coloredWordIds.length - 1]));

/** God's name in verse 1 (glossed "Yahweh [is]"), else the first word after the heading. */
const yahwehInVerseOne = (s: TourSnapshot) =>
  s.words.find((w) => w.verse === 1 && /yahweh/i.test(w.gloss)) ?? firstWordAfterHeading(s);

/** The strophe to move into a new stanza: the one starting at verse 4, else the second. */
const stanzaStrophe = (s: TourSnapshot) =>
  stropheStartingAt(s, firstWordOfVerse(s, 4)) ?? s.strophes[1];

const structureOf = (s: TourSnapshot) => `${s.stanzaCount}/${s.stropheCount}/${s.lineCount}`;

/* ------------------------------------------------------------------------ */
/* Steps                                                                     */
/* ------------------------------------------------------------------------ */

export const INTERFACE_TOUR_ID = "interface-v4";

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
    target: '[data-tour="lang-Hebrew"]',
    title: "Switch to the Hebrew",
    body: "The language switch has three choices: A (English), א (Hebrew) and Aא (both). Click א to show the Hebrew text (OHB, the Open Hebrew Bible).",
    isDone: (s) => s.languageMode === LanguageMode.Hebrew,
    result: firstLineEverywhere,
  },
  {
    id: "lang-transliteration",
    section: "Languages",
    target: '[data-tour="lang-chevron-Hebrew"], [data-tour="language-dropdown"]',
    title: "See the transliteration",
    body: "Click the small arrow next to א and choose Transliteration to read the Hebrew in English letters.",
    isDone: (s) =>
      s.languageMode === LanguageMode.Hebrew &&
      s.nonEnglishDisplayMode === NonEnglishDisplayMode.HebrewTransliteration,
    // The dropdown opens right below the switch: light it up with the switch
    // and keep the bubble in the corner so it doesn't cover it.
    placement: "corner",
    result: firstLineEverywhere,
  },
  {
    id: "lang-parallel",
    section: "Languages",
    target: '[data-tour="lang-Parallel"]',
    title: "English and Hebrew together",
    body: "Click Aא to see the English gloss and the Hebrew side by side. The first line is highlighted in both.",
    isDone: (s) => s.languageMode === LanguageMode.Parallel,
    result: firstLineEverywhere,
  },
  {
    id: "lang-english",
    section: "Languages",
    target: '[data-tour="lang-English"]',
    title: "Back to the English gloss",
    body: "Click A to return to the Discovery Bible English. The rest of the tutorial uses this view.",
    isDone: (s) => s.languageMode === LanguageMode.English,
    result: firstLineEverywhere,
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
    result: '[data-tour="esv-popover"][data-open="true"]',
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
    onStart: { clearSelection: true, closeInfoPane: true },
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
    result: (s) => both(stropheBlock(s.strophes[0]), stropheBlock(s.strophes[1])),
  },
  {
    id: "strophe-collapse",
    section: "Strophes",
    target: (s) =>
      s.strophes[0] ? `[data-tour="strophe-collapse"][data-strophe-id="${s.strophes[0].stropheId}"]` : undefined,
    title: "Collapse a strophe",
    body: "Click this arrow to collapse the heading strophe out of the way. Clicking it again opens it.",
    isDone: (s) => s.anyStropheCollapsed,
    result: (s) => stropheBlock(s.strophes[0]),
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
    onStart: { clearSelection: true, closeInfoPane: true },
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
    result: (s) => stropheBlock(stropheStartingAt(s, firstWordOfVerse(s, 4))),
  },
  {
    id: "verse5-word",
    onStart: { clearSelection: true, closeInfoPane: true },
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
    result: (s) => stropheBlock(stropheStartingAt(s, firstWordOfVerse(s, 5))),
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
    onStart: { clearSelection: true, closeInfoPane: true },
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
    body: "Click New stanza. The selected strophe becomes a stanza of its own, so the psalm now has three stanzas: the heading and verses 1\u20133, verse 4, and verses 5\u20136.",
    isDone: (s) => s.stanzaCount >= 2,
    result: (s) => stanzaBlock(s.stanzas.find((st) => st.firstVerse === 4) ?? s.stanzas[1]),
  },

  // Lines: verse 6 from four lines to two, in two merge cycles. Each word is
  // fixed when its step begins, so the highlight stays put as lines change.
  {
    id: "v6-merge1-word",
    onStart: { clearSelection: true, closeInfoPane: true },
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
    result: verseSixLinesEverywhere,
  },
  {
    id: "v6-merge2-word",
    onStart: { clearSelection: true, closeInfoPane: true },
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
    result: verseSixLinesEverywhere,
  },

  // Merging: first join the last two stanzas back together (verse 4 and
  // verses 5-6 are each a stanza of their own after New stanza), then merge
  // the verse 5 strophe into verse 4. Each is "select this strophe", then
  // "click this button".
  {
    id: "merge-stanza-select",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Merging",
    target: (_s, start) =>
      stropheSelector(stropheStartingAt(start, firstWordOfVerse(start, 5)) ?? start.strophes.at(-1)),
    title: "Select a strophe to move back",
    body:
      "Divisions can be undone with the merge buttons. First, join the last two stanzas again: click this icon to select the strophe that begins at verse 5.",
    isDone: (s, start) => {
      const sp = stropheStartingAt(start, firstWordOfVerse(start, 5)) ?? start.strophes.at(-1);
      return !!sp && s.selectedStropheIds.includes(sp.stropheId);
    },
  },
  {
    id: "merge-stanza-button",
    section: "Merging",
    target: '[data-tour="structure-mergeWithPrevStanza"]',
    title: "Click Merge with previous stanza",
    body:
      "Click Merge with previous stanza. The selected strophe moves back into the stanza before it. Merge with next stanza (the button beside it) moves a strophe forward into the stanza after it.",
    isDone: (s, start) => s.stanzaCount < start.stanzaCount,
    result: (s) => stanzaBlock(s.stanzas.find((st) => st.firstVerse === 4) ?? s.stanzas.at(-1)),
  },
  {
    id: "merge-strophe-select",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Merging",
    target: (_s, start) =>
      stropheSelector(stropheStartingAt(start, firstWordOfVerse(start, 5)) ?? start.strophes.at(-1)),
    title: "Select a strophe to merge",
    body:
      "Verse 4 and verses 5\u20136 are now two strophes in the same stanza. Click this icon to select the strophe that begins at verse 5.",
    isDone: (s, start) => {
      const sp = stropheStartingAt(start, firstWordOfVerse(start, 5)) ?? start.strophes.at(-1);
      return !!sp && s.selectedStropheIds.includes(sp.stropheId);
    },
  },
  {
    id: "merge-strophe-button",
    section: "Merging",
    target: '[data-tour="structure-mergeWithPrevStrophe"]',
    title: "Click Merge with previous strophe",
    body:
      "Click Merge with previous strophe. The selected strophe joins the one before it. Merge with next strophe (the button beside it) joins a strophe to the one after it. Strophes can only merge within the same stanza.",
    isDone: (s, start) => s.stropheCount < start.stropheCount,
    result: (s) => stropheBlock(stropheStartingAt(s, firstWordOfVerse(s, 4))),
  },

  // Identical words
  {
    id: "identical-select",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Repeated words",
    target: (_s, start) => wordSelector(yahwehInVerseOne(start)),
    title: "Find a word’s repeats",
    body:
      "Double-click this word, \u201cYahweh\u201d. Every place the same Hebrew word appears in the passage is selected. Hebrew poetry often repeats key words to tie a poem together, and here God’s name frames the whole psalm.",
    isDone: (s) => s.identicalWordsSelected,
    ...WORK_IN_PASSAGE,
    // Each selected repeat, wherever it is in the psalm.
    result: (s) => s.selectedWordIds.map((id) => wordById(id)).filter(Boolean).join(", ") || undefined,
  },
  {
    id: "word-info",
    section: "Repeated words",
    target: '[data-tour="word-info"]',
    title: "See what a word means",
    body:
      "Open Word Information. It shows the selected word in Hebrew, its transliteration, English gloss and grammar. The info icon there opens a fuller analysis.",
    isDone: (s) => s.wordInfoOpen,
    result: '#word-information-bar',
  },
  {
    id: "motif-tab",
    section: "Repeated words",
    target: '[data-tour="tab-motif"]',
    title: "The Motif tab",
    body:
      "Open the Motif tab. Identical Words lists every Hebrew word used more than once in the passage. Categories groups words by area of meaning, so you can see themes that run through the psalm even when different words are used.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.motif,
    result: INFO_PANE,
  },

  // Colors
  {
    id: "color-fill",
    onStart: { closeInfoPane: true },
    section: "Colors",
    target: '[data-tour="fill-color"]',
    title: "Fill color",
    body:
      "Colors mark repeated words and parallel ideas. With words selected (the repeated \u201cYahweh\u201d from before, or double-click or drag across others), click Fill color and pick a color for the background. Then click Fill color again to close the color picker.",
    checks: [
      { label: "Pick a fill color", isDone: (s) => s.anyFill },
      { label: "Close the picker: click Fill color again", isDone: (s) => s.anyFill && !s.colorPickerOpen },
    ],
    result: coloredWords,
    ...WORK_IN_PASSAGE,
    allow: both(PASSAGE_AREA, '[data-tour="fill-color"]'),
  },
  {
    id: "color-font",
    section: "Colors",
    target: '[data-tour="font-color"]',
    title: "Font color",
    body: "Now click Font color and pick a color for the text itself, then click Font color again to close the picker.",
    checks: [
      { label: "Pick a font color", isDone: (s) => s.anyTextColor },
      { label: "Close the picker: click Font color again", isDone: (s) => s.anyTextColor && !s.colorPickerOpen },
    ],
    result: coloredWords,
    ...WORK_IN_PASSAGE,
    allow: both(PASSAGE_AREA, '[data-tour="font-color"]'),
  },
  {
    id: "color-border",
    section: "Colors",
    target: '[data-tour="border-color"]',
    title: "Border color",
    body: "Finally, click Border color and pick a color for the box around each word, then click Border color again to close the picker.",
    checks: [
      { label: "Pick a border color", isDone: (s) => s.anyBorder },
      { label: "Close the picker: click Border color again", isDone: (s) => s.anyBorder && !s.colorPickerOpen },
    ],
    result: coloredWords,
    ...WORK_IN_PASSAGE,
    allow: both(PASSAGE_AREA, '[data-tour="border-color"]'),
  },

  // Lines again, gloss, word display
  {
    id: "v6-split1-word",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Lines",
    target: (_s, start) => wordSelector(verseSixOriginalLineStart(start, 1)),
    title: "Split verse 6 again",
    body: (_s, start) =>
      `Now put verse 6 back on four lines. Click ${quoted(verseSixOriginalLineStart(start, 1))}, where its second line used to begin.`,
    isDone: (s, start) => selected(s, verseSixOriginalLineStart(start, 1)),
  },
  {
    id: "v6-split1-button",
    section: "Lines",
    target: '[data-tour="structure-newLine"]',
    title: "Click New line",
    body: "Click New line. The selected word, and the words after it on its line, move down to a line of their own.",
    isDone: (s, start) => s.verseSixLineCount > start.verseSixLineCount,
    result: verseSixLinesEverywhere,
  },
  {
    id: "v6-split2-word",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Lines",
    target: (_s, start) => wordSelector(verseSixOriginalLineStart(start, 3)),
    title: "Once more",
    body: (_s, start) => `Click ${quoted(verseSixOriginalLineStart(start, 3))}, where the last line used to begin.`,
    isDone: (s, start) => selected(s, verseSixOriginalLineStart(start, 3)),
  },
  {
    id: "v6-split2-button",
    section: "Lines",
    target: '[data-tour="structure-newLine"]',
    title: "Click New line",
    body: "Click New line again. Verse 6 is back on four lines.",
    isDone: (s, start) => s.verseSixLineCount > start.verseSixLineCount,
    result: verseSixLinesEverywhere,
  },
  {
    id: "gloss-word",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Words",
    target: (_s, start) => wordSelector(start.words[3]),
    title: "Pick a word to re-word",
    body: (_s, start) => `Click ${quoted(start.words[3])} to select it.`,
    isDone: (s, start) => selected(s, start.words[3]),
  },
  {
    id: "gloss-edit",
    section: "Words",
    target: '[data-tour="edit-gloss"]',
    title: "Edit the English gloss",
    body:
      "Click Edit English gloss, type your own wording in the word box and press [ENTER]. Only this study changes; the Hebrew stays as it is.",
    isDone: (s) => s.anyGlossEdit,
    result: (s) => wordById(s.glossEditedWordIds[0]),
    allow: PASSAGE_AREA,
  },
  {
    id: "boxes-off",
    section: "Words",
    target: '[data-tour="boxes"]',
    title: "Read without boxes",
    body: "Click the box button to hide the word boxes and read the English as plain text.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.noBox,
    result: firstLine,
  },
  {
    id: "boxes-on",
    section: "Words",
    target: '[data-tour="boxes"]',
    title: "Turn the boxes back on",
    body: "Click the box button again to bring the word boxes back. Uniform width, next, works on the boxes.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.box,
    result: firstLineEverywhere,
  },
  {
    id: "uniform-width",
    section: "Words",
    target: '[data-tour="uniform-width"]',
    title: "Line up the words",
    body: "Click Enable uniform width. Every box becomes the same width, which makes it easy to compare lines.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.uniformBoxes,
    result: firstLine,
  },
  {
    id: "indent-word",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Words",
    target: (_s, start) => wordSelector(firstWordOfVerse(start, 3)),
    title: "Pick a word to indent",
    body: (_s, start) => `Click ${quoted(firstWordOfVerse(start, 3))}, the first word of verse 3.`,
    isDone: (s, start) => selected(s, firstWordOfVerse(start, 3)),
  },
  {
    id: "indent-add",
    section: "Words",
    target: '[data-tour="indent-add"]',
    title: "Click Add indent",
    body:
      "Click Add indent to shift the word one space to the right, so matching ideas in parallel lines can sit under each other. Remove indent, beside it, moves it back.",
    isDone: (s) => s.anyIndent,
    result: (s) => wordById(s.indentedWordIds[0]),
  },

  // Notes
  {
    id: "notes-on",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Notes",
    target: '[data-tour="notes-toggle"]',
    title: "Open the strophe notes",
    body: "Click the notes button to open a note beside every strophe.",
    isDone: (s) => s.notesOn,
    result: '[data-tour="strophe-note"]',
  },
  {
    id: "notes-write",
    section: "Notes",
    target: PASSAGE,
    title: "Write a note",
    body:
      "Click into any strophe’s note and write something. Put a short title on the first line, press [ENTER], then write your observation underneath.",
    isDone: (s) => s.anyNoteTitle,
    ...WORK_IN_PASSAGE,
    result: (s) => s.titledNoteStropheIds.length ? `[data-strophe-block="${s.titledNoteStropheIds[0]}"]` : undefined,
  },
  {
    id: "notes-format",
    section: "Notes",
    target: '[aria-label="Formatting options"]',
    title: "Format your notes",
    body:
      "The button at the bottom right of a note (or a right-click inside it) opens the formatting menu: text colour, bold, italic, size and more.",
    dim: false,
    allow: PASSAGE_AREA,
  },
  {
    id: "notes-off",
    section: "Notes",
    target: '[data-tour="notes-toggle"]',
    title: "Back to the passage",
    body:
      "Click the notes button again to close the notes. The first line of each note now shows as that strophe’s title.",
    isDone: (s) => !s.notesOn,
    result: (s) => s.titledNoteStropheIds.length ? `[data-strophe-block="${s.titledNoteStropheIds[0]}"]` : undefined,
  },
  {
    id: "stanza-title",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Notes",
    target: '[data-tour="stanza-title"]',
    title: "Name a stanza",
    body: "Each stanza can have a title too. Click just above a stanza’s first line (“Add stanza title…” appears when you hover), type a title and press [ENTER].",
    isDone: (s) => s.anyStanzaTitle,
    dim: false,
    allow: PASSAGE_AREA,
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
    result: INFO_PANE,
  },
  {
    id: "layers-create",
    section: "Layers",
    target: '[data-tour="new-layer"]',
    title: "Create a layer",
    body: "Click the dashed box at the bottom of the tab, type a name for your layer and press [ENTER]. The new layer starts with your current divisions but no colors or notes.",
    isDone: (s, start) => s.layerCount > start.layerCount,
    dim: false,
    allow: INFO_PANE,
    result: INFO_PANE,
  },
  {
    id: "layers-edit",
    onStart: { clearSelection: true },
    section: "Layers",
    target: PASSAGE,
    title: "Work in the new layer",
    body: "In this new layer, add some colors and change at least one division (a line, strophe or stanza).",
    checks: [
      { label: "Add a color", isDone: (s) => s.anyFill || s.anyBorder || s.anyTextColor },
      { label: "Change a division", isDone: (s, start) => structureOf(s) !== structureOf(start) },
    ],
    ...WORK_IN_PASSAGE,
    allow: both(both(PASSAGE_AREA, ALL_TOOL_GROUPS), INFO_PANE),
  },
  {
    id: "layers-back",
    section: "Layers",
    target: (s) => s.firstLayerId === undefined ? '[data-tour="tab-layer"]' : `[data-tour="layer-card"][data-layer-id="${s.firstLayerId}"]`,
    title: "Switch back to your first layer",
    isDone: (s) => s.firstLayerId !== undefined && s.activeLayerId === s.firstLayerId,
    dim: false,
    allow: INFO_PANE,
    body: "Click your first layer. Notice that the colors and divisions you just made are not here: each layer keeps its own work.",
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
