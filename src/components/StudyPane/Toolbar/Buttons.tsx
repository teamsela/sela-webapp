"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowUpNarrowWide, LuArrowDownWideNarrow, LuNotebookPen } from "react-icons/lu";
import { MdOutlineModeEdit, MdOutlinePlaylistAdd } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineClear } from "react-icons/ai";
import { VscClearAll } from "react-icons/vsc";
import { TbArrowAutofitContent, TbArrowAutofitContentFilled, TbEdit } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";
import { TbBoxModel2, TbBoxModel2Off } from "react-icons/tb";

import { SwatchesPicker } from 'react-color';
import { FALLBACK_SWATCH_GROUPS } from "@/lib/colors";
import React, { useContext, useEffect, useCallback, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext, HistoryEntry, cloneHighlightCache, cloneWordsColorMap } from '../index';
import { BoxDisplayConfig, BoxDisplayStyle, ColorActionType, ColorPickerProps, LanguageMode, StructureUpdateType } from "@/lib/types";
import { updateMetadataInDb } from "@/lib/actions";

import { ColorSource, StudyMetadata, StropheProps, WordProps, ColorData } from '@/lib/data';
import { clearAllFormattingState } from "@/lib/formatting";

export const ToolTip = ({ text }: { text: string }) => {
  return (
    <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
      {text}
    </div>
  )
}

export const UndoBtn = () => {
  const {
    ctxStudyId,
    ctxSetStudyMetadata,
    ctxHistory,
    ctxPointer,
    ctxSetPointer,
    ctxSetWordsColorMap,
    ctxSetActiveHighlightId,
    ctxHighlightCacheRef,
  } = useContext(FormatContext);

  const restoreHistoryEntry = useCallback(
    (entry: HistoryEntry) => {
      const metadataClone = structuredClone(entry.metadata);
      if (!metadataClone.words) {
        metadataClone.words = {};
      }
      ctxSetStudyMetadata(metadataClone);
      ctxSetWordsColorMap(cloneWordsColorMap(entry.wordsColorMap));
      ctxHighlightCacheRef.current = cloneHighlightCache(entry.highlightCache);
      Object.entries(entry.activeHighlightIds).forEach(([source, id]) =>
        ctxSetActiveHighlightId(source as ColorSource, id),
      );
      updateMetadataInDb(ctxStudyId, metadataClone);
    },
    [ctxHighlightCacheRef, ctxSetActiveHighlightId, ctxSetStudyMetadata, ctxSetWordsColorMap, ctxStudyId],
  );

  const buttonEnabled = (ctxPointer !== 0);

  const handleClick = () => {
    if (buttonEnabled) {
      const newPointer = ctxPointer - 1;
      const entry = ctxHistory[newPointer];
      if (!entry) {
        return;
      }
      ctxSetPointer(newPointer);
      restoreHistoryEntry(entry);
    }
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center pl-3 px-1 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <LuUndo2 fontSize="1.5em" opacity={(buttonEnabled) ? `1` : `0.4`} />
      </button>
      <ToolTip text="Undo" />
    </div>
  );
};

export const RedoBtn = () => {
  const {
    ctxStudyId,
    ctxSetStudyMetadata,
    ctxHistory,
    ctxPointer,
    ctxSetPointer,
    ctxSetWordsColorMap,
    ctxSetActiveHighlightId,
    ctxHighlightCacheRef,
  } = useContext(FormatContext);

  const restoreHistoryEntry = useCallback(
    (entry: HistoryEntry) => {
      const metadataClone = structuredClone(entry.metadata);
      if (!metadataClone.words) {
        metadataClone.words = {};
      }
      ctxSetStudyMetadata(metadataClone);
      ctxSetWordsColorMap(cloneWordsColorMap(entry.wordsColorMap));
      ctxHighlightCacheRef.current = cloneHighlightCache(entry.highlightCache);
      Object.entries(entry.activeHighlightIds).forEach(([source, id]) =>
        ctxSetActiveHighlightId(source as ColorSource, id),
      );
      updateMetadataInDb(ctxStudyId, metadataClone);
    },
    [ctxHighlightCacheRef, ctxSetActiveHighlightId, ctxSetStudyMetadata, ctxSetWordsColorMap, ctxStudyId],
  );

  const buttonEnabled = (ctxPointer !== ctxHistory.length - 1);

  const handleClick = () => {
    if (buttonEnabled) {
      const newPointer = ctxPointer + 1;
      const entry = ctxHistory[newPointer];
      if (!entry) {
        return;
      }
      ctxSetPointer(newPointer);
      restoreHistoryEntry(entry);
    }
  }
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-3 dark:border-strokedark xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <LuRedo2 fontSize="1.5em" opacity={buttonEnabled ? `1` : `0.4`} />
      </button>
      <ToolTip text="Redo" />
    </div>
  );
};

