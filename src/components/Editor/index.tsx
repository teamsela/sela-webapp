'use client';

import { useState, createContext } from "react";

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";
import { ActiveColorType } from "@/lib/types";
import { StudyData, PassageData } from '@/lib/data';

const DEFAULT_ZOOM_LEVEL : number = 5;
const DEFAULT_COLOR_FILL = "#FFFFFF";
const DEFAULT_BORDER_COLOR = "#656565";
const DEFAULT_TEXT_COLOR = "#000000";

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

    const [colorFill, setColorFill] = useState(DEFAULT_COLOR_FILL);
    const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
    const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);

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

