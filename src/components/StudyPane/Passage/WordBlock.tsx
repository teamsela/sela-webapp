import { WordProps } from '@/lib/data';
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { eventBus } from '@/lib/eventBus';
import { BoxDisplayConfig, BoxDisplayStyle, ColorActionType, ColorType } from "@/lib/types";
import { wrapText, wordsHasSameColor } from "@/lib/utils";
import EsvPopover from './EsvPopover';
import { LanguageContext } from './PassageBlock';
import { updateMetadataInDb } from '@/lib/actions';

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

  const { ctxBoxDisplayConfig, ctxIndentNum,
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords,
    ctxSetSelectedStrophes, ctxColorAction, ctxSelectedColor,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor,
    ctxRootsColorMap, ctxSetRootsColorMap, ctxStudyMetadata,
    ctxStudyId, ctxAddToHistory, ctxInViewMode,
    ctxEditingWordId, ctxSetEditingWordId, ctxStudyBook
  } = useContext(FormatContext)

  const { ctxIsHebrew } = useContext(LanguageContext)

  const [isEditingGloss, setIsEditingGloss] = useState(false);
  const [glossDraft, setGlossDraft] = useState(wordProps.metadata?.glossOverride ?? wordProps.gloss ?? "");
  const glossInputRef = useRef<HTMLTextAreaElement | null>(null);
  const skipBlurCommitRef = useRef(false);
  const canEditEnglish = !ctxIsHebrew && !ctxInViewMode;
  const currentGlossValue = wordProps.metadata?.glossOverride ?? wordProps.gloss ?? "";

  const [colorFillLocal, setColorFillLocal] = useState(DEFAULT_COLOR_FILL);
  const [borderColorLocal, setBorderColorLocal] = useState(DEFAULT_BORDER_COLOR);
  const [textColorLocal, setTextColorLocal] = useState(DEFAULT_TEXT_COLOR);
  const [indentsLocal, setIndentsLocal] = useState(wordProps.metadata?.indent || 0);
  const [selected, setSelected] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditingGloss) {
      setGlossDraft(currentGlossValue);
    }
  }, [currentGlossValue, isEditingGloss]);

  useEffect(() => {
    if (isEditingGloss) {
      glossInputRef.current?.focus();
      glossInputRef.current?.select();
    }
  }, [isEditingGloss]);

  const ensureWordMetadataEntry = useCallback(() => {
    if (!ctxStudyMetadata.words[wordProps.wordId]) {
      ctxStudyMetadata.words[wordProps.wordId] = { ...(wordProps.metadata || {}) };
    }
    if (wordProps.metadata !== ctxStudyMetadata.words[wordProps.wordId]) {
      wordProps.metadata = ctxStudyMetadata.words[wordProps.wordId];
    }
    return ctxStudyMetadata.words[wordProps.wordId];
  }, [ctxStudyMetadata, wordProps]);

  const startEditingGloss = useCallback(() => {
    if (!canEditEnglish) return;
    skipBlurCommitRef.current = false;
    setGlossDraft(currentGlossValue);
    setIsEditingGloss(true);
    ctxSetEditingWordId(wordProps.wordId);
  }, [canEditEnglish, currentGlossValue, ctxSetEditingWordId, wordProps.wordId]);

  const cancelGlossEditing = useCallback((options?: { preserveEditingContext?: boolean }) => {
    skipBlurCommitRef.current = true;
    setIsEditingGloss(false);
    setGlossDraft(currentGlossValue);
    if (!options?.preserveEditingContext && ctxEditingWordId === wordProps.wordId) {
      ctxSetEditingWordId(null);
    }
  }, [currentGlossValue, ctxEditingWordId, ctxSetEditingWordId, wordProps.wordId]);

  const commitGlossChange = useCallback((value?: string, options?: { preserveEditingContext?: boolean }) => {
    if (!canEditEnglish) {
      setIsEditingGloss(false);
      if (!options?.preserveEditingContext && ctxEditingWordId === wordProps.wordId) {
        ctxSetEditingWordId(null);
      }
      return;
    }

    const nextValue = value !== undefined ? value : glossDraft;
    const sanitized = nextValue.replace(/\r?\n/g, ' ').trim();

    if (sanitized === currentGlossValue) {
      skipBlurCommitRef.current = true;
      setIsEditingGloss(false);
      setGlossDraft(currentGlossValue);
      if (!options?.preserveEditingContext && ctxEditingWordId === wordProps.wordId) {
        ctxSetEditingWordId(null);
      }
      return;
    }

    const metadataEntry = ensureWordMetadataEntry();
    metadataEntry.glossOverride = sanitized;
    wordProps.gloss = sanitized;

    skipBlurCommitRef.current = true;
    setIsEditingGloss(false);
    setGlossDraft(sanitized);
    ctxAddToHistory(ctxStudyMetadata);
    updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    if (!options?.preserveEditingContext && ctxEditingWordId === wordProps.wordId) {
      ctxSetEditingWordId(null);
    }
  }, [canEditEnglish, currentGlossValue, ensureWordMetadataEntry, glossDraft, ctxAddToHistory, ctxStudyId, ctxStudyMetadata, wordProps, ctxEditingWordId, ctxSetEditingWordId]);

  const handleGlossKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      commitGlossChange(event.currentTarget.value);
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelGlossEditing();
      event.currentTarget.blur();
    }
  }, [cancelGlossEditing, commitGlossChange]);

  const handleGlossBlur = useCallback(() => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    commitGlossChange();
  }, [commitGlossChange]);

  const handleGlossChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGlossDraft(event.target.value);
  }, []);

  if (ctxColorAction != ColorActionType.none ) {
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

  useEffect(() => {
    if (!selected && isEditingGloss) {
      commitGlossChange();
    }
  }, [selected, isEditingGloss, commitGlossChange]);

  useEffect(() => {
    if (!canEditEnglish) {
      if (isEditingGloss) {
        cancelGlossEditing();
      }
      if (ctxEditingWordId === wordProps.wordId) {
        ctxSetEditingWordId(null);
      }
      return;
    }

    if (ctxEditingWordId === wordProps.wordId && !isEditingGloss) {
      startEditingGloss();
    } else if (ctxEditingWordId !== wordProps.wordId && isEditingGloss) {
      commitGlossChange(undefined, { preserveEditingContext: true });
    }
  }, [canEditEnglish, ctxEditingWordId, ctxSetEditingWordId, wordProps.wordId, isEditingGloss, startEditingGloss, cancelGlossEditing, commitGlossChange]);

  useEffect(() => {
  }, [borderColorLocal]);

  useEffect(() => {
  }, [selected]);

  useEffect(() => {
  }, [ctxColorAction]);

  const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (isEditingGloss) {
      return;
    }
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
    className: `${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 'text-xs' : 'text-base'} top-0 ${ctxIsHebrew ? 'right-0' : 'left-0'} sups w-1 position-absolute ${ctxIsHebrew ? 'ml-2' : ''}`,
    style: ctxIsHebrew ? {} : { marginRight: wordProps.verse.toString().length === 1 ? '0.25rem' : wordProps.verse.toString().length === 2 ? '0.25rem' : '0.125rem' }
  }

  const hebBlockSizeStyle = `w-[5.25rem] h-10`;
  const engBlockSizeStyle = `w-28 h-10 text-wrap`;

  let fontSize = zoomLevelMap[DEFAULT_ZOOM_LEVEL].fontSize;

  // Apply uniform width logic when uniformBoxes style is enabled
  if (ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && !ctxIsHebrew) {
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

  const isDefaultBorderColor = (color: string) => {
    const normalizedColor = (color.startsWith('#') ? color : `#${color}`).toLowerCase();
    const normalizedDefault = DEFAULT_BORDER_COLOR.toLowerCase();
    return normalizedColor === normalizedDefault;
  };

  const renderIndents = (times: number) => {
    return (
      <div className="flex">
        {[...Array(times)].map((_, i) => (
          <div
            key={i}
            className={`wordBlock ${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 'mx-0' : 'mx-1'} select-none rounded border outline-offset-[-4px]`}
            style={{
              boxSizing: 'border-box',
              border: `${isDefaultBorderColor(borderColorLocal) ? '2px' : '3px'} solid transparent`,
              padding: `${isDefaultBorderColor(borderColorLocal) ? '2px' : '1px'}`,
            }}>
            <span className="flex select-none">
              {<sup {...verseNumStyles}></sup>}
              <span className={`whitespace-nowrap break-keep flex select-none px-2 ${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 'py-0.5' : 'py-1'} items-center justify-center text-center leading-none ${fontSize}
              ${ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}>
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex">
      {/* Show indents when uniformBoxes style is enabled */}
      {ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && indentsLocal > 0 && renderIndents(indentsLocal)}
      <div
        id={wordProps.wordId.toString()}
        key={wordProps.wordId}
        className={`wordBlock ${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? (selected ? 'mx-1' : 'mx-0') : 'mx-1'} ${selected ? 'rounded border outline outline-offset-1 outline-[3px] outline-[#FFC300] drop-shadow-md' : 'rounded border outline-offset-[-4px]'}`}
        style={{
          background: `${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 
            (colorFillLocal !== DEFAULT_COLOR_FILL ? colorFillLocal : 'transparent') : 
            colorFillLocal}`,
          boxSizing: 'border-box',
          border: `${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 
            (!isDefaultBorderColor(borderColorLocal) ? `2px solid ${borderColorLocal}` : '2px solid transparent') : 
            `${!isDefaultBorderColor(borderColorLocal) ? '3px' : '2px'} solid ${borderColorLocal}`}`,
          padding: `${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 
            '0px' : 
            !isDefaultBorderColor(borderColorLocal) ? '1px' : '2px'}`,
          color: `${textColorLocal}`,
          lineHeight: `${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? '0.8' : 'inherit'}`,
        }}>
        <span
          className="flex"
          onClick={handleClick}
        >
          {wordProps.showVerseNum ?
            <EsvPopover
              verseNumStyles={verseNumStyles}
              chapterNumber={wordProps.chapter}
              verseNumber={wordProps.verse}
              bookName={ctxStudyBook}
            /> :
            (ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes) ? <sup {...verseNumStyles}></sup> : ''}
          <span
            className={`whitespace-nowrap break-keep flex select-none ${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 
              (wordProps.showVerseNum ? 'px-1' : 'px-0') : 'px-2'} ${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 'py-0.5' : 'py-1'} items-center justify-center text-center hover:opacity-60 leading-none ClickBlock ${fontSize}
              ${ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && (ctxIsHebrew ? hebBlockSizeStyle : engBlockSizeStyle)}`}
            data-clicktype="clickable"
          >
            {ctxIsHebrew ? wordProps.wlcWord : (
              isEditingGloss ? (
                <textarea
                  ref={glossInputRef}
                  value={glossDraft}
                  onChange={handleGlossChange}
                  onKeyDown={handleGlossKeyDown}
                  onBlur={handleGlossBlur}
                  rows={1}
                  className="w-full h-full resize-none bg-transparent text-current text-center leading-none focus:outline-none"
                  style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                />
              ) : currentGlossValue
            )}
          </span>
        </span>
      </div>
    </div>
  );

}
