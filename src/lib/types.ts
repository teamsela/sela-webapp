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
    notes,
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

import type { RichDoc } from "./richText";

// `title` stays single-line plain text (shown on the strophe when notes are
// inactive); `text` is a rich-text doc after the upgrade, legacy plain string
// before it (migrated on read).
export type StropheNote = { title: string; text: string | RichDoc, firstWordId: number , lastWordId: number};
// `main` is a rich-text ProseMirror doc for notes created/edited after the rich
// text upgrade; legacy studies store a plain string and are migrated on read.
export type StudyNotes = { version?: number; main: string | RichDoc; strophes: StropheNote[] };
