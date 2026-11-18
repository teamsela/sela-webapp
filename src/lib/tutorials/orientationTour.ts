import { BoxDisplayStyle, InfoPaneActionType } from "@/lib/types";
import {
  INFO_PANE,
  PASSAGE_AREA,
  WORK_IN_PASSAGE,
  allColored,
  allSelected,
  both,
  eachWord,
  firstLine,
  firstLineEverywhere,
  firstWordOfVerse,
  quoted,
  selected,
  stanzaBlock,
  stropheBlock,
  stropheSelector,
  stropheStartingAt,
  wordSelector,
  wordsWithStrong,
  type TourDefinition,
  type TourSnapshot,
  type TourStep,
} from "./tour";

/*
  The guided tour for the Psalm 1 tutorial, "Orienting to the Interface":
  the study screen, structure, colors, the smart tools and layers, in the
  order of the teaching outline. Same rules as the Psalm 23 tour: one word or
  button per step, the result lit up in blue, and Continue to move on.
*/

/** Strong's numbers of the words the tour points at. */
const NOT = 3808; // lo', "not" (verse 1 three times, then verses 3, 4 and 5)
const WAY = 1870; // derek, "way" (verse 1 once, verse 6 twice)
const WALK = 1980; // halak, "does walk" (verse 1)

const FILL = '[data-tour="fill-color"]';
const BORDER = '[data-tour="border-color"]';
const FONT = '[data-tour="font-color"]';
const COLOR_BUTTONS = [FILL, BORDER, FONT].join(", ");
const VERB_CONJUGATIONS = "verb-conjugations";

/** "not" in verse 1: the word to double-click. */
const firstNot = (s: TourSnapshot) => wordsWithStrong(s, NOT)[0];
const nots = (s: TourSnapshot) => wordsWithStrong(s, NOT);
const ways = (s: TourSnapshot) => wordsWithStrong(s, WAY);
const walk = (s: TourSnapshot) => wordsWithStrong(s, WALK)[0];
/** The strophe that starts at verse 4, else the second strophe. */
const verseFourStrophe = (s: TourSnapshot) => stropheStartingAt(s, firstWordOfVerse(s, 4)) ?? s.strophes[1];
const firstStrophe = (s: TourSnapshot) => s.strophes[0];
const firstStanza = (s: TourSnapshot) => s.stanzas[0];
const noteOpen = (s: TourSnapshot, stropheId: number | undefined) =>
  stropheId !== undefined && s.openNoteStropheIds.includes(stropheId);

export const ORIENTATION_TOUR_ID = "orientation-ps1-v1";

