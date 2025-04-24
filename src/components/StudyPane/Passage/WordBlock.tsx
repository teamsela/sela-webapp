import { WordProps } from '@/lib/data';
import React, { useState, useEffect, useContext } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { eventBus } from '@/lib/eventBus';
import { BoxDisplayStyle, ColorActionType, ColorType } from "@/lib/types";
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

  const { ctxIsHebrew, ctxBoxDisplayStyle, ctxIndentNum,
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords,
    ctxSetSelectedStrophes, ctxColorAction, ctxSelectedColor,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor,
    ctxRootsColorMap, ctxSetRootsColorMap
  } = useContext(FormatContext)

  const [colorFillLocal, setColorFillLocal] = useState(DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(DEFAULT_TEXT_COLOR);
  const [indentsLocal, setIndentsLocal] = useState(wordProps.metadata?.indent || 0);
  const [selected, setSelected] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  if (ctxColorAction != ColorActionType.none) {

    ctxRootsColorMap.delete(wordProps.strongNumber);

    const colorUpdates: Partial<typeof wordProps.metadata.color> = {};

    if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
      setColorFillLocal(ctxSelectedColor);
      colorUpdates.fill = ctxSelectedColor;
    }
    else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
      setBorderColorLocal(ctxSelectedColor);
      colorUpdates.border = ctxSelectedColor;
    }
    else if (ctxColorAction === ColorActionType.textColor && textColorLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
      setTextColorLocal(ctxSelectedColor);
      colorUpdates.text = ctxSelectedColor;
    }
    else if ((ctxColorAction === ColorActionType.resetColor && selected) || ctxColorAction == ColorActionType.resetAllColor) {
      if (colorFillLocal !== DEFAULT_COLOR_FILL) {
        setColorFillLocal(DEFAULT_COLOR_FILL);
        colorUpdates.fill = DEFAULT_COLOR_FILL;
      }
      if (borderColorLocal !== DEFAULT_BORDER_COLOR) {
        setBorderColorLocal(DEFAULT_BORDER_COLOR);
        colorUpdates.border = DEFAULT_BORDER_COLOR;
      }
      if (textColorLocal !== DEFAULT_TEXT_COLOR) {
        setTextColorLocal(DEFAULT_TEXT_COLOR);
        colorUpdates.text = DEFAULT_TEXT_COLOR;
      }
    }
    if (Object.keys(colorUpdates).length > 0) {
      wordProps.metadata = {
        ...wordProps.metadata,
        color: {
          ...(wordProps.metadata?.color || {}),
          ...colorUpdates,
        },
      };
    }
  }

  useEffect(() => {

    if (wordProps.metadata?.color) {
      const selectedColorFill = wordProps.metadata?.color?.fill ?? DEFAULT_COLOR_FILL;
      (colorFillLocal !== selectedColorFill) && setColorFillLocal(selectedColorFill);

      const selectedBorderColor = wordProps.metadata?.color?.border ?? DEFAULT_BORDER_COLOR;
      (borderColorLocal !== selectedBorderColor) && setBorderColorLocal(selectedBorderColor);

      const selectedTextColor = wordProps.metadata?.color?.text ?? DEFAULT_TEXT_COLOR;
      (textColorLocal !== selectedTextColor) && setTextColorLocal(selectedTextColor);
    }
    else {
      setColorFillLocal(DEFAULT_COLOR_FILL);
      setBorderColorLocal(DEFAULT_BORDER_COLOR);
      setTextColorLocal(DEFAULT_TEXT_COLOR);
    }

    ctxSetRootsColorMap(new Map());
  }, [wordProps.metadata?.color]);

  useEffect(() => {
    if (selected && ctxIndentNum != indentsLocal) {
      setIndentsLocal(ctxIndentNum);
      wordProps.metadata.indent = ctxIndentNum;
    }
  }, [ctxIndentNum])

  useEffect(() => {
    const indent = wordProps.metadata?.indent ?? 0;
    if (indentsLocal !== indent) {
      setIndentsLocal(indent);
    }
  }, [wordProps.metadata?.indent]);

  useEffect(() => {
    const rootsColor = ctxRootsColorMap.get(wordProps.strongNumber)
    if (rootsColor) {
      wordProps.metadata = {
        ...wordProps.metadata,
        color: {
          fill: rootsColor.fill,
          text: rootsColor.text,
          ...(wordProps.metadata?.color || {}),
        },
      };

      (rootsColor.fill) && setColorFillLocal(rootsColor.fill);
      (rootsColor.text) && setTextColorLocal(rootsColor.text);
    }
  }, [ctxRootsColorMap])

  useEffect(() => {
    setSelected(ctxSelectedWords.some(word => word.wordId === wordProps.wordId));
    if (ctxSelectedWords.length >= 1) {
      const lastSelectedWord = ctxSelectedWords.at(ctxSelectedWords.length - 1);
      if (lastSelectedWord) {
        wordsHasSameColor(ctxSelectedWords, ColorActionType.colorFill) ? ctxSetColorFill(lastSelectedWord.metadata?.color?.fill || DEFAULT_COLOR_FILL) : ctxSetColorFill(DEFAULT_COLOR_FILL);
        wordsHasSameColor(ctxSelectedWords, ColorActionType.borderColor) ? ctxSetBorderColor(lastSelectedWord.metadata?.color?.border || DEFAULT_BORDER_COLOR) : ctxSetBorderColor(DEFAULT_BORDER_COLOR);
        wordsHasSameColor(ctxSelectedWords, ColorActionType.textColor) ? ctxSetTextColor(lastSelectedWord.metadata?.color?.text || DEFAULT_TEXT_COLOR) : ctxSetTextColor(DEFAULT_TEXT_COLOR);
      }
    }
  }, [ctxSelectedWords, ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor]);

  const handleClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      handleDoubleClick();
    } else {
      const timeout = setTimeout(() => {
        handleSingleClick();
        setClickTimeout(null);
      }, 200);
      setClickTimeout(timeout);
    }
  }

  // select or deselect word block
  const handleSingleClick = () => {
    setSelected(prevState => !prevState);
    const newSelectedWords = [...ctxSelectedWords]; // Clone the array
    (!selected) ? newSelectedWords.push(wordProps) : newSelectedWords.splice(newSelectedWords.indexOf(wordProps), 1);

    ctxSetSelectedWords(newSelectedWords);
    ctxSetNumSelectedWords(newSelectedWords.length);
    ctxSetSelectedStrophes([]);

    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    ctxSetTextColor(DEFAULT_TEXT_COLOR);
    if (ctxSelectedWords.length >= 1) {
      const lastSelectedWord = ctxSelectedWords.at(ctxSelectedWords.length - 1);
      if (lastSelectedWord) {
        wordsHasSameColor(ctxSelectedWords, ColorActionType.colorFill) ? ctxSetColorFill(lastSelectedWord.metadata?.color?.fill || DEFAULT_COLOR_FILL) : ctxSetColorFill(DEFAULT_COLOR_FILL);
        wordsHasSameColor(ctxSelectedWords, ColorActionType.borderColor) ? ctxSetBorderColor(lastSelectedWord.metadata?.color?.border || DEFAULT_BORDER_COLOR) : ctxSetBorderColor(DEFAULT_BORDER_COLOR);
        wordsHasSameColor(ctxSelectedWords, ColorActionType.textColor) ? ctxSetTextColor(lastSelectedWord.metadata?.color?.text || DEFAULT_TEXT_COLOR) : ctxSetTextColor(DEFAULT_TEXT_COLOR);
      }
    }
  };

  const handleDoubleClick = () => {
    eventBus.emit("selectAllIdenticalWords", wordProps);
  }

  const verseNumStyles = {
    className: `text-base top-0 ${ctxIsHebrew ? 'right-0' : 'left-0'} sups w-1 position-absolute ${ctxIsHebrew ? 'mr-1' : 'ml-1'}`
  }

  const hebBlockSizeStyle = `w-20 h-8`;
  const engBlockSizeStyle = `w-28 h-10 text-wrap`;

  let fontSize = zoomLevelMap[(ctxIsHebrew) ? DEFAULT_ZOOM_LEVEL + 2 : DEFAULT_ZOOM_LEVEL].fontSize;

  if (ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes && !ctxIsHebrew) {
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
            className={`wordBlock mx-1 select-none rounded border outline-offset-[-4px]'}`}
            style={
              {
                boxSizing: 'border-box',
                border: `${borderColorLocal !== DEFAULT_BORDER_COLOR ? '3px' : '2px'} solid transparent`,
                padding: `${borderColorLocal !== DEFAULT_BORDER_COLOR ? '1px' : '2px'}`,
              }
            }>
            <span className="flex select-none">
              {<sup {...verseNumStyles}></sup>}
              <span className={`whitespace-nowrap break-keep flex select-none px-2 py-1 items-center justify-center text-center leading-none ${fontSize}
              ${ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}>
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex">
      {ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes && indentsLocal > 0 && renderIndents(indentsLocal)}
      <div
        id={wordProps.wordId.toString()}
        key={wordProps.wordId}
        className={`wordBlock mx-1 ${selected ? 'rounded border outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
        style={
          {
            background: `${colorFillLocal}`,
            boxSizing: 'border-box',
            border: `${borderColorLocal !== DEFAULT_BORDER_COLOR ? '3px' : '2px'} solid ${borderColorLocal}`,
            padding: `${borderColorLocal !== DEFAULT_BORDER_COLOR ? '1px' : '2px'}`,
            color: `${textColorLocal}`,
          }
        }>
        <span
          className="flex"
          onClick={handleClick}
        >
          {wordProps.showVerseNum ?
            <EsvPopover verseNumStyles={verseNumStyles} chapterNumber={wordProps.chapter} verseNumber={wordProps.verse} /> :
            (ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) ? <sup {...verseNumStyles}></sup> : ''}
          <span
            className={`whitespace-nowrap break-keep flex select-none px-2 py-1 items-center justify-center text-center hover:opacity-60 leading-none ClickBlock ${fontSize}
              ${ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
            data-clicktype="clickable"
          >
            {ctxIsHebrew ? wordProps.wlcWord : wordProps.gloss}
          </span>
        </span>
      </div>
    </div>
  );

}
