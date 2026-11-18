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
};

export type TourCheck = { label: string; isDone: (s: TourSnapshot, start: TourSnapshot) => boolean };

export type TourStep = {
  id: string;
  /** Section name shown above the title, e.g. "Languages". */
  section: string;
  target?: string;
  title: string;
  body: string;
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
  };
};

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
    target: '[data-tour="language-switcher"]',
    title: "See the transliteration",
    body: "Click the small arrow next to א and choose Transliteration to read the Hebrew in English letters.",
    isDone: (s) =>
      s.languageMode === LanguageMode.Hebrew &&
      s.nonEnglishDisplayMode === NonEnglishDisplayMode.HebrewTransliteration,
    // The language dropdown opens right below the switch; keep it clear.
    ...WORK_IN_PASSAGE,
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
    target: '[data-tour="verse-number"]',
    title: "Read a verse in the ESV",
    body: "Click the small verse number 1 to see the verse in the English Standard Version, a regular translation.",
    isDone: (s) => s.esvOpen,
    dim: false,
  },
  {
    id: "esv-close",
    section: "Translation",
    target: '[data-tour="verse-number"]',
    title: "Close it again",
    body: "Click the verse number again to hide the ESV.",
    isDone: (s) => !s.esvOpen,
    dim: false,
  },

  // Strophes
  {
    id: "strophe-heading",
    section: "Strophes",
    target: '[data-tour="group-strophe"]',
    title: "Set the heading apart",
    body:
      "“A Psalm of David” is a heading. Headings and choir directions are not usually part of the poem’s analysis, so we can put them in a strophe of their own. Click the third word, “Yahweh”, then click New strophe.",
    isDone: (s) => s.stropheCount >= 2 && s.firstStropheWordCount === 2,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "strophe-collapse",
    section: "Strophes",
    target: '[data-tour="strophe-collapse"]',
    title: "Collapse a strophe",
    body: "Click the arrow at the top corner of the heading strophe to collapse it out of the way. Clicking it again opens it.",
    isDone: (s) => s.anyStropheCollapsed,
  },
  {
    id: "strophe-explain",
    section: "Strophes",
    title: "What is a strophe?",
    body:
      "A strophe is a small unit of the poem, made of one or more lines that belong together. Its lines share a thought, often with parallel wording, and it ends where the grammar, image, speaker or purpose shifts, much like a paragraph in prose.",
  },
  {
    id: "strophe-divide",
    section: "Strophes",
    target: '[data-tour="group-strophe"]',
    title: "Divide the psalm into strophes",
    body:
      "Make at least two more strophes where you think the psalm turns. Click one word and New strophe to start a strophe there, or select several words in a row and click New strophe to make them a strophe of their own. The words must be next to each other to form a strophe.",
    isDone: (s, start) => s.stropheCount >= start.stropheCount + 2,
    ...WORK_IN_PASSAGE,
  },

  // Stanzas
  {
    id: "stanza-explain",
    section: "Stanzas",
    title: "What is a stanza?",
    body:
      "A stanza is a larger section of a Hebrew poem, made of one or more strophes. A new stanza begins where the theme, image, speaker or direction of the poem shifts, and stanzas show the poem’s overall shape. Because stanzas are built from strophes, you divide the passage into strophes first, then group the strophes into stanzas.",
  },
  {
    id: "stanza-divide",
    section: "Stanzas",
    target: '[data-tour="group-stanza"]',
    title: "Group strophes into stanzas",
    body:
      "Select a strophe with its selector (the small icon at its top corner), then click New stanza to start a new stanza there.",
    isDone: (s) => s.stanzaCount >= 2,
    ...WORK_IN_PASSAGE,
  },

  // Lines
  {
    id: "lines-merge",
    section: "Lines",
    target: '[data-tour="group-line"]',
    title: "Make verse 6 two lines",
    body:
      "Verse 6 is on four lines. Join it into two with Merge with previous line or Merge with next line. Select one word to merge it together with the rest of its line, or select several words to move just those.",
    isDone: (s) => s.verseSixLineCount > 0 && s.verseSixLineCount <= 2,
    ...WORK_IN_PASSAGE,
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
