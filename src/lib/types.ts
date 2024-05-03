export enum ActiveColorType {
    none,
    colorFill,
    borderColor,
    textColor,
}

export interface ColorPickerProps {
    setColor: (arg: string) => void;
    setColorPickerOpened: (arg: number) => void,
}
  