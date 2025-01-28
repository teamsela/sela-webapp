import { HebWord, WordProps } from '@/lib/data';
import React, { useState, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType } from "@/lib/types";
import { wrapText, wordsHasSameColor } from "@/lib/utils";
import EsvPopover from './EsvPopover';

type ZoomLevel = {
  [level: number]: { fontSize: string, fontInPx: string, maxWidthPx: number };
}
const zoomLevelMap: ZoomLevel = {
  0: { fontSize: "text-4xs", fontInPx: "6px", maxWidthPx: 38 },
  1: { fontSize: "text-3xs", fontInPx: "8px", maxWidthPx: 54 },
  2: { fontSize: "text-2xs", fontInPx: "10px", maxWidthPx: 63 },
  3: { fontSize: "text-xs", fontInPx: "12px", maxWidthPx: 72 },
  4: { fontSize: "text-sm", fontInPx: "14px", maxWidthPx: 84 },
  5: { fontSize: "text-base", fontInPx: "16px", maxWidthPx: 96 },
  6: { fontSize: "text-lg", fontInPx: "18px", maxWidthPx: 114 },
  7: { fontSize: "text-xl", fontInPx: "20px", maxWidthPx: 136 },
  8: { fontSize: "text-2xl", fontInPx: "24px", maxWidthPx: 148 },
}

const DEFAULT_ZOOM_LEVEL = 5;

