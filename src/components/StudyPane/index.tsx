'use client';

import { useState, createContext } from "react";

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";
import { ColorActionType } from "@/lib/types";
import { StudyData, PassageData } from '@/lib/data';
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
  ctxInViewMode: false
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
  const [structureOpen, setStructureOpen] = useState(false);
  const [motifOpen, setMotifOpen] = useState(false);
  const [syntaxOpen, setSyntaxOpen] = useState(false);
  const [soundsOpen, setSoundsOpen] = useState(false);
  const [infoPaneOpen, setInfoPaneOpen] = useState(structureOpen || motifOpen || syntaxOpen || soundsOpen);


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
    ctxInViewMode: inViewMode
  }

  const setAllInfoPaneClose = () => {
    setStructureOpen(false);
    setMotifOpen(false);
    setSyntaxOpen(false);
    setSoundsOpen(false);
    setInfoPaneOpen(false);
  }

  const passageDivStyle = {
    className: `pt-4 overflow-auto whitespace-nowrap ${infoPaneOpen ? 'w-3/4' : ''} ${(isHebrew) ? "hbFont ml-6" : " mr-6"}`
  }

  return (
    <>
      <FormatContext.Provider value={formatContextValue}>
        <Header
          study={study}
          setLangToHebrew={setHebrew}
          setStructureOpen={setStructureOpen}
          setMotifOpen={setMotifOpen}
          setSyntaxOpen={setSyntaxOpen}
          setSoundsOpen={setSoundsOpen}
          setInfoPaneOpen={setInfoPaneOpen}
          structureOpen={structureOpen}
          motifOpen={motifOpen}
          syntaxOpen={syntaxOpen}
          soundsOpen={soundsOpen}
          infoPaneOpen={infoPaneOpen}
          setAllInfoPaneClose={setAllInfoPaneClose}
        />
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
        <main>
          <div {...passageDivStyle}>
            <Passage content={content}/>
          </div>
          {infoPaneOpen &&
            <div className="fixed top-35 w-1/4 rounded border border-transparent right-3 h-full bg-white shadow-lg ">
              <InfoPane
                infoPaneOpen={infoPaneOpen}
                structureOpen={structureOpen}
                motifOpen={motifOpen}
                syntaxOpen={syntaxOpen}
                soundsOpen={soundsOpen}
                setAllInfoPaneClose={setAllInfoPaneClose} />
            </div>
          }
        </main>
      </FormatContext.Provider>
    </>
  );

};

export default StudyPane;