export const ColorActionBtn: React.FC<ColorPickerProps> = ({
  colorAction,
  setSelectedColor,
  setColorAction
}) => {
  const { ctxStudyId, ctxStudyMetadata, ctxColorAction, ctxColorFill, ctxBorderColor, ctxTextColor,
    ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes, ctxAddToHistory,
    ctxWordsColorMap, ctxSetWordsColorMap, ctxHighlightCacheRef, ctxSetActiveHighlightId, ctxActiveHighlightIds
  } = useContext(FormatContext);

  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [displayColor, setDisplayColor] = useState("");
  const [stagedMetadata, setStagedMetadata] = useState<StudyMetadata | undefined>(undefined);

  const refreshDisplayColor = useCallback(() => {
    (colorAction === ColorActionType.colorFill) && setDisplayColor(ctxColorFill || DEFAULT_COLOR_FILL);
    (colorAction === ColorActionType.borderColor) && setDisplayColor(ctxBorderColor || DEFAULT_BORDER_COLOR);
    (colorAction === ColorActionType.textColor) && setDisplayColor(ctxTextColor || DEFAULT_TEXT_COLOR);
  }, [colorAction, ctxColorFill, ctxBorderColor, ctxTextColor]);
  
  useEffect(() => {
    const hasSelectedItems = (ctxNumSelectedWords > 0 || (ctxNumSelectedStrophes > 0 && colorAction != ColorActionType.textColor));
    setButtonEnabled(hasSelectedItems);

    // make sure the colour picker turns off completely when user de-selects everything
    if (!hasSelectedItems) {
      setColorAction(ColorActionType.none);
      setSelectedColor("");
      if (stagedMetadata !== undefined) {
        ctxAddToHistory(stagedMetadata);
        updateMetadataInDb(ctxStudyId, stagedMetadata);
        setStagedMetadata(undefined);
      }
    }
    else {
      refreshDisplayColor();
    }
  }, [ctxNumSelectedWords, ctxNumSelectedStrophes, refreshDisplayColor, setColorAction, setSelectedColor, colorAction])

  useEffect(() => {
    if (ctxColorAction === ColorActionType.resetColor || ctxColorAction === ColorActionType.resetAllColor) {
      refreshDisplayColor();
      setColorAction(ColorActionType.none);
    }
  }, [ctxColorAction, refreshDisplayColor])

  const handleClick = () => {
    setColorAction(ColorActionType.none);
    if (buttonEnabled) {
      setColorAction((ctxColorAction != colorAction) ? colorAction : ColorActionType.none);
      setSelectedColor("");
    }
  }

  const handleColorPickerChange = (color: any) => {
    //console.log("Changing " + colorActionType + " color to " + color.hex);
    setColorAction(colorAction);
    setSelectedColor(color.hex);
    setDisplayColor(color.hex);
    let colorObj : ColorData = {};
    switch (colorAction) {
      case (ColorActionType.colorFill): { colorObj = { fill: color.hex }; break; }
      case (ColorActionType.borderColor): { colorObj = { border: color.hex }; break; }
      case (ColorActionType.textColor): { colorObj = { text: color.hex }; break; }
    }

    let isChanged = false;

    ctxSelectedWords.forEach((word) => {
      const wordId = word.wordId;
      let wordMetadata = ctxStudyMetadata.words[wordId];

      // If the word has a Smart Highlight (source is present), we should try to find the original color
      // to avoid baking in the highlight traits (like Black Border).
      const currentMapColor = ctxWordsColorMap.get(wordId);
      if (currentMapColor?.source) {
        const source = currentMapColor.source;
        const activeId = ctxActiveHighlightIds[source];
        if (activeId) {
          const cacheKey = `${source}::${activeId}`;
          const cachedMap = ctxHighlightCacheRef.current.get(cacheKey);
          
          // If the cache exists, it means we have original colors stored.
          // We do NOT revert to the cached original here, because we want the manual change
          // to apply on top of the active highlight (e.g. changing fill while keeping highlight border).
          // We also do NOT update the cache, because "Clear Highlight" should revert everything
          // including these manual changes.
          
          // Ensure metadata exists so we can update it below
          if (!wordMetadata) {
             ctxStudyMetadata.words[wordId] = { color: {} };
             wordMetadata = ctxStudyMetadata.words[wordId];
          }
        }
      }
    
      if (!wordMetadata) {
        isChanged = true;
        ctxStudyMetadata.words[wordId] = { color: { ...colorObj } };
        return;
      }
    
      if (!wordMetadata.color) {
        isChanged = (wordMetadata.color !== colorObj);
        wordMetadata.color = { ...colorObj };
        return;
      }
    
      const currentColor = wordMetadata.color;
    
      switch (colorAction) {
        case ColorActionType.colorFill:
          if (currentColor.fill !== color.hex) {
            isChanged = true;
            currentColor.fill = color.hex;
          }
          break;
        case ColorActionType.borderColor:
          if (currentColor.border !== color.hex) {
            isChanged = true;
            currentColor.border = color.hex;
          }
          break;
        case ColorActionType.textColor:
          if (currentColor.text !== color.hex) {
            isChanged = true;
            currentColor.text = color.hex;
          }
          break;
      }
    });

    if (ctxSelectedStrophes.length > 0) {

      // find the index to the first word of the strophe
      const selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;

      const wordMetadata = ctxStudyMetadata.words[selectedWordId];

      if (wordMetadata.stropheMd && wordMetadata.stropheMd.color) {
        const colorProp = colorAction === ColorActionType.colorFill ? "fill" : colorAction === ColorActionType.borderColor ? "border" : null;
        if (colorProp && wordMetadata.stropheMd.color[colorProp] !== color.hex) {
          wordMetadata.stropheMd.color[colorProp] = color.hex;
          isChanged = true;
        }
      }
      else {
        wordMetadata.stropheMd ??= {};
        wordMetadata.stropheMd.color ??= { ...colorObj};
        isChanged = true;
      }
    }

    if (isChanged || ctxSelectedWords.length > 0) {
      const nextColorMap = new Map(ctxWordsColorMap);
      let mapChanged = false;

      // Update the visual map to reflect the changes we just made to the metadata
      if (ctxSelectedWords.length > 0) {
        ctxSelectedWords.forEach((word) => {
          const wordMd = ctxStudyMetadata.words[word.wordId];
          const palette = wordMd?.color;
          const { source: _src, ...normalized } = palette || {};
          const hasColor = Object.keys(normalized).length > 0;
          const desired = hasColor ? { ...normalized } : undefined;

          // Always update the map to ensure manual override takes precedence over highlights
          if (desired) {
            nextColorMap.set(word.wordId, { ...desired });
            mapChanged = true;
          } else {
            if (nextColorMap.has(word.wordId)) {
              nextColorMap.delete(word.wordId);
              mapChanged = true;
            }
          }
        });
      }

      if (mapChanged) {
        ctxSetWordsColorMap(nextColorMap);
      }
    }

    (isChanged) && setStagedMetadata(ctxStudyMetadata);
  } 

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row ClickBlock">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'} ClickBlock`}
        onClick={handleClick} >
        {
          (colorAction === ColorActionType.colorFill) && <BiSolidColorFill className="ClickBlock" fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.4em" />
        }
        {
          (colorAction === ColorActionType.borderColor) && <MdOutlineModeEdit className="ClickBlock" fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.4em" />
        }
        {
          (colorAction === ColorActionType.textColor) && <BiFont className="ClickBlock" fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" />
        }
        <div
          // TODO: using embbed style for the color display for now, may move to tailwind after some research
          style={
            {
              width: "100%",
              height: "0.25rem",
              background: `${buttonEnabled ? displayColor : '#FFFFFF'}`,
              marginTop: "0.05rem",
            }
          }
        >
        </div>
      </button>

      {
        ctxColorAction === colorAction && buttonEnabled && (
          <div className="relative z-10">
            <div className="absolute top-6 -left-6">
              <SwatchesPicker
                width={580}
                height={180}
                color={displayColor || "#FFFFFF"}
                colors={FALLBACK_SWATCH_GROUPS}
                onChange={handleColorPickerChange}
              />
             </div>
          </div>
        )
      }
    </div>
  );
};