export const WordBlock = ({
  wordProps
}: {
  wordProps: WordProps;
}) => {

  const { ctxIsHebrew, ctxUniformWidth,
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords,
    ctxSetSelectedStrophes, ctxColorAction, ctxSelectedColor,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor, ctxRootsColorMap
  } = useContext(FormatContext)

  // if (wordProps.metadata) {
  //   console.log(wordProps.metadata.colorStyle);
  // }

  const [colorFillLocal, setColorFillLocal] = useState(wordProps.metadata?.color?.fill || DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(wordProps.metadata?.color?.border || DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(wordProps.metadata?.color?.text || DEFAULT_TEXT_COLOR);
  const [selected, setSelected] = useState(false);

  if (ctxColorAction != ColorActionType.none && selected) {
    ctxRootsColorMap.delete(wordProps.strongNumber);
    if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxSelectedColor && ctxSelectedColor != "") {
      setColorFillLocal(ctxSelectedColor);
      //wordProps.metadata.color.fill = ctxSelectedColor;
    }
    else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxSelectedColor && ctxSelectedColor != "") {
      setBorderColorLocal(ctxSelectedColor);
      //hebWord.borderColor = ctxSelectedColor;
    }
    else if (ctxColorAction === ColorActionType.textColor && textColorLocal != ctxSelectedColor && ctxSelectedColor != "") {
      setTextColorLocal(ctxSelectedColor);
      //hebWord.textColor = ctxSelectedColor;
    }
    else if (ctxColorAction === ColorActionType.resetColor) {
      if (colorFillLocal != DEFAULT_COLOR_FILL) {
        setColorFillLocal(DEFAULT_COLOR_FILL);
        //hebWord.colorFill = DEFAULT_COLOR_FILL;
      }
      if (borderColorLocal != DEFAULT_BORDER_COLOR) {
        setBorderColorLocal(DEFAULT_BORDER_COLOR);
        //hebWord.borderColor = DEFAULT_BORDER_COLOR;
      }
      if (textColorLocal != DEFAULT_TEXT_COLOR) {
        setTextColorLocal(DEFAULT_TEXT_COLOR);
        //hebWord.textColor = DEFAULT_TEXT_COLOR;
      }
    }
  }

  useEffect(() => {
    const rootsColorMap = ctxRootsColorMap.get(wordProps.strongNumber)
    if (rootsColorMap) {
      //hebWord.colorFill = rootsColorMap.colorFill;
      //hebWord.textColor = rootsColorMap.textColor;
      setColorFillLocal(rootsColorMap.colorFill);
      setTextColorLocal(rootsColorMap.textColor);
    }
  }, [ctxRootsColorMap])

  useEffect(() => {
    setSelected(ctxSelectedWords.some(word => word.wordId === wordProps.wordId));
    if (ctxSelectedWords.length >= 1) {
      const lastSelectedWord = ctxSelectedWords.at(ctxSelectedWords.length-1);
      // if (lastSelectedWord) {
      //   wordsHasSameColor(ctxSelectedWords, ColorActionType.colorFill) ? ctxSetColorFill(lastSelectedWord.colorFill || DEFAULT_COLOR_FILL) : ctxSetColorFill(DEFAULT_COLOR_FILL); 
      //   wordsHasSameColor(ctxSelectedWords, ColorActionType.borderColor) ? ctxSetBorderColor(lastSelectedWord.borderColor || DEFAULT_BORDER_COLOR) : ctxSetBorderColor(DEFAULT_BORDER_COLOR);
      //   wordsHasSameColor(ctxSelectedWords, ColorActionType.textColor) ? ctxSetTextColor(lastSelectedWord.textColor || DEFAULT_TEXT_COLOR) : ctxSetTextColor(DEFAULT_TEXT_COLOR);
      // }
    }
  }, [ctxSelectedWords, ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor]);


  const handleClick = () => {
    setSelected(prevState => !prevState);
    const newSelectedWords = [...ctxSelectedWords]; // Clone the array
    (!selected) ? newSelectedWords.push(wordProps) : newSelectedWords.splice(newSelectedWords.indexOf(wordProps), 1);

    ctxSetSelectedWords(newSelectedWords);
    ctxSetNumSelectedWords(newSelectedWords.length);
    ctxSetSelectedStrophes([]);

    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    ctxSetTextColor(DEFAULT_TEXT_COLOR);
  //   if (ctxSelectedWords.length >= 1) {
  //     const lastSelectedWord = ctxSelectedWords.at(ctxSelectedWords.length - 1);
  //     if (lastSelectedWord) {
  //       wordsHasSameColor(ctxSelectedWords, ColorActionType.colorFill) ? ctxSetColorFill(lastSelectedWord.colorFill) : ctxSetColorFill(DEFAULT_COLOR_FILL); 
  //       wordsHasSameColor(ctxSelectedWords, ColorActionType.borderColor) ? ctxSetBorderColor(lastSelectedWord.borderColor) : ctxSetColorFill(DEFAULT_BORDER_COLOR);
  //       wordsHasSameColor(ctxSelectedWords, ColorActionType.textColor) ? ctxSetTextColor(lastSelectedWord.textColor) : ctxSetColorFill(DEFAULT_TEXT_COLOR);
  //     }
  //   }
  }


  const verseNumStyles = {
    className: `text-base top-0 ${ctxIsHebrew ? 'right-0' : 'left-0'} sups w-1 position-absolute ${ctxIsHebrew ? 'mr-1' : 'ml-1'}`
  }

  const hebBlockSizeStyle = `w-20 h-8`;
  const engBlockSizeStyle = `w-28 h-10 text-wrap`;

  let fontSize = zoomLevelMap[(ctxIsHebrew) ? DEFAULT_ZOOM_LEVEL + 2 : DEFAULT_ZOOM_LEVEL].fontSize;

  if (ctxUniformWidth && !ctxIsHebrew) {
    const canvas = document.createElement('canvas');
    if (canvas) {
      // Get the 2D rendering context
      const context = canvas.getContext('2d');
      if (context) {
        context.font = zoomLevelMap[DEFAULT_ZOOM_LEVEL].fontInPx + " Satoshi";
        let currentLineCount = wrapText(wordProps.gloss.trim(), context, zoomLevelMap[DEFAULT_ZOOM_LEVEL].maxWidthPx /*(index === 0) ? 90 : 96*/);
        let currentZoomLevel = DEFAULT_ZOOM_LEVEL - 1;
        while (currentLineCount > 2 && currentZoomLevel >= 0) {
          context.font = zoomLevelMap[currentZoomLevel].fontInPx + " Satoshi";
          currentLineCount = wrapText(wordProps.gloss.trim(), context, zoomLevelMap[DEFAULT_ZOOM_LEVEL].maxWidthPx);
          fontSize = zoomLevelMap[currentZoomLevel].fontSize;
          currentZoomLevel--;
        }

        (currentLineCount > 2 && currentZoomLevel === -1) && (fontSize = "text-5xs");
      }
    }
  }

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
                className={`whitespace-nowrap break-keep flex select-none px-2 py-1 items-center justify-center text-center leading-none
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
      {ctxUniformWidth && wordProps.metadata && wordProps.metadata.indent && wordProps.metadata.indent > 0 && renderIndents(wordProps.metadata.indent)}
      <div
        id={wordProps.wordId.toString()}
        key={wordProps.wordId}
        className={`wordBlock mx-1 ${selected ? 'rounded border outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
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
          {wordProps.showVerseNum ? <EsvPopover verseNumStyles={verseNumStyles} chapterNumber={wordProps.chapter} verseNumber={wordProps.verse} /> : ctxUniformWidth ? <sup {...verseNumStyles}></sup> : ''}
          <span
            className={`whitespace-nowrap break-keep flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none ClickBlock ${fontSize}
              ${ctxUniformWidth && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
            data-clicktype="clickable"
          >
            {ctxIsHebrew ? wordProps.wlcWord : wordProps.gloss}
          </span>
        </span>
      </div>
    </div>
  );

}
