import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { getWordById, wordsHasSameColor } from '@/lib/utils';
import { PassageData } from '@/lib/data';
import { ColorActionType, StructureUpdateType } from '@/lib/types';
import { StropheBlock } from './StropheBlock';
import { handleStructureUpdate } from './StructureUpdate';
import { StanzaBlock } from './StanzaBlock';
import { useDragToSelect } from '@/hooks/useDragToSelect';

const Passage = ({
  content,
}: {
  content: PassageData;
}) => {
  const { ctxSelectedHebWords, ctxSetSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes, ctxSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType, ctxSetStropheCount, ctxSetStanzaCount, ctxSetExpandedStanzas, ctxSetExpandedStrophes
  } = useContext(FormatContext)

  const [passageData, setPassageData] = useState<PassageData>(content);

  const { isDragging, selectionStart, selectionEnd, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(content);
  
  const logExpandedStanzasStrophes = (passage: PassageData) => {
    let stanzaExpandedArray: boolean[] = [];
    let stropheExpandedArray: boolean[] = [];
    passage.stanzas.map((stanza) => {
      stanzaExpandedArray.push(stanza.expanded === undefined || stanza.expanded === true? true: false);
      stanza.strophes.map((strophe) => {
        stropheExpandedArray.push(strophe.expanded === undefined || strophe.expanded === true? true: false);
      })
    })
    ctxSetExpandedStanzas(stanzaExpandedArray);
    ctxSetExpandedStrophes(stropheExpandedArray);
  }

  useEffect(() => {
    let stropheCount = 0;
    passageData.stanzas.map((stanzas)=>{
      stropheCount += stanzas.strophes.length
    })
    ctxSetStropheCount(stropheCount);
    ctxSetStanzaCount(passageData.stanzas.length);
    logExpandedStanzasStrophes(passageData);
  }, [passageData]);


  useEffect(() => {
    let actionedContent : PassageData | null = null;

    if (ctxStructureUpdateType !== StructureUpdateType.none && 
      (ctxSelectedHebWords.length === 1 || ctxSelectedStrophes.length === 1)) {
      actionedContent = handleStructureUpdate(passageData, ctxSelectedHebWords[0], ctxSelectedStrophes, ctxStructureUpdateType);
    }
  
    // Only update state if actionedContent is different from current passageData
    if (actionedContent && actionedContent !== passageData) {
      setPassageData(actionedContent);
      logExpandedStanzasStrophes(actionedContent);
      ctxSetNumSelectedWords(0);
      ctxSetSelectedHebWords([]);
      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
    } 
    
    // Reset the structure update type
    ctxSetStructureUpdateType(StructureUpdateType.none);
  }, [ctxStructureUpdateType, ctxSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetStructureUpdateType, passageData]);
  

  const passageContentStyle = {
    className: `flex-1 relative w-full h-full overflow-hidden transition-all duration-300 mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 mt-10`
  }

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
          {
            passageData.stanzas.map((stanza) => {
              return(
                <StanzaBlock
                  stanza={stanza}
                  key={stanza.id}
                />
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