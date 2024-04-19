'use client';

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";

import { StudyData, PassageData } from '@/lib/data';

import { useState } from "react";

const Editor = ({ 
    study, studyId, content
  }: {
    study: StudyData;
    studyId: string;
    content: PassageData;
  }) => {
    const [isHebrew, setHebrew] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    return (
        <>
        <Header studyName={study.name} studyId={studyId} studyPassage={study.passage} isHebrew={isHebrew} setLangToHebrew={setHebrew} />
        <Toolbar zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Passage content={content} isHebrew={isHebrew} zoomLevel={zoomLevel} />
          </div>
        </main>
        </>
      );

  };
  
  export default Editor;