export const ORIENTATION_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    section: "Welcome",
    title: "Orienting to the interface",
    body:
      "This tutorial introduces the study screen using Psalm 1. This is a practice copy: try anything you like, nothing you change is saved. Each step tells you what to do and waits until you have done it.",
  },

  // I. Study screen
  {
    id: "word-boxes",
    section: "Study screen",
    target: firstLine,
    title: "Word boxes",
    body:
      "These word boxes are an English rendition of the Hebrew text. They make closer observations possible, right down to the word unit, because the Hebrew word count and word order are preserved.",
  },
  {
    id: "boxes-off",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Study screen",
    target: '[data-tour="boxes"]',
    title: "Turn the boxes off",
    body: "Word boxes can be toggled off and on. Click the box button to hide them and read the English as plain text.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.noBox,
    result: firstLine,
  },
  {
    id: "boxes-on",
    section: "Study screen",
    target: '[data-tour="boxes"]',
    title: "And back on",
    body: "Click the box button again to bring the word boxes back.",
    isDone: (s) => s.boxStyle === BoxDisplayStyle.box,
    result: firstLineEverywhere,
  },
  {
    id: "parallel-views",
    section: "Study screen",
    target: '[data-tour="language-switcher"]',
    title: "Hebrew and translations",
    body:
      "The passage can also be viewed in parallel with the Hebrew or a translation, using these buttons. Note: in a translation, it is not possible to completely tag each word to a Hebrew correspondence.",
  },

  // II. Structure
  {
    id: "structure-explain",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Structure",
    target: (s) => stanzaBlock(firstStanza(s)),
    title: "Lines, strophes and stanzas",
    body:
      "In this passage, the structure has lines, strophes, and stanzas. A line is one row of word boxes, a strophe is a group of lines that belong together, and a stanza is a group of strophes.",
  },
  {
    id: "v4-word",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Structure",
    target: (_s, start) => wordSelector(firstWordOfVerse(start, 4)),
    title: "Try creating a new strophe",
    body: (_s, start) =>
      `Verse 4 turns from the righteous to the wicked. Click ${quoted(firstWordOfVerse(start, 4))}, the first word of verse 4.`,
    isDone: (s, start) => selected(s, firstWordOfVerse(start, 4)),
  },
  {
    id: "v4-new-strophe",
    section: "Structure",
    target: '[data-tour="structure-newStrophe"]',
    title: "Click New strophe",
    body: "Click New strophe. Verse 4 and everything after it moves into a new strophe, so verses 1–3 and 4–6 are now two strophes.",
    isDone: (s) => !!stropheStartingAt(s, firstWordOfVerse(s, 4)),
    result: (s) => stropheBlock(stropheStartingAt(s, firstWordOfVerse(s, 4))),
  },
  {
    id: "stanza-select",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Structure",
    target: (_s, start) => stropheSelector(verseFourStrophe(start)),
    title: "Select strophe 2",
    body: "Strophes can be grouped into stanzas. Try creating a new stanza: click this icon to select strophe 2, the one that begins at verse 4.",
    isDone: (s, start) => {
      const sp = verseFourStrophe(start);
      return !!sp && s.selectedStropheIds.includes(sp.stropheId);
    },
  },
  {
    id: "stanza-new",
    section: "Structure",
    target: '[data-tour="structure-newStanza"]',
    title: "Click New stanza",
    body: "Click New stanza. The selected strophe becomes a stanza of its own: verses 1–3 and verses 4–6.",
    isDone: (s) => s.stanzas.some((st) => st.firstVerse === 4),
    result: (s) => stanzaBlock(s.stanzas.find((st) => st.firstVerse === 4)),
  },
  {
    id: "strophe-heading-open",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Headings",
    target: (_s, start) => {
      const sp = firstStrophe(start);
      return sp ? `[data-tour="strophe-note-open"][data-strophe-id="${sp.stropheId}"]` : undefined;
    },
    title: "Give a strophe a heading",
    body: "Strophes and stanzas can be labeled with headings. Click this pencil to open the first strophe’s note.",
    isDone: (s, start) => noteOpen(s, firstStrophe(start)?.stropheId),
    result: (_s, start) => stropheBlock(firstStrophe(start)),
  },
  {
    id: "strophe-heading-write",
    section: "Headings",
    target: (_s, start) => stropheBlock(firstStrophe(start)),
    title: "Type a heading",
    body: "Click into the note, type a short heading (for example “The righteous”) and press [ENTER]. The first line of a note is the strophe’s heading.",
    isDone: (s) => s.titledNoteStropheIds.length > 0,
    ...WORK_IN_PASSAGE,
  },
  {
    id: "strophe-heading-close",
    section: "Headings",
    target: (_s, start) => {
      const sp = firstStrophe(start);
      return sp ? `[data-tour="strophe-note-open"][data-strophe-id="${sp.stropheId}"]` : undefined;
    },
    title: "Close the note",
    body: "Click the pencil again to close the note. Your heading now sits above the strophe’s words.",
    isDone: (s, start) => !noteOpen(s, firstStrophe(start)?.stropheId),
    result: (_s, start) => stropheBlock(firstStrophe(start)),
  },
  {
    id: "stanza-heading",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Headings",
    target: (_s, start) => {
      const st = firstStanza(start);
      return st ? `[data-tour="stanza-title"][data-stanza-id="${st.stanzaId}"]` : '[data-tour="stanza-title"]';
    },
    title: "Give a stanza a heading",
    body: "Stanzas have headings too. Click just above the first stanza’s first strophe (“Add stanza title…” appears when you hover), type a heading and press [ENTER].",
    isDone: (s) => s.anyStanzaTitle,
    result: (s) => stanzaBlock(firstStanza(s)),
    dim: false,
    allow: PASSAGE_AREA,
  },

  // III. Color tools
  {
    id: "colors-explain",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Color tools",
    target: COLOR_BUTTONS,
    title: "Color tools",
    body:
      "Sela includes a variety of color tools to help keep track of observations: fill, border and font color. Every word unit and strophe can be selected and colored.",
  },
  {
    id: "not-select",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Color tools",
    target: (_s, start) => wordSelector(firstNot(start)),
    title: "Select every “not”",
    body: (_s, start) =>
      `Double-click ${quoted(firstNot(start))} in verse 1. Every place the same Hebrew word appears is selected: all ${nots(start).length} of them.`,
    isDone: (s) => allSelected(s, nots(s)),
    result: (s) => eachWord(nots(s)),
    ...WORK_IN_PASSAGE,
  },
  {
    id: "not-fill",
    section: "Color tools",
    target: FILL,
    title: "Pick a fill color",
    body: "Click Fill color and pick a color. Then click Fill color again to close the color picker.",
    checks: [
      { label: "Fill every “not” with a color", isDone: (s) => allColored(s, nots(s)) },
      { label: "Close the picker: click Fill color again", isDone: (s) => allColored(s, nots(s)) && !s.colorPickerOpen },
    ],
    result: (s) => eachWord(nots(s)),
    ...WORK_IN_PASSAGE,
    allow: both(PASSAGE_AREA, FILL),
  },

  // IV. Smart tools
  {
    id: "motif-tab",
    onStart: { clearSelection: true },
    section: "Smart tools",
    target: '[data-tour="tab-motif"]',
    title: "The smart tools",
    body:
      "Here are the smart tools, under the Structure, Motif, Syntax and Sound tabs. They help explore Hebrew literary and linguistic patterns in the text. Click Motif.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.motif,
    result: INFO_PANE,
  },
  {
    id: "way-chip",
    onStart: { clearSelection: true },
    section: "Smart tools",
    target: `[data-tour="motif-chip"][data-strong="${WAY}"]`,
    title: "Select a chip",
    body: "Each chip connects to a group of words in the passage. This chip highlights all occurrences of “way”. Click it to select them.",
    isDone: (s) => allSelected(s, ways(s)),
    result: (s) => eachWord(ways(s)),
    dim: false,
  },
  {
    id: "way-color",
    section: "Smart tools",
    target: COLOR_BUTTONS,
    title: "Color the “way” words",
    body: "Choose any color: Fill, Border or Font. Then click the same button again to close the color picker.",
    checks: [
      { label: "Color every “way”", isDone: (s) => allColored(s, ways(s)) },
      { label: "Close the picker", isDone: (s) => allColored(s, ways(s)) && !s.colorPickerOpen },
    ],
    result: (s) => eachWord(ways(s)),
    ...WORK_IN_PASSAGE,
    allow: both(both(PASSAGE_AREA, COLOR_BUTTONS), INFO_PANE),
  },
  {
    id: "syntax-tab",
    onStart: { clearSelection: true },
    section: "Smart tools",
    target: '[data-tour="tab-syntax"]',
    title: "The Syntax tab",
    body: "Next, click Syntax.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.syntax,
    result: INFO_PANE,
  },
  {
    id: "verb-conjugations",
    section: "Smart tools",
    target: `[data-tour="syntax-section"][data-section-id="${VERB_CONJUGATIONS}"]`,
    title: "Verb conjugations",
    body:
      "This tool links to a Hebrew linguistic feature: verbal conjugations, like perfect and imperfect forms. Click Verb Conjugations to open it.",
    isDone: (s) => s.openSyntaxSections.includes(VERB_CONJUGATIONS),
    result: INFO_PANE,
    dim: false,
  },
  {
    id: "smart-highlight-on",
    section: "Smart tools",
    target: `[data-tour="syntax-smart-highlight"][data-highlight-id="${VERB_CONJUGATIONS}"]`,
    title: "Try the Smart Highlighter",
    body:
      "This time, try the Smart Highlighter to automatically assign preset high-contrast colors to every chip in the tool. Click Smart Highlight. Note: Smart Highlight replaces the colors already on the passage, so the “not” and “way” colors you added will be cleared.",
    isDone: (s) => s.activeHighlights.syntax === VERB_CONJUGATIONS,
    result: PASSAGE_AREA,
    dim: false,
  },
  {
    id: "smart-highlight-off",
    section: "Smart tools",
    target: `[data-tour="syntax-smart-highlight"][data-highlight-id="${VERB_CONJUGATIONS}"]`,
    title: "Clear the colors",
    body: "Click the same button (now Clear Highlight) to clear the colors again.",
    isDone: (s) => s.activeHighlights.syntax !== VERB_CONJUGATIONS,
    dim: false,
  },
  {
    id: "walk-word",
    onStart: { clearSelection: true, closeInfoPane: true },
    section: "Smart tools",
    target: (_s, start) => wordSelector(walk(start)),
    title: "The data behind the tools",
    body: (_s, start) =>
      `These tools draw on Hebrew linguistic data stored in each Hebrew word unit. Click ${quoted(walk(start))} in verse 1 to select it.`,
    isDone: (s, start) => selected(s, walk(start)),
  },
  {
    id: "word-info",
    section: "Smart tools",
    target: '[data-tour="word-info"]',
    title: "Show Word Information",
    body:
      "Open Word Information to see that data for the selected word. The tools work beautifully with Sela’s English gloss, since it is a word-by-word rendition of the Hebrew text. Most of the smart tools do not work with translations, because translations were not designed to reflect Hebrew syntax.",
    isDone: (s) => s.wordInfoOpen,
    result: "#word-information-bar",
  },

  // V. Layers
  {
    id: "layers-tab",
    onStart: { clearSelection: true },
    section: "Layers",
    target: '[data-tour="tab-layer"]',
    title: "Layers",
    body: "Click Layer. All strophe divisions and colors are saved to individual layers, where you can also write detailed notes.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.layers,
    result: INFO_PANE,
  },
  {
    id: "layers-new",
    section: "Layers",
    target: '[data-tour="new-layer"]',
    title: "A new layer for a new idea",
    body:
      "When you want to explore a different facet of the poem, create a new layer here, with new headings and new notes.",
    dim: false,
  },

  // VI. Closing
  {
    id: "finish",
    section: "Done",
    title: "You’re all set!",
    body: "Start your own study, or explore more tutorials.",
  },
];

export const ORIENTATION_TOUR: TourDefinition = {
  id: ORIENTATION_TOUR_ID,
  steps: ORIENTATION_TOUR_STEPS,
  finish: "next",
};
