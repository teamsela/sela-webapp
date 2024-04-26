'use client';

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";

import { StudyData, PassageData } from '@/lib/data';

import { useState } from "react";

const Editor = ({ 
    study, content
  }: {
    study: StudyData;
    content: PassageData;
  }) => {
    const [isHebrew, setHebrew] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(5);

    const [colorPanelActive, setColorPanelActive] = useState(false);
    
    const [colorFill, setColorFill] = useState( { r:255, g:255, b:255, a:1 } )
    //todo: assign border and text color to their corresponding buttons in Buttons.tsx
    const [borderColor, setBorderColor] = useState( { r:150, g:150, b:150, a:1 } )
    const [textColor, setTextColor] = useState( { r:150, g:150, b:150, a:1 } )

    const [selectedWords, setSelectedWords] = useState<number[]>([]);

    return (
        <>
        <Header study={study} isHebrew={isHebrew} setLangToHebrew={setHebrew} />
        <Toolbar 
          zoomLevel={zoomLevel} 
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
          <div className="mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 overflow-x-auto whitespace-nowrap mr-8">
            <Passage 
                content={content} 
                isHebrew={isHebrew} 
                zoomLevel={zoomLevel} 
                colorFill={colorFill}
                colorPanelActive={colorPanelActive}
                selectedWords={selectedWords}
                setSelectedWords={setSelectedWords}
              />
          </div>
        </main>
        </>
      );

  };
  
  export default Editor;