const EDIT_INDICATOR_COLOR = "#3C50E0";

export const EditWordBtn = () => {
  const {
    ctxSelectedWords,
    ctxNumSelectedWords,
    ctxIsHebrew,
    ctxInViewMode,
    ctxEditingWordId,
    ctxSetEditingWordId,
  } = useContext(FormatContext);

  const singleWordSelected = ctxNumSelectedWords === 1 && ctxSelectedWords.length === 1;
  const selectedWordId = singleWordSelected ? ctxSelectedWords[0]?.wordId : undefined;
  const hasSelectedWord = typeof selectedWordId === "number";
  const buttonEnabled = hasSelectedWord && !ctxIsHebrew && !ctxInViewMode;
  const isEditing = buttonEnabled && selectedWordId === ctxEditingWordId;

  const handleClick = () => {
    if (!buttonEnabled || selectedWordId === undefined) {
      return;
    }
    ctxSetEditingWordId(isEditing ? null : selectedWordId);
  };

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'} ClickBlock`}
        onClick={handleClick}
      >
        <TbEdit
          className="ClickBlock"
          fontSize="1.4em"
          opacity={buttonEnabled ? "1" : "0.4"}
          color={isEditing ? EDIT_INDICATOR_COLOR : undefined}
        />
        <div
          style={{
            width: "100%",
            height: "0.25rem",
            background: `${buttonEnabled && isEditing ? EDIT_INDICATOR_COLOR : '#FFFFFF'}`,
            opacity: buttonEnabled ? 1 : 0.4,
            marginTop: "0.05rem",
          }}
        />
      </button>
      <ToolTip text="Edit English gloss" />
    </div>
  );
};

