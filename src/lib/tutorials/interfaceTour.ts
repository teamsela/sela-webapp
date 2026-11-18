import { InfoPaneActionType } from "@/lib/types";

/*
  The guided tour for the Psalm 23 Interface Tutorial (trial version).

  Each step points at one element (a CSS selector, usually a data-tour
  marker), says what to do, and says how to tell it was done. Steps with no
  target are shown as a centered card (welcome and finish). Steps with no
  `isDone` move on with the Next button only.
*/

/** What the tour can see of the study screen when checking a step. */
export type TourSnapshot = {
  selectedWordCount: number;
  anyWordFilled: boolean;
  wordInfoOpen: boolean;
  infoPaneAction: InfoPaneActionType;
};

export type TourStep = {
  id: string;
  target?: string;
  title: string;
  body: string;
  isDone?: (snapshot: TourSnapshot) => boolean;
  /** Extra space between target and bubble, for controls that open a panel below themselves. */
  clearance?: number;
  /** Dim the rest of the screen (default true). Off when the user must work in a panel that opens elsewhere. */
  dim?: boolean;
};

export const INTERFACE_TOUR_ID = "interface-v1";

export const INTERFACE_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Sela",
    body:
      "This short tour shows you around the study screen using Psalm 23. This is a practice copy: try anything you like, nothing you change is saved.",
  },
  {
    id: "select-word",
    target: '[data-strophe-line="true"]',
    title: "Select a word",
    body: "Click any word in this first line, such as the word for “shepherd”. The word you click is selected.",
    isDone: (s) => s.selectedWordCount > 0,
  },
  {
    id: "word-info",
    target: '[data-tour="word-info"]',
    title: "See what it means",
    body: "Open Word Information to see the selected word in Hebrew, how to pronounce it, its English gloss and its grammar.",
    isDone: (s) => s.wordInfoOpen,
  },
  {
    id: "fill-color",
    target: '[data-tour="fill-color"]',
    title: "Mark it with color",
    body: "With the word still selected, click Fill color and pick a color. Colors are how you mark repeated words and parallel ideas.",
    isDone: (s) => s.anyWordFilled,
    // The color picker opens about 200px below the button; keep it clear and undimmed.
    clearance: 210,
    dim: false,
  },
  {
    id: "syntax-tab",
    target: '[data-tour="tab-syntax"]',
    title: "Look closer at the grammar",
    body: "Open the Syntax tab. It highlights grammar patterns across the psalm, such as where David speaks of the LORD as “he” and where he turns to speak to him as “you”.",
    isDone: (s) => s.infoPaneAction === InfoPaneActionType.syntax,
  },
  {
    id: "finish",
    title: "That’s the tour",
    body:
      "You selected a word, looked it up, marked it with color and opened a study tool. Keep exploring this practice copy, or use Copy to My Studies to keep your work.",
  },
];
