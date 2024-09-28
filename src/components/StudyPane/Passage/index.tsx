import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { getWordById, wordsHasSameColor } from '@/lib/utils';
import { PassageData } from '@/lib/data';
import { ColorActionType, StructureUpdateType } from '@/lib/types';
import { StropheBlock } from './StropheBlock';
import { handleStructureUpdate } from './StructureUpdate';
import { useDragToSelect } from '@/hooks/useDragToSelect';

const Passage = ({
  content,
}: {
  content: PassageData;
}) => {
  const { ctxSelectedHebWords, ctxSetSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor, ctxStructureUpdateType, ctxSetStructureUpdateType, ctxSetStropheCount
  } = useContext(FormatContext)

  const [passageData, setPassageData] = useState<PassageData>(content);

  const { isDragging, selectionStart, selectionEnd, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(content);
  ctxSetStropheCount(passageData.strophes.length);


  useEffect(() => {

    let actionedContent : PassageData | null = null;

    if (ctxStructureUpdateType !== StructureUpdateType.none && ctxSelectedHebWords.length === 1) {
      actionedContent = handleStructureUpdate(passageData, ctxSelectedHebWords[0], ctxStructureUpdateType);
    }

    if (actionedContent !== null) {
      setPassageData(actionedContent);
      ctxSetNumSelectedWords(0);
      ctxSetSelectedHebWords([]);
    } 
    ctxSetStructureUpdateType(StructureUpdateType.none);

  }, [ctxStructureUpdateType, ctxSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetStructureUpdateType, passageData]);

  const passageContentStyle = {
    className: `flex-1 overflow-scroll transition-all duration-300 mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 mt-17`
  }

  return (
    <main className="relative min-h-screen w-full">
    
      <div
        key={`passage`}
        onMouseDown={handleMouseDown}
        ref={containerRef}
        style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
        {...passageContentStyle}
        className="h-0"
      >
        <div id="selaPassage" className='relative py-5 top-30 pb-2 z-10'>
          {
            passageData.strophes.map((strophe)=>{
              return(
                <StropheBlock 
                  strophe={strophe}
                  key={strophe.id}
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