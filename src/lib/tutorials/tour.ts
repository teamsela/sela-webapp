import { BoxDisplayStyle, ColorActionType, InfoPaneActionType, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import type { LayerDef, PassageProps, StudyMetadata, WordProps } from "@/lib/data";

/*
  The tutorial tour engine, shared by every tutorial (see ./tours.ts for which
  tour a tutorial study runs, and ./interfaceTour.ts, ./orientationTour.ts for
  the steps).

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
  /** Strophes whose own note is open in place of their words (the pencil icon). */
  openNoteStropheIds: number[];
  /** Syntax tab sections that are expanded, by id (e.g. "verb-conjugations"). */
  openSyntaxSections: string[];
  /** The Smart Highlight that is on, per tool (e.g. syntax: "verb-conjugations"). */
  activeHighlights: Record<string, string | null>;
};

export type TourWord = {
  wordId: number;
  verse: number;
  gloss: string;
  /** The Hebrew word's Strong's number: the same for every occurrence of the word. */
  strongNumber?: number;
  /** starts a line in the passage's original layout */
  lineStart?: boolean;
};
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
  /**
    What changes on a phone (under 640px), where the tools sit in the bottom
    bar and its menus instead of a toolbar. See `forLayout`.
  */
  phone?: Partial<Omit<TourStep, "id" | "section" | "phone">>;
};

/* ------------------------------------------------------------------------ */
/* Phones, tablets and foldables                                             */
/* ------------------------------------------------------------------------ */

export type TourLayout = "phone" | "tablet" | "tabletWide" | "desktop";

/** Words for a touch screen: tap rather than click, no right-click or hover. */
export const touchWords = (text: string) =>
  text
    .replace(/ \(or a right-click inside it\)/g, "")
    .replace(/Double-click/g, "Double-tap")
    .replace(/double-click/g, "double-tap")
    .replace(/Clicking/g, "Tapping")
    .replace(/clicking/g, "tapping")
    .replace(/\bClicks?\b/g, (m) => (m.endsWith("s") ? "Taps" : "Tap"))
    .replace(/\bclicks?\b/g, (m) => (m.endsWith("s") ? "taps" : "tap"));

// On a phone the structure, word and color buttons live in the bottom bar's
// menus (Line, Strophe, Stanza, Word, Color), which open once something is
// selected. Lighting the menu's button with the control means the user can
// always see where it is, open or closed.
const PHONE_GROUP_BUTTONS: [RegExp, string][] = [
  [/data-tour="structure-[A-Za-z]*Line"/, '[data-tour="dock-line"]'],
  [/data-tour="structure-[A-Za-z]*Strophe"/, '[data-tour="dock-strophe"]'],
  [/data-tour="structure-[A-Za-z]*Stanza"/, '[data-tour="dock-stanza"]'],
  [/data-tour="(indent-add|indent-remove|edit-gloss)"/, '[data-tour="dock-word"]'],
  [/data-tour="(fill|border|font)-color"/, '[data-tour="dock-color"]'],
];

export const withPhoneGroupButton = (target: string | undefined) => {
  if (!target) return target;
  const extra = PHONE_GROUP_BUTTONS.find(([re]) => re.test(target))?.[1];
  return extra && !target.includes(extra) ? `${target}, ${extra}` : target;
};

const GROUP_NAMES: [RegExp, string, string][] = [
  // [control, phone bar button, tablet ribbon group]
  [/data-tour="structure-[A-Za-z]*Line"/, "Line", "Line"],
  [/data-tour="structure-[A-Za-z]*Strophe"/, "Strophe", "Strophe"],
  [/data-tour="structure-[A-Za-z]*Stanza"/, "Stanza", "Stanza"],
  [/data-tour="(indent-add|indent-remove|edit-gloss)"/, "Word", "Word"],
  [/data-tour="(boxes|uniform-width)"/, "", "Word"],
  [/data-tour="(fill|border|font)-color"/, "Color", "Format"],
];

