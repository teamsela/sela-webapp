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

export type StropheNote = { title: string; text: string, firstWordId: number , lastWordId: number};
export type StudyNotes = { main: string; strophes: StropheNote[] };