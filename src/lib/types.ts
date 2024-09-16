export enum ColorActionType {
    none,
    colorFill,
    borderColor,
    textColor,
    resetColor
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
    mergeWithNextStrophe
}

export enum InfoPaneActionType {
    none,
    structure,
    motif,
    syntax,
    sounds,
}
