import type { RichDoc } from "./richText";

export enum ColorActionType {
    none,
    colorFill,
    borderColor,
    textColor,
    resetColor,
    resetAllColor
}

// Box display style options
export enum BoxDisplayStyle {
    noBox,          // No boxes around words
    box,            // Show boxes with variable width
    uniformBoxes    // Show boxes with uniform width
}

// Box display configuration using enum
export interface BoxDisplayConfig {
    style: BoxDisplayStyle;
}

export enum LanguageMode {
    English,
    Parallel,
    Hebrew
}

export enum NonEnglishDisplayMode {
    Hebrew,
    Transliteration,
    HebrewTransliteration
}

export interface ColorPickerProps {
    colorAction: ColorActionType,
    setSelectedColor: (arg: string) => void;
    setColorAction: (arg: number) => void,
}

export enum StructureUpdateType {
    none,
    newLine,
    mergeWithPrevLine,
    mergeWithNextLine,
    newStrophe,
    mergeWithPrevStrophe,
    mergeWithNextStrophe,
    newStanza,
    mergeWithPrevStanza,
    mergeWithNextStanza
}

export enum InfoPaneActionType {
    none,
    layers,
    structure,
    motif,
    syntax,
    sounds,
}

export enum MotifType {
    none,
    identical,
    category,
}

export enum SyntaxType {
    none,
    partsOfSpeech,
    verbalConjugations,
    verbalStems,
    personsGenderNumber
}

// `title` stays single-line plain text (shown on the strophe when notes are
// inactive); `text` is a rich-text doc after the upgrade, legacy plain string
// before it (migrated on read).
export type StropheNote = { title: string, text: string | RichDoc, firstWordId: number , lastWordId: number };
// A layer's own note plus its per-strophe notes. `text` is rich-text after the
// upgrade, legacy plain string before it (migrated on read).
export type LayerNote = { text: string | RichDoc, strophes: StropheNote[] };
export type StudyNotes = {
  version?: number;
  main: string | RichDoc;                          // rich-text after upgrade; legacy plain string migrated on read
  strophes?: StropheNote[];                         // root-level strophes (legacy / layer-0 fallback)
  layers?: LayerNote[];                             // reserved for future structured per-layer notes
  layerNotes?: Record<string, string | RichDoc>;   // per-layer main note keyed by layer id
  layerStrophes?: Record<string, StropheNote[]>;   // per-layer strophe notes keyed by layer id
};
