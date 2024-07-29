export enum ColorActionType {
    none,
    colorFill,
    borderColor,
    textColor,
    resetColor
}

export interface ColorPickerProps {
    setColor: (arg: string) => void;
    setColorAction: (arg: number) => void,
}

export enum InfoPaneActionType {
    none,
    structure,
    motif,
    syntax,
    sounds,
}
  