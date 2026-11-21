import { BoxDisplayStyle, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import {
  ALL_TOOL_GROUPS,
  ESV_WITH_POPOVER,
  INFO_PANE,
  NoteEntry,
  PASSAGE_AREA,
  TourCheck,
  TourDefinition,
  TourSnapshot,
  TourSources,
  TourStanza,
  TourStep,
  TourStrophe,
  TourWord,
  WORK_IN_PASSAGE,
  anyNoteTitleIn,
  both,
  buildTourSnapshot,
  coloredWords,
  firstLine,
  firstLineEverywhere,
  firstWordAfterHeading,
  firstWordOfVerse,
  isActionStep,
  isStepDone,
  lastWordOnVerseSixLine,
  linesStartingWith,
  quoted,
  resolveBody,
  resolveResult,
  resolveTarget,
  selected,
  stanzaBlock,
  stanzaStrophe,
  stropheBlock,
  stropheSelector,
  stropheStartingAt,
  structureOf,
  titledNoteIndexes,
  verseSixArea,
  verseSixLinesEverywhere,
  verseSixOriginalLineStart,
  wordById,
  wordSelector,
  yahwehInVerseOne,
} from "./tour";

/*
  The guided tour for the Psalm 23 Interface Tutorial. The engine (snapshot,
  step type, helpers) is in ./tour.ts.
*/

export * from "./tour";

/* ------------------------------------------------------------------------ */
/* Steps                                                                     */
/* ------------------------------------------------------------------------ */

export const INTERFACE_TOUR_ID = "interface-v5";

const PASSAGE = '[data-strophe-line="true"]';
const SELECT_REPEATS = '[data-tour="select-repeats"]';

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
    phone: {
      target: '[data-tour="more-menu"], [data-tour="hebrew-display"]',
      body: "Open ⋯ at the top right and, under Show Hebrew as, tap Abc to read the Hebrew in English letters.",
      placement: "near",
    },
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
    phone: {
      target: (_s, start) => `${wordSelector(yahwehInVerseOne(start))}, ${SELECT_REPEATS}`,
      body:
        "Tap this word, \u201cYahweh\u201d, then Select repeats in the bar at the bottom. Every place the same Hebrew word appears in the passage is selected. Hebrew poetry often repeats key words to tie a poem together, and here God’s name frames the whole psalm.",
      allow: both(PASSAGE_AREA, SELECT_REPEATS),
    },
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
    phone: {
      body:
        "Tap Info in the bar at the bottom. It shows the selected word in Hebrew, its transliteration, English gloss and grammar, and Open word analysis gives a fuller one.",
      result: '[data-tour="word-info-sheet"]',
    },
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
    phone: {
      body: "With words selected (the repeated “Yahweh” from before, or any others you tap), open the colors panel (Color in the bar at the bottom), choose Fill and pick a color for the background. Then tap Done.",
      checks: [
        { label: "Pick a fill color", isDone: (s) => s.anyFill },
        { label: "Close the colors: tap Done", isDone: (s) => s.anyFill && !s.colorPickerOpen },
      ],
    },
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
    phone: {
      body: "open the colors panel (Color in the bar at the bottom), choose Text and pick a color for the text itself. Then tap Done.",
      checks: [
        { label: "Pick a font color", isDone: (s) => s.anyTextColor },
        { label: "Close the colors: tap Done", isDone: (s) => s.anyTextColor && !s.colorPickerOpen },
      ],
    },
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
    phone: {
      body: "open the colors panel (Color in the bar at the bottom), choose Border and pick a color for the box around each word. Then tap Done.",
      checks: [
        { label: "Pick a border color", isDone: (s) => s.anyBorder },
        { label: "Close the colors: tap Done", isDone: (s) => s.anyBorder && !s.colorPickerOpen },
      ],
    },
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
    // Opening the notes and writing in one are one step, so a note can be
    // typed in as soon as it shows.
    id: "notes-on",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Notes",
    target: '[data-tour="notes-toggle"], [data-tour="strophe-note"]',
    title: "Write a strophe note",
    body:
      "Click the notes button to open a note beside every strophe. Then click into any note and write something: a short title on the first line, press [ENTER], then your observation underneath.",
    checks: [
      { label: "Open the notes", isDone: (s) => s.notesOn || s.anyNoteTitle },
      { label: "Write a title and press [ENTER]", isDone: (s) => s.anyNoteTitle },
    ],
    allow: PASSAGE_AREA,
    result: (s) => (s.titledNoteStropheIds.length ? `[data-strophe-block="${s.titledNoteStropheIds[0]}"]` : undefined),
    // Phones have no room for notes beside strophes: each strophe opens its own.
    phone: {
      target: '[data-tour="strophe-note-open"], [data-tour="strophe-note"]',
      title: "Write a strophe note",
      body:
        "Tap the note button at the top of a strophe: its note opens in place of its words. Then tap into the note and write something: a short title on the first line, press [ENTER], then your observation underneath.",
      checks: [
        { label: "Open a strophe’s note", isDone: (s) => s.openNoteStropheIds.length > 0 || s.anyNoteTitle },
        { label: "Write a title and press [ENTER]", isDone: (s) => s.anyNoteTitle },
      ],
    },
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
    phone: {
      target: (s) =>
        s.openNoteStropheIds.length
          ? `[data-tour="strophe-note-open"][data-strophe-id="${s.openNoteStropheIds[0]}"]`
          : '[data-tour="strophe-note-open"]',
      body: "Tap the note button again to close the note. Its first line now shows as the strophe’s title.",
      isDone: (s) => s.openNoteStropheIds.length === 0,
    },
    result: (s) => s.titledNoteStropheIds.length ? `[data-strophe-block="${s.titledNoteStropheIds[0]}"]` : undefined,
  },
  {
    id: "stanza-title",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Notes",
    target: '[data-tour="stanza-title"]',
    title: "Name a stanza",
    body: "Each stanza can have a title too. Click the space just above a stanza’s first line (it reads “Add stanza title…”), type a title and press [ENTER].",
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
    panel: InfoPaneActionType.layers,
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
    panel: InfoPaneActionType.layers,
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

export const INTERFACE_TOUR: TourDefinition = {
  id: INTERFACE_TOUR_ID,
  steps: INTERFACE_TOUR_STEPS,
  finish: "copy",
};