export const ClearFormatBtn = ({ setColorAction }: { setColorAction: (arg: number) => void }) => {

  const { ctxStudyId, ctxStudyMetadata, ctxAddToHistory,
    ctxNumSelectedWords, ctxSelectedWords, 
    ctxNumSelectedStrophes, ctxSelectedStrophes,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor,
    ctxSetWordsColorMap, ctxWordsColorMap, ctxHighlightCacheRef,
    ctxActiveHighlightIds, ctxSetActiveHighlightId
  } = useContext(FormatContext);

  const [buttonEnabled, setButtonEnabled] = useState(false);

  useEffect(() => {
    const hasSelectedItems = (ctxNumSelectedWords > 0 || ctxNumSelectedStrophes > 0);
    setButtonEnabled(hasSelectedItems);

    // make sure the colour picker turns off completely when user de-selects everything
    if (!hasSelectedItems) {
      setColorAction(ColorActionType.none);
    }
  }, [ctxNumSelectedWords, ctxNumSelectedStrophes, setColorAction])

  const handleClick = () => {
    if (buttonEnabled) {
      setColorAction(ColorActionType.resetColor);
      ctxSetColorFill(DEFAULT_COLOR_FILL);
      ctxSetBorderColor(DEFAULT_BORDER_COLOR);

      let isChanged = false;
      if (ctxSelectedWords.length > 0) {
        ctxSetTextColor(DEFAULT_TEXT_COLOR);
        ctxSelectedWords.map((word) => {
          const wordMetadata = ctxStudyMetadata.words[word.wordId];
          if (wordMetadata && wordMetadata?.color) {
            isChanged = 
              (wordMetadata?.color?.fill !== undefined && wordMetadata?.color?.fill != DEFAULT_COLOR_FILL) ||
              (wordMetadata?.color?.border !== undefined && wordMetadata?.color?.border != DEFAULT_BORDER_COLOR) ||
              (wordMetadata?.color?.text !== undefined && wordMetadata?.color?.text != DEFAULT_TEXT_COLOR);
            delete wordMetadata["color"];
          }
        })
      }     
      if (ctxSelectedStrophes.length > 0) {
        const selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
        if (ctxStudyMetadata.words[selectedWordId].color) {
          isChanged = isChanged ||
            (ctxStudyMetadata.words[selectedWordId].color?.fill != DEFAULT_COLOR_FILL) ||
            (ctxStudyMetadata.words[selectedWordId].color?.border != DEFAULT_BORDER_COLOR);
          delete ctxStudyMetadata.words[selectedWordId].color;
        }
      }
      if (isChanged) {
        const nextColorMap = new Map(ctxWordsColorMap);
        ctxSelectedWords.forEach((word) => nextColorMap.delete(word.wordId));

        ctxAddToHistory(ctxStudyMetadata, {
          wordsColorMap: nextColorMap,
          activeHighlightIds: ctxActiveHighlightIds,
          highlightCache: ctxHighlightCacheRef.current,
        });
        ctxSetWordsColorMap(nextColorMap);
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      }

      // keep active highlights intact; we only cleared selected words
    }
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <AiOutlineClear className="ClickBlock" fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.4em" />
      </button>
      <ToolTip text="Clear format" />
    </div>
  );
};

