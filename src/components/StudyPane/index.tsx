'use client';

import { useState, createContext } from "react";

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";
import { ColorActionType, InfoPaneActionType } from "@/lib/types";
import { StudyData, PassageData, HebWord } from '@/lib/data';
import Sidebar from "../Sidebar";
import InfoPane from "./InfoPane";

export const DEFAULT_ZOOM_LEVEL: number = 5;
export const DEFAULT_COLOR_FILL = "#FFFFFF";
export const DEFAULT_BORDER_COLOR = "#D9D9D9";
export const DEFAULT_TEXT_COLOR = "#656565";

export const FormatContext = createContext({
  ctxStudyId: "",
  ctxZoomLevel: DEFAULT_ZOOM_LEVEL,
  ctxIsHebrew: false,
  ctxSelectedWords: [] as number[],
  ctxSetSelectedWords: (arg: number[]) => { },
  ctxNumSelectedWords: {} as number,
  ctxSetNumSelectedWords: (arg: number) => { },
  ctxColorAction: {} as number,
  ctxColorFill: "" as string,
  ctxBorderColor: "" as string,
  ctxTextColor: "" as string,
  ctxUniformWidth: false,
  ctxIndentWord: [] as number[],
  ctxSetIndentWord: (arg: number[]) => { },
  ctxContent: {} as PassageData,
  ctxInViewMode: false,
  ctxNewStropheEvent: false,
  ctxSetNewStropheEvent: (arg: boolean) => {},
  ctxMergeStropheEvent: "" as string,
  ctxSetMergeStropheEvent: (arg: string) => {},
  ctxWordArray: [] as HebWord[],
  ctxSetWordArray: (arg:HebWord[]) => {},
  ctxStructuredWords: [] as HebWord[][][],
  ctxSetStructuredWords: (arg:HebWord[][][]) => {},
  ctxCurrentStrophe: 0 as number,
  ctxSetCurrentStrophe: (arg:number) => {}
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

  const [colorAction, setColorAction] = useState(ColorActionType.none);

  const [colorFill, setColorFill] = useState(DEFAULT_COLOR_FILL);
  const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [uniformWidth, setUniformWidth] = useState(false);
  const [indentWord, setIndentWord] = useState<number[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createStudyOpen, setCreateStudyOpen] = useState(false)
  const [infoPaneAction, setInfoPaneAction] = useState(InfoPaneActionType.none);

  const [newStropheEvent, setNewStropheEvent] = useState(false);
  const [wordArray, setWordArray] = useState<HebWord[]>([]);
  const [structuredWords, setStructuredWords] = useState<HebWord[][][]>([]);
  const [mergeStropheEvent, setMergeStropheEvent] = useState("");
  const [currentStrophe, setCurrentStrophe] = useState(0);

  const formatContextValue = {
    ctxStudyId: study.id,
    ctxZoomLevel: zoomLevel,
    ctxIsHebrew: isHebrew,
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords: setSelectedWords,
    ctxNumSelectedWords: numSelectedWords,
    ctxSetNumSelectedWords: setNumSelectedWords,
    ctxColorAction: colorAction,
    ctxColorFill: colorFill,
    ctxBorderColor: borderColor,
    ctxTextColor: textColor,
    ctxUniformWidth: uniformWidth,
    ctxIndentWord: indentWord,
    ctxSetIndentWord: setIndentWord,
    ctxContent: content,
    ctxInViewMode: inViewMode,
    ctxNewStropheEvent: newStropheEvent,
    ctxSetNewStropheEvent: setNewStropheEvent,
    ctxWordArray: wordArray,
    ctxSetWordArray: setWordArray,
    ctxStructuredWords: structuredWords,
    ctxSetStructuredWords: setStructuredWords,
    ctxMergeStropheEvent: mergeStropheEvent,
    ctxSetMergeStropheEvent: setMergeStropheEvent,
    ctxSetCurrentStrophe: setCurrentStrophe,
    ctxCurrentStrophe: currentStrophe
  }


  const passageDivStyle = {
    className: `flex-1 overflow-auto whitespace-nowrap ${infoPaneAction != InfoPaneActionType.none ? 'w-3/4' : ''} ${(isHebrew) ? "hbFont" : " "}`
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
              setColorFill={setColorFill}
              setBorderColor={setBorderColor}
              setTextColor={setTextColor}
              setUniformWidth={setUniformWidth}
              setIndentWord={setIndentWord}
            />

            <Passage content={content}/>
          </div>
          {(infoPaneAction != InfoPaneActionType.none) &&
            <div className="relative top-0 w-1/4 border border-transparent right-0 z-30 h-full bg-white">
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

