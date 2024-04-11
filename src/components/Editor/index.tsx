'use client';

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";

import { StudyData, HebWord } from '@/lib/data';

import { useState } from "react";

const Editor = ({ 
    study, content
  }: {
    study: StudyData;
    content: HebWord[];
  }) => {
    const [isHebrew, setHebrew] = useState(false);

    return (
        <>
        <Header studyName={study.name} studyPassage={study.passage} isHebrew={isHebrew} setLangToHebrew={setHebrew} />
        <Toolbar />
        <main>
          <div className="max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Passage content={content} isHebrew={isHebrew} />
          </div>
        </main>
        </>
      );

  };
  
  export default Editor;