export const ClearAllFormatBtn = ({ setColorAction }: { setColorAction: (arg: number) => void }) => {

  const { ctxStudyId, ctxStudyMetadata, ctxNumSelectedWords,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor,
    ctxAddToHistory, ctxSetWordsColorMap,
    ctxSetActiveHighlightId, ctxHighlightCacheRef, ctxActiveHighlightIds,
    ctxWordsColorMap, ctxSetStudyMetadata,
  } = useContext(FormatContext);

  const [buttonEnabled, setButtonEnabled] = useState(false);

  useEffect(() => {

    let hasCustomColor : boolean = false;
    Object.values(ctxStudyMetadata.words).forEach((wordMetadata) => {
      if (wordMetadata && wordMetadata?.color) {
        hasCustomColor = true;
      }
      if (wordMetadata && wordMetadata?.stropheMd && wordMetadata.stropheMd.color) {
        hasCustomColor = true;
      }
    });

    setButtonEnabled(hasCustomColor);
  }, [ctxNumSelectedWords, ctxStudyMetadata, setColorAction]);

  const handleClick = () => {
    setColorAction(ColorActionType.resetAllColor);
    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    ctxSetTextColor(DEFAULT_TEXT_COLOR);

    const metadataClone = structuredClone(ctxStudyMetadata);
    const colorMapClone = new Map<number, ColorData>(ctxWordsColorMap);
    const cleared = clearAllFormattingState(metadataClone, colorMapClone);

    if (!cleared) {
      return;
    }

    ctxSetWordsColorMap(colorMapClone);
    ctxHighlightCacheRef.current.clear();
    Object.keys(ctxActiveHighlightIds).forEach((highlightSource) =>
      ctxSetActiveHighlightId(highlightSource as ColorSource, null),
    );
    ctxSetStudyMetadata(metadataClone);
    const clearedActiveHighlights: Record<ColorSource, string | null> = {
      ...ctxActiveHighlightIds,
    };
    Object.keys(clearedActiveHighlights).forEach(
      (highlightSource) => (clearedActiveHighlights[highlightSource as ColorSource] = null),
    );
    ctxAddToHistory(metadataClone, {
      wordsColorMap: colorMapClone,
      activeHighlightIds: clearedActiveHighlights,
      highlightCache: ctxHighlightCacheRef.current,
    });
    updateMetadataInDb(ctxStudyId, metadataClone);
    setButtonEnabled(false);
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <VscClearAll className="ClickBlock" fontSize="1.4em" opacity={(buttonEnabled) ? `1` : `0.4`} />
      </button>
      <ToolTip text="Clear all format" />
    </div>
  );
};

export const UniformWidthBtn = ({ setBoxStyle }: {
  setBoxStyle: (arg: BoxDisplayConfig) => void,
}) => {
  const { ctxBoxDisplayConfig, ctxInViewMode, ctxStudyId, ctxStudyMetadata, ctxSetStudyMetadata, ctxAddToHistory } = useContext(FormatContext);

  const handleClick = () => {
    let newStyle: BoxDisplayStyle;
    if (ctxBoxDisplayConfig.style === BoxDisplayStyle.box) {
      newStyle = BoxDisplayStyle.uniformBoxes;
    } else if (ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes) {
      newStyle = BoxDisplayStyle.box;
    } else {
      // If noBox, toggle to box
      newStyle = BoxDisplayStyle.box;
    }
    
    const newConfig = { style: newStyle };
    ctxStudyMetadata.boxStyle = newConfig;
    setBoxStyle(newConfig);
    ctxSetStudyMetadata(ctxStudyMetadata);
    if (!ctxInViewMode) {
      //ctxAddToHistory(ctxStudyMetadata);
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }
  }
  
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        {
          ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && <TbArrowAutofitContentFilled fontSize="1.5em" />
        }
        {
          ctxBoxDisplayConfig.style !== BoxDisplayStyle.uniformBoxes && <TbArrowAutofitContent fontSize="1.5em" />
        }
      </button>
      {
        ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && <ToolTip text="Disable uniform width" />
      }
      {
        ctxBoxDisplayConfig.style !== BoxDisplayStyle.uniformBoxes && <ToolTip text="Enable uniform width" />
      }      
    </div>
  );
};

