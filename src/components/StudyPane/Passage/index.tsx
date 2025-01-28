import React, { useState, useEffect, useContext } from 'react';
import { FormatContext } from '../index';
import { PassageData, PassageProps, WordProps, StanzaMetadata, StropheMetadata, WordMetadata } from '@/lib/data';
import { StructureUpdateType } from '@/lib/types';
import { handleStructureUpdate } from './StructureUpdate';
import { StanzaBlock } from './StanzaBlock';

import { useDragToSelect } from '@/hooks/useDragToSelect';

const Passage = ({
  content,
  bibleData
  //passageProps
}: {
  content: PassageData;
  bibleData: WordProps[];
  //passageProps: PassageProps;
}) => {
  const { ctxSelectedWords, ctxSetSelectedWords, ctxStudyMetadata, ctxSetNumSelectedWords, ctxSetSelectedStrophes, ctxSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType, ctxSetStropheCount, ctxSetStanzaCount
  } = useContext(FormatContext)

  //const [passageData, setPassageData] = useState<PassageData>(content);
  const [passageProps, setPassageProps] = useState<PassageProps>({ stanzaProps: [] });

  const { isDragging, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(passageProps);

  // do we even need this?
  useEffect(() => {

    // merge custom metadata with bible data
      let initPassageProps : PassageProps = { stanzaProps: [] }

      const stanzaKvPair = ctxStudyMetadata?.stanzas?.map<[number, StanzaMetadata]>(obj => [obj.id, obj.metadata]);
      const stanzaMap = new Map<number, StanzaMetadata>(stanzaKvPair);
      const stropheKvPair = ctxStudyMetadata?.strophes?.map<[number, StropheMetadata]>(obj => [obj.id, obj.metadata]);
      const stropheMap = new Map<number, StropheMetadata>(stropheKvPair);
      //const wordKvPair = ctxStudyMetadata?.words?.map<[number, WordMetadata]>(obj => [obj.id, obj.metadata]);
      //const wordMap = new Map<number, WordMetadata>(wordKvPair);
      //console.log(wordMap)
      //if (wordMap.has(201882)) {
      //  console.log("Found 201882 in wordMap")
        //wordMap.get(201882)?.color.
     // }

      let currentStanzaIdx = -1;
      let currentStropheIdx = -1;
      let runningStropheIdx = -1;
      let currentLineIdx = -1;
      let prevVerseNum = 0;

      bibleData.forEach((hebWord) => {
        if (ctxStudyMetadata.words)
        {
          const currentWordStyling = ctxStudyMetadata.words[hebWord.wordId];
          if (currentWordStyling !== undefined) {
            hebWord.metadata = currentWordStyling;
          }  
        }

        let currentStanzaData = initPassageProps.stanzaProps[currentStanzaIdx];
        if (currentStanzaData === undefined || (hebWord.metadata !== undefined && hebWord.metadata.stanzaDiv)) {
          initPassageProps.stanzaProps.push({stanzaId: ++currentStanzaIdx, strophes:[], metadata: {}});
          currentStanzaData = initPassageProps.stanzaProps[currentStanzaIdx];
          const currentStanzaStyling = stanzaMap.get(currentStanzaIdx);
          if (currentStanzaStyling !== undefined) {
            currentStanzaData.metadata = currentStanzaStyling;
          }
          currentStropheIdx = -1;
        } 

        let currentStropheData = currentStanzaData.strophes[currentStropheIdx];
        if (currentStropheData === undefined || (hebWord.metadata !== undefined && hebWord.metadata.stropheDiv)) {
          if (currentStropheIdx !== -1) {
            let lastLineIdxInLastStrophe = currentStropheData.lines.length-1;
            currentStropheData.lines[lastLineIdxInLastStrophe].words.forEach(word => {
              word.lastLineInStrophe = true;
            })
          }
          initPassageProps.stanzaProps[currentStanzaIdx].strophes.push({stropheId: ++runningStropheIdx, lines: [], metadata: {}});
          ++currentStropheIdx;
          currentStropheData =  initPassageProps.stanzaProps[currentStanzaIdx].strophes[currentStropheIdx];
          const currentStropheStyling = stropheMap.get(runningStropheIdx);
          if (currentStropheStyling !== undefined) {
            currentStropheData.metadata = currentStropheStyling;
          }
          currentStropheData.firstStropheInStanza = (currentStropheIdx === 0);
          currentLineIdx = -1;
          hebWord.firstWordInStrophe = true;
        } 

        let currentLineData = currentStropheData.lines[currentLineIdx];
        if (currentLineData === undefined || hebWord.newLine || (hebWord.metadata && hebWord.metadata.lineBreak)) {
          currentStropheData.lines.push({lineId: ++currentLineIdx, words: []})
          currentLineData = currentStropheData.lines[currentLineIdx];
        }

        if (prevVerseNum !== hebWord.verse) {
          hebWord.showVerseNum = true;
        }
        hebWord.firstStropheInStanza = (currentStropheIdx === 0);
        hebWord.lastStropheInStanza = false;
        hebWord.lineId = currentLineIdx;
        hebWord.stropheId = runningStropheIdx;
        hebWord.stanzaId = currentStanzaIdx;

        currentLineData.words.push(hebWord);
        prevVerseNum = hebWord.verse;
      });

      setPassageProps(initPassageProps);

      ctxSetStanzaCount(ctxStudyMetadata.stanzas?.length || 1)
      ctxSetStropheCount(ctxStudyMetadata.strophes?.length || 1);

  }, [ctxStudyMetadata]);
  // useEffect(() => {
  //   let actionedContent : PassageData | null = null;

    // if (ctxStructureUpdateType !== StructureUpdateType.none && 
    //   (ctxSelectedWords.length === 1 || ctxSelectedStrophes.length === 1)) {
    //   actionedContent = handleStructureUpdate(passageData, ctxSelectedWords[0], ctxSelectedStrophes, ctxStructureUpdateType);
    // }
  
    // Only update state if actionedContent is different from current passageData
    // if (actionedContent && actionedContent !== passageData) {
    //   setPassageData(actionedContent);
    //   ctxSetNumSelectedWords(0);
    //   ctxSetSelectedWords([]);
    //   ctxSetSelectedStrophes([]);
    //   ctxSetNumSelectedStrophes(0);
    // } 
    
    // Reset the structure update type
  //   ctxSetStructureUpdateType(StructureUpdateType.none);
  // }, [ctxStructureUpdateType, ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxSetStructureUpdateType]);
  

  const passageContentStyle = {
    className: `flex-1 relative w-full h-full overflow-hidden transition-all duration-300 mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 mt-10`
  }

  console.log(passageProps);

  return (
    <main className="relative min-h-full w-full">
    
      <div
        key={`passage`}
        onMouseDown={handleMouseDown}
        ref={containerRef}
        style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
        {...passageContentStyle}
        className="h-0"
      >
        <div id="selaPassage" className='flex relative m-2 py-5 top-30 pb-2 z-10'>
          {/* {
            passageData.stanzas.map((stanza) => {
              return(
                <StanzaBlock
                  stanza={stanza}
                  key={stanza.id}
                />
              )
            })
          } */}
          {
            passageProps.stanzaProps.map((stanza) => {
              return (
                <StanzaBlock stanzaProps={stanza} key={stanza.stanzaId} />
              )
            })
          }
        </div>
        {isDragging && <div style={getSelectionBoxStyle()} />}
      </div>

    </main>
  );
};

export default Passage;