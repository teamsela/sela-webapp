'use client';

import { useState, createContext } from "react";

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";
import { ColorActionType } from "@/lib/types";
import { StudyData, PassageData } from '@/lib/data';

export const DEFAULT_ZOOM_LEVEL : number = 5;
export const DEFAULT_COLOR_FILL = "#FFFFFF";
export const DEFAULT_BORDER_COLOR = "#656565";
export const DEFAULT_TEXT_COLOR = "#656565";

export const FormatContext = createContext({
  ctxStudyId: "",
  ctxZoomLevel: DEFAULT_ZOOM_LEVEL,
  ctxIsHebrew: false,
  ctxSelectedWords: [] as number[],
  ctxSetSelectedWords: (arg: number[]) => {},
  ctxHasSelectedWords: false,
  ctxSetHasSelectedWords: (arg: boolean) => {},
  ctxColorAction: {} as number,
  ctxColorFill: "" as string,
  ctxBorderColor: "" as string,
  ctxTextColor: "" as string,
  uniformSize: true
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

    const [colorAction, setColorAction] = useState(ColorActionType.none);

    const [colorFill, setColorFill] = useState(DEFAULT_COLOR_FILL);
    const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
    const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
    const [uniformTextSize, setUniformTextSize] = useState(true);

    const formatContextValue = {
      ctxStudyId: study.id,
      ctxZoomLevel: zoomLevel,
      ctxIsHebrew: isHebrew,
      ctxSelectedWords: selectedWords,
      ctxSetSelectedWords: setSelectedWords,
      ctxHasSelectedWords: hasSelectedWords,
      ctxSetHasSelectedWords: setHasSelectedWords,
      ctxColorAction: colorAction,
      ctxColorFill: colorFill,
      ctxBorderColor: borderColor,
      ctxTextColor: textColor,
      uniformSize: uniformTextSize
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
            setColorAction={setColorAction}
            setColorFill={setColorFill}
            setBorderColor={setBorderColor}
            setTextColor={setTextColor}
            setUniformWidth={setUniformTextSize}
          />
          <main className="flex">
            <div {...passageDivStyle}>
              <Passage content={content} />
            </div>
          </main>
        </FormatContext.Provider>
        </>
      );

  };
  
  export default Editor;