export const BoxlessBtn = ({ setBoxStyle }: {
  setBoxStyle: (arg: BoxDisplayConfig) => void,
}) => {
  const { ctxBoxDisplayConfig, ctxInViewMode, ctxStudyId, ctxStudyMetadata, ctxSetStudyMetadata } = useContext(FormatContext);

  const handleClick = () => {
    let newStyle: BoxDisplayStyle;
    if (ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox) {
      newStyle = BoxDisplayStyle.box;
    } else {
      newStyle = BoxDisplayStyle.noBox;
    }
    
    const newConfig = { style: newStyle };
    ctxStudyMetadata.boxStyle = newConfig;
    setBoxStyle(newConfig);
    ctxSetStudyMetadata(ctxStudyMetadata);
    if (!ctxInViewMode) {
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }
  }
  
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        {
          ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox && <TbBoxModel2 fontSize="1.5em" />
        }
        {
          ctxBoxDisplayConfig.style !== BoxDisplayStyle.noBox && <TbBoxModel2Off fontSize="1.5em" />
        }
      </button>
      {
        ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox && <ToolTip text="Enable boxes" />
      }
      {
        ctxBoxDisplayConfig.style !== BoxDisplayStyle.noBox && <ToolTip text="Disable boxes" />
      }      
    </div>
  );
};

export const IndentBtn = ({ leftIndent }: { leftIndent: boolean }) => {

  const { ctxStudyId, ctxLanguageMode, ctxStudyMetadata, ctxBoxDisplayConfig, ctxIndentNum, ctxSetIndentNum, 
    ctxSelectedWords, ctxNumSelectedWords, ctxAddToHistory } = useContext(FormatContext);
  const [buttonEnabled, setButtonEnabled] = useState(ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && (ctxNumSelectedWords === 1));

  useEffect(() => {
    let indentNum : number = 0;
    if (ctxSelectedWords.length === 1) {
      const wordMetadata = ctxStudyMetadata.words[ctxSelectedWords[0].wordId];
      indentNum = (wordMetadata) ? (wordMetadata?.indent || 0) : 0;
      ctxSetIndentNum(indentNum);
    }
    let validIndent = (!leftIndent) ? ctxIndentNum > 0 : ctxIndentNum < 3;
    // Enable indent buttons when uniformBoxes style is enabled
    setButtonEnabled(ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes && (ctxNumSelectedWords === 1) && validIndent);
  }, [ctxBoxDisplayConfig.style, ctxNumSelectedWords, ctxSelectedWords, ctxStudyMetadata, ctxIndentNum, ctxLanguageMode, ctxSetIndentNum, leftIndent]);

  const handleClick = () => {
    if (ctxBoxDisplayConfig.style !== BoxDisplayStyle.uniformBoxes || ctxSelectedWords.length === 0)
      return;
    
    const selectedWordId = ctxSelectedWords[0].wordId;
    const wordMetadata = ctxStudyMetadata.words[selectedWordId];
    let indentNum : number = (wordMetadata) ? (wordMetadata?.indent || 0) : 0;
    if (!leftIndent) {
      if (indentNum > 0) {
        ctxStudyMetadata.words[selectedWordId] = {
          ...ctxStudyMetadata.words[selectedWordId],
          indent: --indentNum,
        };
        (indentNum == 0) && (delete ctxStudyMetadata.words[selectedWordId].indent);
        ctxSetIndentNum(indentNum);
        ctxAddToHistory(ctxStudyMetadata);
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
        setButtonEnabled(indentNum > 0);
      }
    }
    else {
      if (indentNum < 3) {
        ctxStudyMetadata.words[selectedWordId] = {
          ...ctxStudyMetadata.words[selectedWordId],
          indent: ++indentNum,
        };
        ctxSetIndentNum(indentNum);
        ctxAddToHistory(ctxStudyMetadata);
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
        setButtonEnabled(indentNum < 3);
      }
    }
  }
  return (
    <div className={`flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row hbFontExemption `}>
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        {
          ((ctxLanguageMode != LanguageMode.Hebrew) && leftIndent) || ((ctxLanguageMode == LanguageMode.Hebrew) && !leftIndent) ?
            <CgFormatIndentIncrease fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" /> :
            <CgFormatIndentDecrease fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" />
        }
      </button>
      <ToolTip text={(leftIndent) ? "Add indent" : "Remove indent"} />
    </div>
  );
};

