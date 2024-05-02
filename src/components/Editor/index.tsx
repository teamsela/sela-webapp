'use client';

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";

import { StudyData, PassageData } from '@/lib/data';

import { useState, createContext } from "react";

const DEFAULT_ZOOM_LEVEL : number = 5;
const DEFAULT_COLOR_FILL = "#FFFFFF";

enum ActiveColorType {
  none,
  colorFill,
  borderColor,
  textColor,
}

export const FormatContext = createContext({ 
  ctxZoomLevel: DEFAULT_ZOOM_LEVEL,
  ctxIsHebrew: false,
  ctxSelectedWords: [] as number[],
  ctxSetSelectedWords: (arg: number[]) => {},
  ctxHasSelectedWords: false,
  ctxSetHasSelectedWords: (arg: boolean) => {},
  ctxColorPickerOpened: {} as number,
  ctxColorFill: "" as string,
  ctxBorderColor: "" as string,
  ctxActiveColorType: ActiveColorType,
});

const Editor = ({ 
    study, content
  }: {
    study: StudyData;
    content: PassageData;
  }) => {
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
    const [isHebrew, setHebrew] = useState(false);

    const [selectedWords, setSelectedWords] = useState<number[]>([]);
    const [hasSelectedWords, setHasSelectedWords] = useState(false);

    const [colorPickerOpened, setColorPickerOpened] = useState(ActiveColorType.none);

    const [colorFill, setColorFill] = useState( DEFAULT_COLOR_FILL )
    //todo: assign border and text color to their corresponding buttons in Buttons.tsx
    const [borderColor, setBorderColor] = useState( "#656565" )
    const [textColor, setTextColor] = useState( "#000000" )


    const formatContextValue = {
      ctxZoomLevel: zoomLevel,
      ctxIsHebrew: isHebrew,
      ctxSelectedWords: selectedWords,
      ctxSetSelectedWords: setSelectedWords,
      ctxHasSelectedWords: hasSelectedWords,
      ctxSetHasSelectedWords: setHasSelectedWords,
      ctxColorPickerOpened: colorPickerOpened,
      ctxColorFill: colorFill,
      ctxBorderColor: borderColor,
      ctxActiveColorType: ActiveColorType,
    }

    const passageDivStyle = {
      className: `mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 overflow-x-auto whitespace-nowrap ${(isHebrew) ? "" : " mr-8"}`
    }

    return (
        <>
        <FormatContext.Provider value={formatContextValue}>
          <Header study={study} setLangToHebrew={setHebrew} />
          <Toolbar 
            setZoomLevel={setZoomLevel}
            //color functions
            setColorPickerOpened={setColorPickerOpened}
            setColorFill={setColorFill}
            setBorderColor={setBorderColor}
          />
          <main>
            <div {...passageDivStyle}>
              <Passage content={content} />
            </div>
          </main>
        </FormatContext.Provider>
        </>
      );

  };
  
  export default Editor;

