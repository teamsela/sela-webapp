import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { getWordById, wordsHasSameColor } from '@/lib/utils';
import { PassageData } from '@/lib/data';
import { ColorActionType, StructureUpdateType } from '@/lib/types';
import { StropheBlock } from './StropheBlock';
import { handleStructureUpdate } from './StructureUpdate';
import { StanzaBlock } from './StanzaBlock';

const Passage = ({
  content,
}: {
  content: PassageData;
}) => {
  const { ctxSelectedHebWords, ctxSetSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes, ctxSelectedStrophes, ctxSetNumSelectedStrophes, ctxSetSelectedStanzas, ctxSetNumSelectedStanzas,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor, ctxStructureUpdateType, ctxSetStructureUpdateType, ctxSetStropheCount, ctxSetStanzaCount
  } = useContext(FormatContext)

  //drag-to-select module
  ///////////////////////////
  ///////////////////////////
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [clickToDeSelect, setClickToDeSelect] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // const [passageData, setPassageData] = useState<PassageData>(content);
  const [passageData, setPassageData] = useState<PassageData>(content);
  
  useEffect(() => {
    let tempStropheCount = 0;
    passageData.stanzas.map((stanzas)=>{
      tempStropheCount += stanzas.strophes.length
    })
    ctxSetStropheCount(tempStropheCount);
    ctxSetStanzaCount(passageData.stanzas.length);
  }, [passageData]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    setSelectionStart({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
    setSelectionEnd(null);
    

    //click to de-select
    //if clicked on wordBlock, set status here so de-select function doesnt fire
    //const target used to get rid of error Property 'getAttribute' does not exist on type 'EventTarget'.ts(2339)
    const target = event.target as HTMLElement;
    const clickedTarget = target.getAttribute('data-clickType');
    clickedTarget == "clickable" ? setClickToDeSelect(false) : setClickToDeSelect(true);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    if (!selectionStart) return;
    // filter out small accidental drags when user clicks
    /////////
    const distance = Math.sqrt(Math.pow(event.clientX - selectionStart.x, 2) + Math.pow(event.clientY - selectionStart.y, 2));
    if (distance > 6)
      setSelectionEnd({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
    else
      setSelectionEnd(null);
    /////////
    updateSelectedWords();
  };

  const handleMouseUp = () => {
    document.body.style.userSelect = 'text';
    setIsDragging(false);
    //click to de-select
    //if selectionEnd is null it means the mouse didnt move at all
    //otherwise it means it is a drag
    if (!selectionEnd && clickToDeSelect) {
      ctxSetNumSelectedWords(0);
      ctxSetSelectedHebWords([]);
      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
      ctxSetSelectedStanzas([]);
      ctxSetNumSelectedStanzas(0);
    }
  };

  const updateSelectedWords = useCallback(() => {
    if (!selectionStart || !selectionEnd || !containerRef.current) return;

    // Get all elements with the class 'wordBlock' inside the container
    const rects = containerRef.current.querySelectorAll('.wordBlock');

    rects.forEach(rect => {
      const rectBounds = rect.getBoundingClientRect();
      const adjustedBounds = {
        top: rectBounds.top + window.scrollY,
        bottom: rectBounds.bottom + window.scrollY,
        left: rectBounds.left + window.scrollX,
        right: rectBounds.right + window.scrollX,
      };

      // Check if the element is within the selection box
      if (
        adjustedBounds.left < Math.max(selectionStart.x, selectionEnd.x) &&
        adjustedBounds.right > Math.min(selectionStart.x, selectionEnd.x) &&
        adjustedBounds.top < Math.max(selectionStart.y, selectionEnd.y) &&
        adjustedBounds.bottom > Math.min(selectionStart.y, selectionEnd.y)
      ) {
        const wordId = Number(rect.getAttribute('id'));
        const selectedWord = getWordById(content, wordId);
        if (selectedWord !== null && !ctxSelectedHebWords.includes(selectedWord)) {
          const newArray = [...ctxSelectedHebWords, selectedWord];
          ctxSetSelectedHebWords(newArray);
          ctxSetNumSelectedWords(ctxSelectedHebWords.length);
        
        }
      }
    });

    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    ctxSetTextColor(DEFAULT_TEXT_COLOR);

    if (ctxSelectedHebWords.length >= 1) {
      const lastSelectedWord = ctxSelectedHebWords.at(ctxSelectedHebWords.length-1);
      if (lastSelectedWord) { 
        wordsHasSameColor(ctxSelectedHebWords, ColorActionType.colorFill) && ctxSetColorFill(lastSelectedWord?.colorFill); 
        wordsHasSameColor(ctxSelectedHebWords, ColorActionType.borderColor) && ctxSetBorderColor(lastSelectedWord?.borderColor);
        wordsHasSameColor(ctxSelectedHebWords, ColorActionType.textColor) && ctxSetTextColor(lastSelectedWord?.textColor);
      }
      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
      ctxSetSelectedStanzas([]);
      ctxSetNumSelectedStanzas(0);
    }

  }, [selectionStart, selectionEnd]);

  const getSelectionBoxStyle = (): React.CSSProperties => {
    if (!selectionStart || !selectionEnd) return {};
    const left = Math.min(selectionStart.x, selectionEnd.x) - window.scrollX;
    const top = Math.min(selectionStart.y, selectionEnd.y) - window.scrollY;
    const width = Math.abs(selectionStart.x - selectionEnd.x);
    const height = Math.abs(selectionStart.y - selectionEnd.y);
    //console.log(`height is ${height}, width is ${width}`);
    return {
      left,
      top,
      width,
      height,
      position: 'fixed',
      backgroundColor: 'rgba(0, 0, 255, 0.2)',
      border: '1px solid blue',
      pointerEvents: 'none',
      zIndex: 100,
    };
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    let actionedContent : PassageData | null = null;

    if (ctxStructureUpdateType !== StructureUpdateType.none && (ctxSelectedHebWords.length === 1 || (ctxSelectedStrophes.length === 1 && ctxStructureUpdateType === StructureUpdateType.newStanza || ctxStructureUpdateType === StructureUpdateType.mergeWithPrevStanza || ctxStructureUpdateType === StructureUpdateType.mergeWithNextStanza ))) {
      actionedContent = handleStructureUpdate(passageData, ctxSelectedHebWords[0], ctxSelectedStrophes, ctxStructureUpdateType);
    }

    if (actionedContent !== null) {
      setPassageData(actionedContent);
      ctxSetNumSelectedWords(0);
      ctxSetSelectedHebWords([]);
      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
      ctxSetSelectedStanzas([]);
      ctxSetNumSelectedStanzas(0);
    } 
    ctxSetStructureUpdateType(StructureUpdateType.none);

  }, [ctxStructureUpdateType]);


  const passageContentStyle = {
    className: `flex-1 overflow-hidden relative w-full h-full transition-all duration-300 mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6`
  }

  return (
    <main className="relative top-19 h-0">
      <div
        key={`passage`}
        onMouseDown={handleMouseDown}
        ref={containerRef}
        style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
        {...passageContentStyle}
        className="h-0"
      >
        <div id="selaPassage" className='flex overflow-x-auto relative top-16 pb-2 z-10 overflow-hidden'>
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