const areStrophesContiguous = (strophes: StropheProps[]): boolean => {
  if (strophes.length <= 1) return true;

  const sorted = [...strophes].sort((a, b) =>
    a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentLastWordId = sorted[i].lines.at(-1)?.words.at(-1)?.wordId;
    const nextFirstWordId = sorted[i + 1].lines[0].words[0].wordId;

    if (currentLastWordId === undefined || nextFirstWordId !== currentLastWordId + 1) {
      return false;
    }
  }

  return true;
};

const areWordsContiguous = (words: WordProps[]): boolean => {
  if (words.length <= 1) return true;

  const sorted = [...words].sort((a, b) => a.wordId - b.wordId);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].wordId !== sorted[i].wordId + 1) {
      return false;
    }
  }

  return true;
};

export const StructureUpdateBtn = ({ updateType, toolTip }: { updateType: StructureUpdateType, toolTip: string }) => {

  const { ctxSelectedWords, ctxLanguageMode, ctxSetStructureUpdateType, ctxNumSelectedStrophes, ctxSelectedStrophes, ctxPassageProps } = useContext(FormatContext);

  let buttonEnabled = false;
  let hasWordSelected = (ctxSelectedWords.length > 0);
  // let singleWordSelected = (ctxSelectedWords.length === 1);
  let hasStropheSelected = (ctxSelectedStrophes.length === 1);
  let hasStrophesSelected = (ctxNumSelectedStrophes >= 1) && (ctxPassageProps.stropheCount > 1) && (ctxSelectedStrophes[0] !== undefined);

  const sortedWords = [...ctxSelectedWords].sort((a, b) => a.wordId - b.wordId);
  const firstSelectedWord = sortedWords[0];
  const lastSelectedWord = sortedWords[sortedWords.length - 1];
  const sortedStrophes = [...ctxSelectedStrophes].sort((a, b) => a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);
  const firstSelectedStrophe = sortedStrophes[0];
  const lastSelectedStrophe = sortedStrophes[sortedStrophes.length - 1];
  const isHebrew = (ctxLanguageMode == LanguageMode.Hebrew);

  if (updateType === StructureUpdateType.newLine) {
    if (hasWordSelected && firstSelectedWord) {
      const sameStrophe = ctxSelectedWords.every(w => w.stropheId === firstSelectedWord.stropheId);
      let wholeLine = false;
      const sameLine = ctxSelectedWords.every(w => w.lineId === firstSelectedWord.lineId && w.stropheId === firstSelectedWord.stropheId);
      if (sameLine) {
        const lineWords = ctxPassageProps.stanzaProps[firstSelectedWord.stanzaId]
          .strophes[firstSelectedWord.stropheId].lines[firstSelectedWord.lineId].words.length;
        wholeLine = ctxSelectedWords.length === lineWords;
      }
      const isFirstWord = ctxPassageProps.stanzaProps[firstSelectedWord.stanzaId]
        .strophes[firstSelectedWord.stropheId].lines[firstSelectedWord.lineId].words[0].wordId === firstSelectedWord.wordId;
      buttonEnabled = sameStrophe && !wholeLine && areWordsContiguous(ctxSelectedWords) && !isFirstWord;
    } else {
      buttonEnabled = false;
    }
  } else if (updateType === StructureUpdateType.mergeWithPrevLine) {
    buttonEnabled = hasWordSelected && firstSelectedWord && firstSelectedWord.lineId !== 0;
  } else if (updateType === StructureUpdateType.mergeWithNextLine) {
      buttonEnabled = hasWordSelected && lastSelectedWord &&
        ctxPassageProps.stanzaProps[lastSelectedWord.stanzaId]
        .strophes[lastSelectedWord.stropheId]?.lines?.length - 1 !== lastSelectedWord.lineId;
  } else if (updateType === StructureUpdateType.newStrophe) {
    buttonEnabled = hasWordSelected && !!firstSelectedWord && areWordsContiguous(ctxSelectedWords);
  } else if (updateType === StructureUpdateType.mergeWithPrevStrophe) {
    buttonEnabled = ((hasWordSelected && firstSelectedWord && !firstSelectedWord.firstStropheInStanza) ||
      (hasStropheSelected && firstSelectedStrophe && !firstSelectedStrophe.firstStropheInStanza));
  } else if (updateType === StructureUpdateType.mergeWithNextStrophe) {
    buttonEnabled = ((hasWordSelected && lastSelectedWord && !lastSelectedWord.lastStropheInStanza) ||
      (hasStropheSelected && lastSelectedStrophe && !lastSelectedStrophe.lastStropheInStanza));
  } else if (updateType === StructureUpdateType.newStanza) {
    buttonEnabled = hasStrophesSelected && !!firstSelectedStrophe && areStrophesContiguous(ctxSelectedStrophes);
  } else if (updateType === StructureUpdateType.mergeWithPrevStanza) {
    buttonEnabled = hasStrophesSelected &&
      (ctxSelectedStrophes[0].lines[0].words[0].stanzaId !== undefined && ctxSelectedStrophes[0].lines[0].words[0].stanzaId > 0) &&
      areStrophesContiguous(ctxSelectedStrophes);
  } else if (updateType === StructureUpdateType.mergeWithNextStanza) {
    buttonEnabled = hasStrophesSelected &&
      (ctxSelectedStrophes[0].lines[0].words[0].stanzaId !== undefined && ctxSelectedStrophes[0].lines[0].words[0].stanzaId < ctxPassageProps.stanzaCount - 1) &&
      areStrophesContiguous(ctxSelectedStrophes);
  }

  const handleClick = () => { buttonEnabled && ctxSetStructureUpdateType(updateType) };

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        {
          (updateType === StructureUpdateType.newLine) && <MdOutlinePlaylistAdd opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          (updateType === StructureUpdateType.mergeWithPrevLine) && <LuArrowUpToLine opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          (updateType === StructureUpdateType.mergeWithNextLine) && <LuArrowDownToLine opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          (updateType === StructureUpdateType.newStrophe) && <CgArrowsBreakeV opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          (updateType === StructureUpdateType.mergeWithPrevStrophe) && <LuArrowUpNarrowWide opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          (updateType === StructureUpdateType.mergeWithNextStrophe) && <LuArrowDownWideNarrow opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          (updateType === StructureUpdateType.newStanza) && <CgArrowsBreakeH opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          ((updateType == StructureUpdateType.mergeWithPrevStanza && !isHebrew) || updateType == StructureUpdateType.mergeWithNextStanza && isHebrew) && <LuArrowDownWideNarrow style={{ transform: 'rotate(90deg)' }} opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          ((updateType == StructureUpdateType.mergeWithNextStanza && !isHebrew) || updateType == StructureUpdateType.mergeWithPrevStanza && isHebrew) && <LuArrowUpNarrowWide style={{ transform: 'rotate(90deg)' }} opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        <ToolTip text={toolTip} />
      </button>
    </div>
  );
};

export const StudyBtn = ({
  setCloneStudyOpen
}: {
  setCloneStudyOpen: (arg: boolean) => void;
}) => {

  return (
    <>
    <div>
      <button onClick={() => {
          setCloneStudyOpen(true);
        }} className="rounded-lg bg-primary py-2 px-2 text-center text-sm text-white hover:bg-opacity-90 lg:px-6 xl:px-8">
          Copy to My Studies
      </button>
    </div>
    </>   
  );
};

export const StropheNoteBtn = () => {
  const { ctxStropheNoteBtnOn, ctxSetStropheNoteBtnOn, ctxLanguageMode } = useContext(FormatContext)
  const disabled = ctxLanguageMode === LanguageMode.Parallel;
  return (
    <div >
      <button 
        className={`${ctxStropheNoteBtnOn ? 'bg-white': ''} py-2 px-2 rounded-[5px] bg-[#F2F2F2] border-[2px] border-[#D9D9D9] top-0 w-full h-[40px] place-content-around items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {!disabled && ctxSetStropheNoteBtnOn(!ctxStropheNoteBtnOn)}}
        disabled={disabled}
      >
      <LuNotebookPen />
      </button>
    </div>
  )
}
