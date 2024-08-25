import { HebWord, PassageData } from '@/lib/data';
import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { FormatContext } from '../index';
import { getWordById } from '@/lib/utils';
import { StropheBlock } from './StropheBlock';
//import { newStropheAction, stropheBlock, createStropheData, mergeStropheAction, findStropheNumberWithWordId } from './StropheFunctions';

const Passage = ({
  content,
}: {
  content: PassageData;
}) => {

  const styles = {
    container: {
      className: `flex mb-2`
    }
  }

  const { ctxSelectedWords, ctxSetSelectedWords, ctxSelectedHebWords, ctxSetSelectedHebWords,
    ctxSetNumSelectedWords, ctxNumSelectedWords, ctxIsHebrew, ctxNewStropheEvent, 
    ctxSetNewStropheEvent, ctxStructuredWords, ctxSetStructuredWords,
    ctxSetMergeStropheEvent, ctxMergeStropheEvent, ctxSetCurrentStrophe
  } = useContext(FormatContext)

  //drag-to-select module
  ///////////////////////////
  ///////////////////////////
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [clickToDeSelect, setClickToDeSelect] = useState(true);
  //const wordsListRef = useRef(createWordArray({content}));
  const containerRef = useRef<HTMLDivElement>(null);
  

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
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
    setIsDragging(false);
    //click to de-select
    //if selectionEnd is null it means the mouse didnt move at all
    //otherwise it means it is a drag
    if (!selectionEnd && clickToDeSelect) {
      ctxSetSelectedWords([]);
      ctxSetNumSelectedWords(ctxSelectedWords.length);
      ctxSetSelectedHebWords([]);
      //console.log('click to deselect')
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
      //console.log(window.scrollY)

      // Check if the element is within the selection box
      if (
        adjustedBounds.left < Math.max(selectionStart.x, selectionEnd.x) &&
        adjustedBounds.right > Math.min(selectionStart.x, selectionEnd.x) &&
        adjustedBounds.top < Math.max(selectionStart.y, selectionEnd.y) &&
        adjustedBounds.bottom > Math.min(selectionStart.y, selectionEnd.y)
      ) {
        const wordId = Number(rect.getAttribute('id'));
        if (!ctxSelectedWords.includes(wordId)) {
          const newArray = [...ctxSelectedWords, wordId];
          ctxSetSelectedWords(newArray);
          const selectedWord = getWordById(content, wordId);
          if (selectedWord !== null) {
            const newArray2 = [...ctxSelectedHebWords, selectedWord];
            ctxSetSelectedHebWords(newArray2);
          }
          ctxSetNumSelectedWords(ctxSelectedWords.length);
        }
      }
    });

  }, [selectionStart, selectionEnd, ctxSelectedWords]);

  const getSelectionBoxStyle = (): React.CSSProperties => {
    if (!selectionStart || !selectionEnd) return {};
    const left = Math.min(selectionStart.x, selectionEnd.x) - window.scrollX;
    const top = Math.min(selectionStart.y, selectionEnd.y) - window.scrollY;
    const width = Math.abs(selectionStart.x - selectionEnd.x);
    const height = Math.abs(selectionStart.y - selectionEnd.y);
    return {
      left,
      top,
      width,
      height,
      position: 'fixed',
      backgroundColor: 'rgba(0, 0, 255, 0.2)',
      border: '1px solid blue',
      pointerEvents: 'none',
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

  useEffect(() => { // for handling the strophe creation
    if (ctxNewStropheEvent) {
      let flatWordList:HebWord[] = [];
//      flatWordList = newStropheAction(wordsListRef.current, ctxSelectedWords[0]);
//      wordsListRef.current = flatWordList;
      let structuredWordList:HebWord[][][];
    //  structuredWordList = createStropheData(flatWordList);
//      ctxSetStructuredWords(structuredWordList);
      ctxSetNewStropheEvent(false);
    }
  }, [ctxNewStropheEvent]);

  useEffect(() => { // for handling merge strophe action
    let flatWordList:HebWord[] = [];
//    flatWordList = mergeStropheAction(wordsListRef.current, ctxSelectedWords[0], ctxMergeStropheEvent);
//    wordsListRef.current = flatWordList;
    let structuredWordList:HebWord[][][];
  //  structuredWordList = createStropheData(flatWordList);
//    ctxSetStructuredWords(structuredWordList);
    ctxSetMergeStropheEvent('');
  }, [ctxMergeStropheEvent]);

  useEffect(() => {
    if (ctxNumSelectedWords === 1) {
      //let currentStrophe = findStropheNumberWithWordId(wordsListRef.current, ctxSelectedWords[0]);
      //ctxSetCurrentStrophe(currentStrophe);
    }
  }, [ctxNumSelectedWords])

  useEffect(() => {
    let stropheArray: HebWord[][][]|undefined = undefined;
    //stropheArray = stropheBlock(wordsListRef.current);
    //ctxSetStructuredWords(stropheArray);
  }, []);

  const passageContentStyle = {
    className: `flex-1 transition-all duration-300 mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 overflow-y-auto`
  }

  return (
    <main>
    
      <div
        key={`passage`}
        onMouseDown={handleMouseDown}
        ref={containerRef}
        style={{ userSelect: 'none' }}
        {...passageContentStyle}
      >
        <div className='relative top-8 z-10'>
          {
            content.strophes.map((strophe, stropheId)=>{
              return(
                <StropheBlock 
                  strophe={strophe}
                  id={stropheId}
                  key={stropheId}
                />
              )
            })
          }
          {isDragging && <div style={getSelectionBoxStyle()} />}
        </div>
      </div>

    </main>
  );
};

export default Passage;