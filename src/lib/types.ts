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

export type ColorType = {
    colorFill: string;
    borderColor: string;
    textColor: string;
};

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
    structure,
    motif,
    syntax,
    sounds,
}

export enum MotifType {
    none,
    root,
    category,
    related,
}