/**
  On phones and tablets a step's control can sit in a menu the user has to
  open first (the phone bar's Strophe menu, the ribbon's Strophe group). The
  tutorial lights that menu's button too and says to open it, rather than
  opening it for them.
*/
const menuLeadIn = (target: string | undefined, layout: TourLayout): { name: string; marker: string; lead: string } | undefined => {
  if (!target || (layout !== "phone" && layout !== "tablet")) return undefined;
  const hit = GROUP_NAMES.find(([re]) => re.test(target));
  if (!hit) return undefined;
  const name = layout === "phone" ? hit[1] : hit[2];
  if (!name) return undefined;
  return layout === "phone"
    ? { name, marker: `[data-tour="dock-${name.toLowerCase()}"]`, lead: `In the bar at the bottom, open ${name}.` }
    : { name, marker: `[data-tour="ribbon-${name}"]`, lead: `In the toolbar, choose ${name}.` };
};

/** "In the bar at the bottom, open Strophe. Then tap New strophe. …" */
const withLeadIn = (lead: string) => (text: string) =>
  /^Tap /.test(text) ? `${lead} Then tap ${text.slice(4)}` : `${lead} ${text}`;

const mapText = (
  value: TourStep["body"] | undefined,
  fn: (text: string) => string,
): TourStep["body"] | undefined =>
  value === undefined ? undefined : typeof value === "string" ? fn(value) : (s, start) => fn(value(s, start));

/**
  The step as it should run at this screen size: on a phone, its `phone`
  changes, and controls that sit in the bottom bar's menus lit with the
  menu's button; on phones and tablets, touch wording.
*/
export const forLayout = (step: TourStep, layout: TourLayout): TourStep => {
  let out: TourStep = step;
  if (layout === "phone") {
    out = { ...step, ...(step.phone ?? {}) };
    if (typeof out.target === "string") out = { ...out, target: withPhoneGroupButton(out.target) };
  }
  if (layout === "phone" || layout === "tablet") {
    out = {
      ...out,
      title: touchWords(out.title),
      body: mapText(out.body, touchWords) as TourStep["body"],
      checks: out.checks?.map((c) => ({ ...c, label: touchWords(c.label) })),
    };
    // A control in a menu: say to open the menu first (unless the phone
    // wording already does), and light the menu's button.
    const menu = isActionStep(out) && typeof step.target === "string" ? menuLeadIn(step.target, layout) : undefined;
    if (menu) {
      const target = typeof out.target === "string" && !out.target.includes(menu.marker) ? `${out.target}, ${menu.marker}` : out.target;
      const explained = layout === "phone" && step.phone?.body !== undefined;
      out = { ...out, target, body: explained ? out.body : (mapText(out.body, withLeadIn(menu.lead)) as TourStep["body"]) };
    }
  }
  return out;
};

export const PASSAGE_AREA = '[data-tour="passage-area"]';
export const INFO_PANE = '[data-tour="info-pane"]';
export const WORK_IN_PASSAGE = { dim: false, placement: "corner", allow: PASSAGE_AREA } as const;

// Verse 1's number (the only one marked) and any open ESV box.
export const ESV_WITH_POPOVER = '[data-tour="verse-number"], [data-tour="esv-popover"][data-open="true"]';

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

export type NoteEntry = { title?: string };

export const titledNoteIndexes = (studyNotes: string | undefined, layerId: number): number[] => {
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

export const anyNoteTitleIn = (studyNotes: string | undefined): boolean => {
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
  /** Read from the page: open strophe notes and expanded Syntax sections. */
  openNoteStropheIds?: number[];
  openSyntaxSections?: string[];
  activeHighlights?: Record<string, string | null>;
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
        strongNumber: w.strongNumber,
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
    openNoteStropheIds: src.openNoteStropheIds ?? [],
    openSyntaxSections: src.openSyntaxSections ?? [],
    activeHighlights: src.activeHighlights ?? {},
  };
};

/* Passage helpers for steps that point at one word or strophe. */

export const wordSelector = (w: TourWord | undefined) => (w ? `[data-word-id="${w.wordId}"]` : undefined);
export const quoted = (w: TourWord | undefined) => (w?.gloss ? `\u201c${w.gloss}\u201d` : "the highlighted word");
export const firstWordOfVerse = (s: TourSnapshot, verse: number) => s.words.find((w) => w.verse === verse);
export const stropheStartingAt = (s: TourSnapshot, w: TourWord | undefined) =>
  w ? s.strophes.find((sp) => sp.firstWordId === w.wordId) : undefined;
/** The heading ends after the first two words ("A Psalm" "of David"). */
export const firstWordAfterHeading = (s: TourSnapshot) => s.words[2];

