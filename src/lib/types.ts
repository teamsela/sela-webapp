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

export enum StropheActionType {
    none,
    new,
    mergeUp,
    mergeDown
}

export enum InfoPaneActionType {
    none,
    structure,
    motif,
    syntax,
    sounds,
}
