import React, { useState, useEffect, useContext, useRef } from 'react';
import { LuTextSelect } from "react-icons/lu";
import { IoIosArrowForward, IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import { PiNotePencil } from "react-icons/pi";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, FormatContext } from '../index';
import { WordBlock } from './WordBlock';
import { ColorActionType } from "@/lib/types";
import { StropheProps } from '@/lib/data';
import { strophesHasSameColor } from "@/lib/utils";
import { updateMetadataInDb } from '@/lib/actions';
import { StropheNotes } from './StropheNotes';

export const StropheBlock = ({
    stropheProps, stanzaExpanded
  }: {
    stropheProps: StropheProps, stanzaExpanded: boolean
  }) => {
  
  const { ctxStudyId, ctxIsHebrew, ctxStudyMetadata, ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxSetSelectedWords, ctxSetNumSelectedWords, ctxColorAction, ctxSelectedColor, ctxSetColorFill, ctxSetBorderColor, ctxInViewMode, ctxSetNoteBox
  } = useContext(FormatContext);

  const [selected, setSelected] = useState(false);
  const [expanded, setExpanded] = useState(stropheProps.metadata?.expanded ?? true);
  const [showNote, setShowNote] = useState(false);
  const firstWordId = stropheProps.lines[0].words[0].wordId;
  const lastWordId = stropheProps.lines.at(-1)?.words.at(-1)?.wordId ?? 0;

  const [colorFillLocal, setColorFillLocal] = useState(DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(DEFAULT_BORDER_COLOR);

  // const noteAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleNoteAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // noteAreaRef.current?.focus();
    ctxSetNoteBox(e.currentTarget.getBoundingClientRect());
  }
  // const containerRef = useRef<HTMLDivElement | null>(null);
  // const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // const titleareaRef = useRef<HTMLTextAreaElement | null>(null);
  // const [rows, setRows] = useState(1);
  // const [width, setWidth] = useState(0);
  // const [height, setHeight] = useState(1);
  
  // useEffect(() => {
  //   const container = containerRef.current;
  //   const textarea = textareaRef.current;

  //   if (!container|| !textarea) return;

  //   const containerPadding = 0;
  //   textarea.style.lineHeight = '1.5';

  //   const computeRows = () => {
  //     const computedStyle = window.getComputedStyle(textarea);
  //     const lineHeight = parseFloat(computedStyle.lineHeight);
  //     // 1 tailwind unit = 4px, and there are 8 instances of padding needed to be subtracted
  //     const containerHeight = stropheProps.lines.length*((ctxIsHebrew?32+3:40+3));
  //     if (lineHeight > 0) {
  //       const calculatedRows = Math.floor(containerHeight/lineHeight);
  //       setRows(calculatedRows);
  //     }
  //   };
  //   const updateTextBoxSize = () => {
  //     const refWidth = container.offsetWidth;
  //     const refHeight = container.offsetHeight;
  //     setWidth(refWidth);
  //     setHeight(refHeight);
  //     computeRows();
  //   }

  //   updateTextBoxSize();

  //   const resizeObserver = new ResizeObserver(() => {
  //     updateTextBoxSize();
  //   })

  //   resizeObserver.observe(container);

  //   return () => {
  //     resizeObserver.disconnect();
  //   };
  // }, [])

  useEffect(() => {

    if (stropheProps.metadata?.color) {
      const selectedColorFill = stropheProps.metadata?.color?.fill ?? DEFAULT_COLOR_FILL;
      (colorFillLocal !== selectedColorFill) && setColorFillLocal(selectedColorFill);

      const selectedBorderColor = stropheProps.metadata?.color?.border ?? DEFAULT_BORDER_COLOR;
      (borderColorLocal !== selectedBorderColor) && setBorderColorLocal(selectedBorderColor);
    }
    else {
      setColorFillLocal(DEFAULT_COLOR_FILL);
      setBorderColorLocal(DEFAULT_BORDER_COLOR);
    }

  }, [stropheProps.metadata?.color]);

  useEffect(() => {
    if (ctxColorAction != ColorActionType.none ) {
      if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
        setColorFillLocal(ctxSelectedColor);
        (stropheProps.metadata.color) && (stropheProps.metadata.color.fill = ctxSelectedColor);
      }
      else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
        setBorderColorLocal(ctxSelectedColor);
        (stropheProps.metadata.color) && (stropheProps.metadata.color.border = ctxSelectedColor);
      }
      else if ((ctxColorAction === ColorActionType.resetColor && selected) || ctxColorAction == ColorActionType.resetAllColor) {
        if (colorFillLocal != DEFAULT_COLOR_FILL) {
          setColorFillLocal(DEFAULT_COLOR_FILL);
          (stropheProps.metadata.color) && (stropheProps.metadata.color.fill = DEFAULT_COLOR_FILL);
        }
        if (borderColorLocal != DEFAULT_BORDER_COLOR) {
          setBorderColorLocal(DEFAULT_BORDER_COLOR);
          (stropheProps.metadata.color) && (stropheProps.metadata.color.border = DEFAULT_BORDER_COLOR);
        }
      }
    }
    //if (strophe.colorFill != colorFillLocal) { setColorFillLocal(strophe.colorFill || DEFAULT_COLOR_FILL) }
    //if (strophe.borderColor != borderColorLocal) { setBorderColorLocal(strophe.borderColor || DEFAULT_BORDER_COLOR) }
  }, [ctxColorAction, selected, stropheProps, colorFillLocal, borderColorLocal, ctxSelectedColor]);
  
  const handleStropheBlockClick = () => {
    setSelected(prevState => !prevState);
    (!selected) ? ctxSelectedStrophes.push(stropheProps) : ctxSelectedStrophes.splice(ctxSelectedStrophes.indexOf(stropheProps), 1);
    ctxSetSelectedStrophes(ctxSelectedStrophes);
    ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);
    // remove any selected word blocks if strophe block is selected
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);

    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    if (ctxSelectedStrophes.length >= 1) {
      const lastSelectedStrophe = ctxSelectedStrophes.at(ctxSelectedStrophes.length-1);
      if (lastSelectedStrophe) {
        strophesHasSameColor(ctxSelectedStrophes, ColorActionType.colorFill) && ctxSetColorFill(lastSelectedStrophe.metadata.color?.fill || DEFAULT_COLOR_FILL);
        strophesHasSameColor(ctxSelectedStrophes, ColorActionType.borderColor) && ctxSetBorderColor(lastSelectedStrophe.metadata.color?.border || DEFAULT_BORDER_COLOR);
      }
    }
  }

  const handleCollapseBlockClick = () => {
    setExpanded(prevState => !prevState);

    stropheProps.metadata.expanded = !expanded;
    const firstWordIdinStrophe = stropheProps.lines[0].words[0].wordId;
    ctxStudyMetadata.words[firstWordIdinStrophe].stropheMd ??= {};
    ctxStudyMetadata.words[firstWordIdinStrophe].stropheMd.expanded = stropheProps.metadata.expanded;

    if (!ctxInViewMode) {
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }

    // remove any selected word blocks if strophe block is collapsed or expanded
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
  }
  
  useEffect(() => {
    setSelected(ctxSelectedStrophes.includes(stropheProps));
    ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);
  }, [ctxSelectedStrophes, stropheProps, ctxSetNumSelectedStrophes]);

  return (
    <div 
      key={"strophe_" + stropheProps.stropheId}
      className={`relative flex-column px-5 py-2 mx-1 my-1 min-h-[45px] ${stanzaExpanded?ctxIsHebrew?'pl-20':'pr-20':'pr-5'} ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border'}`}
      style={
        {
          background: `${colorFillLocal}`,
          border: `2px solid ${borderColorLocal}`
        }
      }
    >
      <div
        className={`z-1 absolute top-0 p-[0.5] m-[0.5] bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
        >
      <button
        key={"strophe" + stropheProps.stropheId + "Selector"}
        className={`${stanzaExpanded?'py-2 my-1 px-[0.5] mx-[0.5]':'p-2 m-1'}  hover:bg-theme active:bg-transparent`}
        onClick={() => handleStropheBlockClick()}
        data-clicktype={'clickable'}
      >
        <LuTextSelect
          style={{pointerEvents:'none'}}
        />
      </button>
      {
      expanded && stanzaExpanded?
      <button
        key={"strophe" + stropheProps.stropheId + "notepad"}
        className={`py-2 my-1 px-[0.5] mx-[0.5] hover:bg-theme active:bg-transparent`}
        onClick={() => setShowNote(!showNote)}
      >
        <PiNotePencil />
      </button>
      :
      <></>
      }
      {
        stanzaExpanded?
        <button
          key={"strophe" + stropheProps.stropheId + "CollapseButton"}
          className={`py-2 my-1 px-[0.5] mx-[0.5] hover:bg-theme active:bg-transparent`}
          onClick={() => handleCollapseBlockClick()}
          data-clicktype={'clickable'}
        >
          { (!expanded && ctxIsHebrew) && <IoIosArrowForward style={{pointerEvents:'none'}} /> }
          { (!expanded && !ctxIsHebrew)  && <IoIosArrowBack style={{pointerEvents:'none'}} /> }
          { expanded && <IoIosArrowDown style={{pointerEvents:'none'}} /> }
        </button>
        :
        <></>
      }
      </div>
      <div  className={`flex flex-col gap-5.5 z-10 ${showNote && expanded && stanzaExpanded? '': 'hidden'}`}
      
      onClick={handleNoteAreaClick}
      >
          <StropheNotes firstWordId={firstWordId} lastWordId={lastWordId} stropheId={stropheProps.stropheId}/>
      </div>
      <div>
      {
      stropheProps.lines.map((line, lineId) => {
        return (
          <div 
            key={"line_" + lineId}
            className={expanded && stanzaExpanded && !showNote? `flex` : `hidden`}
          >
          {
            line.words.map((word) => {
              return (
                <div
                  className={`mt-1 mb-1`}
                  key={word.wordId}
                >
                  <WordBlock
                    key={"word_" + word.wordId}
                    wordProps={word}
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
    </div>
  )
}