/** Last word on line `index` of verse 6 (negative counts from the end). */
export const lastWordOnVerseSixLine = (s: TourSnapshot, index: number) => {
  const line = s.verseSixLines.at(index);
  return line?.[line.length - 1];
};

export const selected = (s: TourSnapshot, w: TourWord | undefined) => !!w && s.selectedWordIds.includes(w.wordId);

export const ALL_TOOL_GROUPS =
  '[data-tour="group-format"], [data-tour="group-word"], [data-tour="group-line"], [data-tour="group-strophe"], [data-tour="group-stanza"]';

export const wordById = (id: number | undefined) => (id === undefined ? undefined : `[data-word-id="${id}"]`);
export const stropheBlock = (sp: TourStrophe | undefined) => (sp ? `[data-strophe-block="${sp.stropheId}"]` : undefined);
export const stanzaBlock = (st: TourStanza | undefined) => (st ? `[data-stanza-block="${st.stanzaId}"]` : undefined);
export const stropheSelector = (sp: TourStrophe | undefined) =>
  sp ? `[data-tour="strophe-select"][data-strophe-id="${sp.stropheId}"]` : undefined;
export const both = (a: string | undefined, b: string | undefined) => [a, b].filter(Boolean).join(", ") || undefined;
/** Verse 6 from its first to its last word. */
export const verseSixArea = (s: TourSnapshot) => {
  const v6 = s.words.filter((w) => w.verse === 6);
  return both(wordSelector(v6[0]), wordSelector(v6[v6.length - 1]));
};
export const firstLine = '[data-strophe-line="true"]';
/** Whole lines, in every pane (English and Hebrew), from edge to edge. */
export const linesStartingWith = (wordIds: number[]) =>
  wordIds.map((id) => `all:[data-line-start="${id}"]`).join(", ") || undefined;
export const firstLineEverywhere = (s: TourSnapshot) =>
  s.firstLineStart === undefined ? firstLine : linesStartingWith([s.firstLineStart]);
export const verseSixLinesEverywhere = (s: TourSnapshot) => linesStartingWith(s.verseSixLineStarts);
/** Where verse 6's lines start in the passage's original layout. */
export const verseSixOriginalLineStart = (s: TourSnapshot, index: number) =>
  s.words.filter((w) => w.verse === 6 && w.lineStart).at(index);
export const coloredWords = (s: TourSnapshot) =>
  both(wordById(s.coloredWordIds[0]), wordById(s.coloredWordIds[s.coloredWordIds.length - 1]));

/** God's name in verse 1 (glossed "Yahweh [is]"), else the first word after the heading. */
export const yahwehInVerseOne = (s: TourSnapshot) =>
  s.words.find((w) => w.verse === 1 && /yahweh/i.test(w.gloss)) ?? firstWordAfterHeading(s);

/** The strophe to move into a new stanza: the one starting at verse 4, else the second. */
export const stanzaStrophe = (s: TourSnapshot) =>
  stropheStartingAt(s, firstWordOfVerse(s, 4)) ?? s.strophes[1];

export const structureOf = (s: TourSnapshot) => `${s.stanzaCount}/${s.stropheCount}/${s.lineCount}`;

/** Every occurrence of a Hebrew word (by Strong's number), in reading order. */
export const wordsWithStrong = (s: TourSnapshot, strongNumber: number) =>
  s.words.filter((w) => w.strongNumber === strongNumber);
export const allSelected = (s: TourSnapshot, words: TourWord[]) =>
  words.length > 0 && words.every((w) => s.selectedWordIds.includes(w.wordId));
export const allColored = (s: TourSnapshot, words: TourWord[]) =>
  words.length > 0 && words.every((w) => s.coloredWordIds.includes(w.wordId));
/** Each of these words, lit up wherever it is in the passage. */
export const eachWord = (words: TourWord[]) =>
  words.map((w) => `[data-word-id="${w.wordId}"]`).join(", ") || undefined;

/* ------------------------------------------------------------------------ */
/* Tours                                                                     */
/* ------------------------------------------------------------------------ */

export type TourDefinition = {
  /** Keys this tour's progress in the browser; change it when the steps change a lot. */
  id: string;
  steps: TourStep[];
  /**
    The last card's buttons. "copy": Restart, Keep exploring, Copy to My
    Studies. "next": Restart, More tutorials, Start your own study.
  */
  finish: "copy" | "next";
};
