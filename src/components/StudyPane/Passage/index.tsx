import { HebWord, PassageData } from '@/lib/data';
import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType } from "@/lib/types";
import { wrapText } from "@/lib/utils";
import InfoPane from '../InfoPane';
import { LuTextSelect } from "react-icons/lu";
import { createWordArray, newStropheAction, StropheBlock, createStropheData, mergeStropheAction } from './StropheFunctions';

type ZoomLevel = {
  [level: number]: { fontSize: string, verseNumMl: string, verseNumMr: string, hbWidth: string, hbHeight: string, width: string, height: string, fontInPx: string, maxWidthPx: number };
}
const zoomLevelMap: ZoomLevel = {
  0: { fontSize: "text-4xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-10", hbHeight: "h-3.5", width: "w-12", height: "h-4", fontInPx: "6px", maxWidthPx: 38 },
  1: { fontSize: "text-3xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-12", hbHeight: "h-4", width: "w-16", height: "h-6", fontInPx: "8px", maxWidthPx: 54 },
  2: { fontSize: "text-2xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-14", hbHeight: "h-4.5", width: "w-19", height: "h-7", fontInPx: "10px", maxWidthPx: 63 },
  3: { fontSize: "text-xs", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-16", hbHeight: "h-5", width: "w-22", height: "h-8", fontInPx: "12px", maxWidthPx: 72 },
  4: { fontSize: "text-sm", verseNumMl: "ml-0.5", verseNumMr: "mr-0.5", hbWidth: "w-18", hbHeight: "h-5.5", width: "w-25", height: "h-9", fontInPx: "14px", maxWidthPx: 84 },
  5: { fontSize: "text-base", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-20", hbHeight: "h-6", width: "w-28", height: "h-10", fontInPx: "16px", maxWidthPx: 96 },
  6: { fontSize: "text-lg", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-24", hbHeight: "h-6.5", width: "w-32", height: "h-11", fontInPx: "18px", maxWidthPx: 114 },
  7: { fontSize: "text-xl", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-30", hbHeight: "h-8", width: "w-36", height: "h-12", fontInPx: "20px", maxWidthPx: 136 },
  8: { fontSize: "text-2xl", verseNumMl: "ml-1", verseNumMr: "mr-1", hbWidth: "w-32", hbHeight: "h-10", width: "w-40", height: "h-13", fontInPx: "24px", maxWidthPx: 148 },
  9: { fontSize: "text-3xl", verseNumMl: "ml-2", verseNumMr: "mr-2", hbWidth: "w-36", hbHeight: "h-14", width: "w-48", height: "h-16", fontInPx: "30px", maxWidthPx: 163 },
  10: { fontSize: "text-4xl", verseNumMl: "ml-2", verseNumMr: "mr-2", hbWidth: "w-40", hbHeight: "h-17", width: "w-60", height: "h-20", fontInPx: "36px", maxWidthPx: 218 },
  11: { fontSize: "text-5xl", verseNumMl: "ml-2.5", verseNumMr: "mr-2.5", hbWidth: "w-42", hbHeight: "h-18", width: "w-72", height: "h-20", fontInPx: "42px", maxWidthPx: 236 },
  12: { fontSize: "text-6xl", verseNumMl: "ml-2.5", verseNumMr: "mr-2.5", hbWidth: "w-42", hbHeight: "h-18", width: "w-72", height: "h-20", fontInPx: "42px", maxWidthPx: 236 },
}

const WordBlock = ({
  verseNumber, hebWord, showVerseNum
}: {
  verseNumber: number;
  hebWord: HebWord;
  showVerseNum: boolean;
}) => {

  const { ctxZoomLevel, ctxIsHebrew, ctxSelectedWords, 
    ctxSetSelectedWords, ctxSetNumSelectedWords, 
    ctxColorAction, ctxColorFill, ctxBorderColor, 
    ctxTextColor, ctxUniformWidth, ctxIndentWord, 
     } = useContext(FormatContext)

  const [colorFillLocal, setColorFillLocal] = useState(hebWord.colorFill || DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(hebWord.borderColor || DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(hebWord.textColor || DEFAULT_TEXT_COLOR);
  const [selected, setSelected] = useState(false);

  if (ctxColorAction != ColorActionType.none) {
    if (selected) {
      if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxColorFill) {
        setColorFillLocal(ctxColorFill);
      }
      else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxBorderColor) {
        setBorderColorLocal(ctxBorderColor);
      }
      else if (ctxColorAction === ColorActionType.textColor && textColorLocal != ctxTextColor) {
        setTextColorLocal(ctxTextColor);
      }
      else if (ctxColorAction === ColorActionType.resetColor) {
        (colorFillLocal != ctxColorFill) && setColorFillLocal(ctxColorFill);
        (borderColorLocal != ctxBorderColor) && setBorderColorLocal(ctxBorderColor);
        (textColorLocal != ctxTextColor) && setTextColorLocal(ctxTextColor);
      }
    }
  }

  useEffect(() => {
    setSelected(ctxSelectedWords.includes(hebWord.id));
    ctxSetNumSelectedWords(ctxSelectedWords.length);
  }, [ctxSelectedWords, hebWord.id, selected, hebWord.numIndent]);

  const handleClick = () => {
    setSelected(prevState => !prevState);
    (!selected) ? ctxSelectedWords.push(hebWord.id) : ctxSelectedWords.splice(ctxSelectedWords.indexOf(hebWord.id), 1);
    ctxSetSelectedWords(ctxSelectedWords);
    ctxSetNumSelectedWords(ctxSelectedWords.length);
  }


  const verseNumStyles = {
    className: `${zoomLevelMap[ctxZoomLevel].fontSize} top-0 ${ctxIsHebrew ? 'right-0' : 'left-0'} sups w-1 position-absolute ${ctxIsHebrew ? zoomLevelMap[ctxZoomLevel].verseNumMr : zoomLevelMap[ctxZoomLevel].verseNumMl}`
  }

  let fontSize = zoomLevelMap[(ctxIsHebrew) ? ctxZoomLevel + 2 : ctxZoomLevel].fontSize;

  if (ctxUniformWidth && !ctxIsHebrew) {
    const canvas = document.createElement('canvas');
    if (canvas) {
      // Get the 2D rendering context
      const context = canvas.getContext('2d');
      if (context) {
        context.font = zoomLevelMap[ctxZoomLevel].fontInPx + " Satoshi";
        let currentLineCount = wrapText(hebWord.gloss.trim(), context, zoomLevelMap[ctxZoomLevel].maxWidthPx /*(index === 0) ? 90 : 96*/);
        let currentZoomLevel = ctxZoomLevel - 1;
        while (currentLineCount > 2 && currentZoomLevel >= 0) {
          context.font = zoomLevelMap[currentZoomLevel].fontInPx + " Satoshi";
          currentLineCount = wrapText(hebWord.gloss.trim(), context, zoomLevelMap[ctxZoomLevel].maxWidthPx);
          fontSize = zoomLevelMap[currentZoomLevel].fontSize;
          currentZoomLevel--;
        }

        (currentLineCount > 2 && currentZoomLevel === -1) && (fontSize = "text-5xs");
      }
    }
  }

  const hebBlockSizeStyle = `${zoomLevelMap[ctxZoomLevel].hbWidth} ${zoomLevelMap[ctxZoomLevel].hbHeight}`;
  const engBlockSizeStyle = `${zoomLevelMap[ctxZoomLevel].width} ${zoomLevelMap[ctxZoomLevel].height} text-wrap`;

  const renderIndents = (times: number) => {
    return (
      <div className="flex">
        {[...Array(times)].map((_, i) => (
          <div
            key={i}
            className={`mx-1 rounded border'}
        `}
            style={
              {
                border: `2px solid transparent`,
              }
            }>
            <span
              className="flex"
            >
              {<sup {...verseNumStyles}></sup>}
              <span
                className={`flex select-none px-2 py-1 items-center justify-center text-center leading-none
            ${ctxUniformWidth && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
              >
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex">
      {ctxUniformWidth && hebWord.numIndent > 0 && renderIndents(hebWord.numIndent)}
      <div
        id={hebWord.id.toString()}
        key={hebWord.id}
        className={`wordBlock mx-1 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300]' : 'rounded border'}`}
        style={
          {
            background: `${colorFillLocal}`,
            border: `2px solid ${borderColorLocal}`,
            color: `${textColorLocal}`,
          }
        }>
        <span
          className="flex"
          onClick={handleClick}
        >
          {showVerseNum ? <sup {...verseNumStyles}>{verseNumber}</sup> : ctxUniformWidth ? <sup {...verseNumStyles}></sup> : ''}
          <span
            className={`flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none
          ${fontSize}
          ${ctxUniformWidth && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
            data-clicktype="clickable"
          >
            {ctxIsHebrew ? hebWord.wlcWord : hebWord.gloss}
          </span>
        </span>
      </div>
    </div>
  );

}


const Paragraph = (
  {strophe, s_index}:{
    strophe: HebWord[][], s_index: number
  }) => {

  const { ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, ctxColorAction, ctxColorFill, 
  } = useContext(FormatContext)

  const [selected, setSelected] = useState(false);

  const [colorFillLocal, setColorFillLocal] = useState(DEFAULT_COLOR_FILL);


  if (ctxColorAction != ColorActionType.none) {
    if (selected) {
      if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxColorFill) {
        setColorFillLocal(ctxColorFill);
      }
    }
  }

  const handleParagraphClick = (index:string) => {
    console.log(`strophe`+index);
    setSelected(prevState => !prevState);
    (!selected) ? ctxSelectedWords.push(s_index) : ctxSelectedWords.splice(ctxSelectedWords.indexOf(s_index), 1);
    ctxSetSelectedWords(ctxSelectedWords);
    ctxSetNumSelectedWords(ctxSelectedWords.length);
  }
  

  useEffect(() => {
    setSelected(ctxSelectedWords.includes(s_index));
    ctxSetNumSelectedWords(ctxSelectedWords.length);
  }, [ctxSelectedWords]);

  return(
    <div 
      key={`strophe`+String(s_index)}
      className={`relative flex-column p-5 m-5 ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300]' : 'rounded border'}`}
      style={
        {
          background: `${colorFillLocal}`
        }
      }
    >
      <button
        key={`strophe`+String(s_index)+`Selector`}
        className={`z-1 absolute bottom-0 right-0 p-2 m-2 bg-white hover:bg-theme active:bg-transparent`}
        onClick={() => handleParagraphClick(String(s_index))}
        data-clickType={'clickable'}
      >
        <LuTextSelect
          style={{pointerEvents:'none'}}
        />
      </button>
    {
    strophe.map((line, l_index)=>{
      return(
        <div
          key={`line`+String(l_index)}
          className={`flex`}
        >
        {
        line.map((word, word_index)=>{
          return(
            <div
              className={`mt-1 mb-1`}
              key={word_index}
            >
            <WordBlock
              key={`word`+String(word_index)}
              verseNumber={word.verse}
              hebWord={word}
              showVerseNum={word.p_index === 0 && word.w_index === 0}
            />
            </div>
            
          )
        })
        }
        </div>
      )
    })
  }
    </div>
  )
}


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

  const { ctxSelectedWords, ctxSetSelectedWords, 
    ctxSetNumSelectedWords, ctxIsHebrew, ctxNewStropheEvent, 
    ctxSetNewStropheEvent, ctxStructuredWords, ctxSetStructuredWords,
    ctxSetMergeStropheEvent, ctxMergeStropheEvent,
  } = useContext(FormatContext)

  //drag-to-select module
  ///////////////////////////
  ///////////////////////////
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [clickToDeSelect, setClickToDeSelect] = useState(true);
  const wordsListRef = useRef(createWordArray({content}));
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
      console.log('click to deselect')
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
    if (ctxNewStropheEvent){
      let flatWordList:HebWord[] = [];
      flatWordList = newStropheAction(wordsListRef.current, ctxSelectedWords[0]);
      wordsListRef.current = flatWordList;
      let structuredWordList:HebWord[][][];
      structuredWordList = createStropheData(flatWordList);
      ctxSetStructuredWords(structuredWordList);
      ctxSetNewStropheEvent(false);
    }
  }, [ctxNewStropheEvent, ]);

  useEffect(() => { // for handling merge strophe action
    let flatWordList:HebWord[] = [];
    flatWordList = mergeStropheAction(wordsListRef.current, ctxSelectedWords[0]);
    wordsListRef.current = flatWordList;
    let structuredWordList:HebWord[][][];
    structuredWordList = createStropheData(flatWordList);
    ctxSetStructuredWords(structuredWordList);
    ctxSetMergeStropheEvent(false);
  }, [ctxMergeStropheEvent]);

  useEffect(() => {
    let stropheArray: HebWord[][][]|undefined = undefined;
    stropheArray = StropheBlock(wordsListRef.current);
    ctxSetStructuredWords(stropheArray);
  }, []);

  const passageContentStyle = {
    className: `flex-1 transition-all duration-300  mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 overflow-y-auto`
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
      {
        ctxStructuredWords.map((strophe, s_index)=>{
          return(
            <Paragraph 
              strophe={strophe}
              s_index={s_index}
              key={s_index}
            />
          )
        })
      }
      {isDragging && <div style={getSelectionBoxStyle()} />}
    </div>
    </main>
  );
};

export default Passage;