'use client';

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";

import { StudyData, PassageData } from '@/lib/data';

import { useState, createContext } from "react";

const DEFAULT_ZOOM_LEVEL : number = 5;

export const FormatContext = createContext({ 
  ctxZoomLevel: DEFAULT_ZOOM_LEVEL,
  ctxHasSelectedWords: false,
  ctxSetHasSelectedWords: (arg: boolean) => {},
});

const Editor = ({ 
    study, content
  }: {
    study: StudyData;
    content: PassageData;
  }) => {
    const [isHebrew, setHebrew] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM_LEVEL);

    const [colorPanelActive, setColorPanelActive] = useState(false);
    
    const [colorFill, setColorFill] = useState( { r:255, g:255, b:255, a:1 } )
    //todo: assign border and text color to their corresponding buttons in Buttons.tsx
    const [borderColor, setBorderColor] = useState( { r:150, g:150, b:150, a:1 } )
    const [textColor, setTextColor] = useState( { r:150, g:150, b:150, a:1 } )

    const [selectedWords, setSelectedWords] = useState<number[]>([]);

    const [hasSelectedWords, setHasSelectedWords] = useState(false);

    const formatContextValue = {
      ctxZoomLevel: zoomLevel,
      ctxHasSelectedWords: hasSelectedWords,
      ctxSetHasSelectedWords: setHasSelectedWords
    }

    const passageDivStyle = {
      className: `mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 overflow-x-auto whitespace-nowrap ${(isHebrew) ? "" : " mr-8"}`
    }

    return (
        <>
        <Header study={study} isHebrew={isHebrew} setLangToHebrew={setHebrew} />
        <FormatContext.Provider value={formatContextValue}>
          <Toolbar 
            setZoomLevel={setZoomLevel}
            //color functions
            colorPanelActive={colorPanelActive}
            setColorPanelActive={setColorPanelActive}
            colorFill={colorFill}
            setColorFill={setColorFill}
            //set selected word array
            selectedWords={selectedWords}
            setSelectedWords={setSelectedWords}
          />
          <main>
            <div {...passageDivStyle}>
              <Passage 
                content={content} 
                isHebrew={isHebrew} 
                colorFill={colorFill}
                colorPanelActive={colorPanelActive}
                selectedWords={selectedWords}
                setSelectedWords={setSelectedWords}
              />
            </div>
          </main>
        </FormatContext.Provider>
        </>
      );

  };
  
  export default Editor;

