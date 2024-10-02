import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { getWordById, wordsHasSameColor } from '@/lib/utils';
import { PassageData } from '@/lib/data';
import { ColorActionType, StructureUpdateType } from '@/lib/types';
import { StropheBlock } from './StropheBlock';
import { handleStructureUpdate } from './StructureUpdate';

const Passage = ({
  content,
}: {
  content: PassageData;
}) => {
  const { ctxSelectedHebWords, ctxSetSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor, ctxStructureUpdateType, ctxSetStructureUpdateType, ctxSetStropheCount, ctxSetSelectedRoots
  } = useContext(FormatContext)

  //drag-to-select module
  ///////////////////////////
  ///////////////////////////
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [clickToDeSelect, setClickToDeSelect] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [passageData, setPassageData] = useState<PassageData>(content);
  
  useEffect(() =>{
    ctxSetStropheCount(passageData.strophes.length);
  }, [passageData]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    console.log("Mouse Down")

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

  const handleMouseMove = useCallback((event: MouseEvent) => {
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
    }

  }, [isDragging, selectionStart, selectionEnd, content, ctxSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetSelectedStrophes,
    ctxSetBorderColor, ctxSetColorFill, ctxSetTextColor]);

  const handleMouseUp = useCallback(() => {
    document.body.style.userSelect = 'text';
    setIsDragging(false);
    console.log("Mouse Up")
    //click to de-select
    //if selectionEnd is null it means the mouse didnt move at all
    //otherwise it means it is a drag
    if (!selectionEnd && clickToDeSelect) {
      ctxSetNumSelectedWords(0);
      ctxSetSelectedHebWords([]);
      ctxSetSelectedStrophes([]);
    }
  }, [selectionEnd, clickToDeSelect, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetSelectedStrophes]);

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
    let actionedContent: PassageData | null = null;
  
    if (ctxStructureUpdateType !== StructureUpdateType.none && ctxSelectedHebWords.length === 1) {
      actionedContent = handleStructureUpdate(passageData, ctxSelectedHebWords[0], ctxStructureUpdateType);
    }
  
    // Only update state if actionedContent is different from current passageData
    if (actionedContent && actionedContent !== passageData) {
      setPassageData(actionedContent);
      ctxSetNumSelectedWords(0);
      ctxSetSelectedHebWords([]);
    } 
    // Reset the structure update type
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