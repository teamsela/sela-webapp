'use client';

import { useState, createContext } from "react";

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";
import InfoPane from "./InfoPane";
import { ColorActionType, InfoPaneActionType, StropheActionType } from "@/lib/types";
import { StudyData, PassageData, HebWord, StropheData } from '@/lib/data';

export const DEFAULT_ZOOM_LEVEL: number = 5;
export const DEFAULT_COLOR_FILL = "#FFFFFF";
export const DEFAULT_BORDER_COLOR = "#D9D9D9";
export const DEFAULT_TEXT_COLOR = "#656565";

export const FormatContext = createContext({
  ctxStudyId: "",
  ctxZoomLevel: DEFAULT_ZOOM_LEVEL,
  ctxIsHebrew: false,
  ctxSelectedHebWords: [] as HebWord[],
  ctxSetSelectedHebWords: (arg: HebWord[]) => {},
  ctxSelectedWords: [] as number[],
  ctxSetSelectedWords: (arg: number[]) => {},
  ctxNumSelectedWords: 0 as number,
  ctxSetNumSelectedWords: (arg: number) => {},
  ctxSelectedStrophes: [] as StropheData[],  
  ctxSetSelectedStrophes: (arg: StropheData[]) => {},
  ctxNumSelectedStrophes: 0 as number,
  ctxSetNumSelectedStrophes: (arg: number) => {},
  ctxStropheCount: 0 as number,
  ctxSetStropheCount: (arg: number) => {},
  ctxColorAction: {} as ColorActionType,
  ctxSelectedColor: "" as string,
  ctxSetSelectedColor: (arg: string) => {},
  ctxColorFill: "" as string,
  ctxSetColorFill: (arg: string) => {},
  ctxBorderColor: "" as string,
  ctxSetBorderColor: (arg: string) => {},
  ctxTextColor: "" as string,
  ctxSetTextColor: (arg: string) => {},
  ctxUniformWidth: false,
  ctxIndentNum: {} as number,
  ctxSetIndentNum: (arg: number) => {},
  ctxInViewMode: false,
  ctxStropheAction: {} as StropheActionType,
  ctxSetStropheAction: (arg: StropheActionType) => {},
});

const StudyPane = ({
  study, content, inViewMode
}: {
  study: StudyData;
  content: PassageData;
  inViewMode: boolean;
}) => {
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);
  const [isHebrew, setHebrew] = useState(false);

  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [numSelectedWords, setNumSelectedWords] = useState(0);
  const [selectedHebWords, setSelectedHebWords] = useState<HebWord[]>([]);
  const [selectedStrophes, setSelectedStrophes] = useState<StropheData[]>([]);
  const [numSelectedStrophes, setNumSelectedStrophes] = useState(0);
  const [stropheCount, setStropheCount] = useState(0);

  const [colorAction, setColorAction] = useState(ColorActionType.none);
  const [selectedColor, setSelectedColor] = useState("");

  const [colorFill, setColorFill] = useState(DEFAULT_COLOR_FILL);
  const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [uniformWidth, setUniformWidth] = useState(false);
  const [indentNum, setIndentNum] = useState(0);

  const [infoPaneAction, setInfoPaneAction] = useState(InfoPaneActionType.none);
  const [stropheAction, setStropheAction] = useState(StropheActionType.none);

  const formatContextValue = {
    ctxStudyId: study.id,
    ctxZoomLevel: zoomLevel,
    ctxIsHebrew: isHebrew,
    ctxSelectedHebWords: selectedHebWords,
    ctxSetSelectedHebWords: setSelectedHebWords,    
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords: setSelectedWords,
    ctxNumSelectedWords: numSelectedWords,
    ctxSetNumSelectedWords: setNumSelectedWords,
    ctxSelectedStrophes: selectedStrophes,
    ctxSetSelectedStrophes: setSelectedStrophes,
    ctxNumSelectedStrophes: numSelectedStrophes,
    ctxSetNumSelectedStrophes: setNumSelectedStrophes,
    ctxColorAction: colorAction,
    ctxSelectedColor: selectedColor,
    ctxSetSelectedColor: setSelectedColor,
    ctxColorFill: colorFill,
    ctxSetColorFill: setColorFill,
    ctxBorderColor: borderColor,
    ctxSetBorderColor: setBorderColor,
    ctxTextColor: textColor,
    ctxSetTextColor: setTextColor,
    ctxUniformWidth: uniformWidth,
    ctxIndentNum: indentNum,
    ctxSetIndentNum: setIndentNum,
    ctxInViewMode: inViewMode,
    ctxStropheAction: stropheAction,
    ctxSetStropheAction: setStropheAction,
    ctxStropheCount: stropheCount,
    ctxSetStropheCount: setStropheCount
  }


  const passageDivStyle = {
    className: `flex-1 whitespace-nowrap ${infoPaneAction != InfoPaneActionType.none ? 'w-3/4' : ''} ${(isHebrew) ? "hbFont" : " "}`
  }

  return (
    <>
      <FormatContext.Provider value={formatContextValue}>
        <Header
          study={study}
          setLangToHebrew={setHebrew}
          setInfoPaneAction={setInfoPaneAction}
          infoPaneAction={infoPaneAction}
        />

        <main className="flex flex-row">
          <div {...passageDivStyle}>

            <Toolbar
              setZoomLevel={setZoomLevel}
              //color functions
              setColorAction={setColorAction}
              setSelectedColor={setSelectedColor}
              setUniformWidth={setUniformWidth}
            />

            <Passage content={content}/>
          </div>
          {
            (infoPaneAction != InfoPaneActionType.none) &&
            <div className="relative top-19 w-1/4 border border-transparent right-0 z-30 h-full bg-white">
              <InfoPane
                infoPaneAction={infoPaneAction}
                setInfoPaneAction={setInfoPaneAction}
              />
            </div>
          }
        </main>
      </FormatContext.Provider>
    </>
  );

};

export default StudyPane;

