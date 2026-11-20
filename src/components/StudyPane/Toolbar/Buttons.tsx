"use client";

import { LuUndo2, LuRedo2, LuNotebookPen, LuPaintBucket, LuBaseline, LuRemoveFormatting, LuEraser, LuTextCursorInput, LuIndentIncrease, LuIndentDecrease } from "react-icons/lu";
import { CgEreader } from "react-icons/cg";
import { ToolbarButton, ToolTip } from "./ToolbarButton";
import { BorderColorIcon, StructureIcon, UniformWidthIcon, WordBoxesIcon, type StructureAction, type StructureLevel } from "./ToolbarIcons";
import {
  clearAllAvailability,
  clearFormatAvailability,
  colorAvailability,
  editGlossAvailability,
  indentAvailability,
  redoAvailability,
  stanzaTargets,
  structureAvailability,
  undoAvailability,
} from "@/lib/toolbarAvailability";

import { SwatchesPicker } from 'react-color';
import { createPortal } from "react-dom";
import { SwatchSlotContext, useToolbarVariant } from "../Responsive/layout";
import { FALLBACK_SWATCH_GROUPS } from "@/lib/colors";
import React, { useContext, useEffect, useCallback, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext, HistoryEntry, cloneHighlightCache, cloneWordsColorMap } from '../index';
import { BoxDisplayConfig, BoxDisplayStyle, ColorActionType, ColorPickerProps, LanguageMode, StructureUpdateType } from "@/lib/types";
import { updateMetadataInDb } from "@/lib/studyPersistence";

import { ColorSource, StudyMetadata, StropheProps, WordProps, ColorData } from '@/lib/data';
import { clearAllFormattingState } from "@/lib/formatting";

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
    <ToolbarButton label="Undo" shortLabel="Undo" availability={undoAvailability(buttonEnabled)} onClick={handleClick} wrapperClassName="pl-2">
      <LuUndo2 fontSize="1.5em" />
    </ToolbarButton>
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
    <ToolbarButton label="Redo" shortLabel="Redo" availability={redoAvailability(buttonEnabled)} onClick={handleClick} wrapperClassName="px-2">
      <LuRedo2 fontSize="1.5em" />
    </ToolbarButton>
  );
};

export const ColorActionBtn: React.FC<ColorPickerProps> = ({
  colorAction,
  setSelectedColor,
  setColorAction
}) => {
  const { ctxStudyId, ctxStudyMetadata, ctxColorAction, ctxColorFill, ctxBorderColor, ctxTextColor,
    ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes, ctxNumSelectedLayers, ctxAddToHistory,
    ctxWordsColorMap, ctxSetWordsColorMap, ctxHighlightCacheRef, ctxSetActiveHighlightId, ctxActiveHighlightIds,
    ctxAccentBorderWordIds
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
    const hasSelectedItems = (ctxNumSelectedWords > 0 || ctxNumSelectedLayers > 0 || (ctxNumSelectedStrophes > 0 && colorAction != ColorActionType.textColor));
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
  }, [ctxNumSelectedWords, ctxNumSelectedStrophes, ctxNumSelectedLayers, refreshDisplayColor, setColorAction, setSelectedColor, colorAction])

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

    // Structure "Accents in Poetry": when a background (fill) color is applied to
    // the selected ending words, mirror it as a BORDER onto the accent's portion
    // words (cross-word lead words) — the same fill/border split Smart Highlight
    // uses. Portion words are never part of the editable selection.
    const accentBorderIds =
      colorAction === ColorActionType.colorFill ? (ctxAccentBorderWordIds ?? []) : [];
    const selectedWordIdSet = new Set(ctxSelectedWords.map((word) => word.wordId));
    accentBorderIds.forEach((wordId) => {
      if (selectedWordIdSet.has(wordId)) {
        return; // a word that is itself selected keeps its fill
      }
      const wordMetadata = ctxStudyMetadata.words[wordId];
      if (!wordMetadata) {
        ctxStudyMetadata.words[wordId] = { color: { border: color.hex } };
        isChanged = true;
        return;
      }
      wordMetadata.color ??= {};
      if (wordMetadata.color.border !== color.hex) {
        wordMetadata.color.border = color.hex;
        isChanged = true;
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

      // Mirror the accent portion (border) words into the color map too.
      accentBorderIds.forEach((wordId) => {
        if (selectedWordIdSet.has(wordId)) {
          return;
        }
        const wordMd = ctxStudyMetadata.words[wordId];
        const { source: _src, ...normalized } = wordMd?.color || {};
        if (Object.keys(normalized).length > 0) {
          nextColorMap.set(wordId, { ...normalized });
          mapChanged = true;
        }
      });

      if (mapChanged) {
        ctxSetWordsColorMap(nextColorMap);
      }
    }

    (isChanged) && setStagedMetadata(ctxStudyMetadata);
  } 

  const availability = colorAvailability(colorAction, {
    words: ctxNumSelectedWords,
    strophes: ctxNumSelectedStrophes,
    layers: ctxNumSelectedLayers,
  });
  const pickerOpen = ctxColorAction === colorAction && buttonEnabled;
  const { variant } = useToolbarVariant();
  const swatchSlot = useContext(SwatchSlotContext);
  const [label, shortLabel, tourKey] =
    colorAction === ColorActionType.colorFill ? ["Fill color", "Fill", "fill-color"]
    : colorAction === ColorActionType.borderColor ? ["Border color", "Border", "border-color"]
    : ["Text color", "Text", "font-color"];

  return (
    <ToolbarButton
      label={label}
      shortLabel={shortLabel}
      availability={availability}
      pressed={pickerOpen}
      onClick={handleClick}
      dataTour={tourKey}
      tooltip={!pickerOpen}
      extra={
        pickerOpen && variant === "row" ? (
          // Phone color sheet: a grid of swatches under the Fill/Border/Text rows.
          swatchSlot && createPortal(
            <div className="overflow-x-auto pb-2 pt-1">
              <div className="flex w-max gap-1.5">
                {FALLBACK_SWATCH_GROUPS.map((group) => (
                  <div key={group[0]} className="flex flex-col gap-1.5">
                    {group.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={`${label} ${hex}`}
                        onClick={() => handleColorPickerChange({ hex })}
                        className="ClickBlock h-9 w-9 rounded-lg border border-black/10"
                        style={{ background: hex, outline: displayColor === hex ? "3px solid #3C50E0" : undefined, outlineOffset: 2 }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>,
            swatchSlot,
          )
        ) : pickerOpen && (
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
    >
      {colorAction === ColorActionType.colorFill && <LuPaintBucket className="ClickBlock" fontSize="1.4em" />}
      {colorAction === ColorActionType.borderColor && <BorderColorIcon className="ClickBlock" size="1.4em" />}
      {colorAction === ColorActionType.textColor && <LuBaseline className="ClickBlock" fontSize="1.4em" />}
      <div
        className="ClickBlock"
        style={{
          width: "100%",
          height: "0.25rem",
          background: `${buttonEnabled ? displayColor : '#FFFFFF'}`,
          marginTop: "0.05rem",
        }}
      />
    </ToolbarButton>
  );
};


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
    <ToolbarButton
      label="Edit English gloss"
      shortLabel="Gloss"
      availability={editGlossAvailability({ selectedCount: ctxSelectedWords.length, isHebrew: ctxIsHebrew, inViewMode: ctxInViewMode })}
      pressed={isEditing}
      onClick={handleClick}
      dataTour="edit-gloss"
    >
      <LuTextCursorInput className="ClickBlock" fontSize="1.4em" />
    </ToolbarButton>
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
    <ToolbarButton
      label="Clear format"
      shortLabel="Clear"
      availability={clearFormatAvailability({ words: ctxNumSelectedWords, strophes: ctxNumSelectedStrophes })}
      onClick={handleClick}
    >
      <LuRemoveFormatting className="ClickBlock" fontSize="1.4em" />
    </ToolbarButton>
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
    <ToolbarButton label="Clear all format" shortLabel="Clear all" availability={clearAllAvailability(buttonEnabled)} onClick={handleClick}>
      <LuEraser className="ClickBlock" fontSize="1.4em" />
    </ToolbarButton>
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
  
  const on = ctxBoxDisplayConfig.style === BoxDisplayStyle.uniformBoxes;
  return (
    <ToolbarButton label={on ? "Disable uniform width" : "Enable uniform width"} shortLabel="Uniform" pressed={on} onClick={handleClick} dataTour="uniform-width">
      <UniformWidthIcon size="1.5em" />
    </ToolbarButton>
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
  
  const on = ctxBoxDisplayConfig.style !== BoxDisplayStyle.noBox;
  return (
    <ToolbarButton label={on ? "Disable boxes" : "Enable boxes"} shortLabel="Boxes" pressed={on} onClick={handleClick} dataTour="boxes">
      <WordBoxesIcon size="1.5em" />
    </ToolbarButton>
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
  const showIncrease = ((ctxLanguageMode != LanguageMode.Hebrew) && leftIndent) || ((ctxLanguageMode == LanguageMode.Hebrew) && !leftIndent);
  const availability = indentAvailability(leftIndent, {
    boxStyle: ctxBoxDisplayConfig.style,
    selectedCount: ctxNumSelectedWords,
    indent: ctxIndentNum,
  });
  return (
    <ToolbarButton
      label={leftIndent ? "Add indent" : "Remove indent"}
      shortLabel={leftIndent ? "Indent" : "Outdent"}
      availability={buttonEnabled ? { enabled: true } : availability.enabled ? { enabled: false, reason: "Select exactly one word." } : availability}
      onClick={handleClick}
      dataTour={leftIndent ? "indent-add" : "indent-remove"}
      wrapperClassName="px-1 hbFontExemption"
    >
      {showIncrease ? <LuIndentIncrease fontSize="1.5em" /> : <LuIndentDecrease fontSize="1.5em" />}
    </ToolbarButton>
  );
};

const STRUCTURE_ICON: Record<number, { level: StructureLevel; action: StructureAction; short: string }> = {
  [StructureUpdateType.newLine]: { level: "line", action: "new", short: "New" },
  [StructureUpdateType.mergeWithPrevLine]: { level: "line", action: "prev", short: "Merge \u2191" },
  [StructureUpdateType.mergeWithNextLine]: { level: "line", action: "next", short: "Merge \u2193" },
  [StructureUpdateType.newStrophe]: { level: "strophe", action: "new", short: "New" },
  [StructureUpdateType.mergeWithPrevStrophe]: { level: "strophe", action: "prev", short: "Merge \u2191" },
  [StructureUpdateType.mergeWithNextStrophe]: { level: "strophe", action: "next", short: "Merge \u2193" },
  [StructureUpdateType.newStanza]: { level: "stanza", action: "new", short: "New" },
  [StructureUpdateType.mergeWithPrevStanza]: { level: "stanza", action: "prev", short: "Merge prev" },
  [StructureUpdateType.mergeWithNextStanza]: { level: "stanza", action: "next", short: "Merge next" },
};

const STANZA_UPDATES = new Set([
  StructureUpdateType.newStanza,
  StructureUpdateType.mergeWithPrevStanza,
  StructureUpdateType.mergeWithNextStanza,
]);

export const StructureUpdateBtn = ({ updateType, toolTip }: { updateType: StructureUpdateType, toolTip: string }) => {

  const {
    ctxSelectedWords, ctxLanguageMode, ctxSetStructureUpdateType, ctxNumSelectedStrophes, ctxSelectedStrophes,
    ctxPassageProps, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
  } = useContext(FormatContext);

  const selection = {
    selectedWords: ctxSelectedWords,
    selectedStrophes: ctxSelectedStrophes,
    numSelectedStrophes: ctxNumSelectedStrophes,
    passage: ctxPassageProps,
  };
  const availability = structureAvailability(updateType, selection);
  const icon = STRUCTURE_ICON[updateType];
  const isHebrew = (ctxLanguageMode == LanguageMode.Hebrew);

  const handleClick = () => {
    if (!availability.enabled) return;
    if (STANZA_UPDATES.has(updateType)) {
      // Selecting a word is enough: act on the strophe(s) that hold it.
      const targets = stanzaTargets(selection);
      if (targets.fromWords) {
        ctxSetSelectedStrophes(targets.strophes);
        ctxSetNumSelectedStrophes(targets.strophes.length);
      }
    }
    ctxSetStructureUpdateType(updateType);
  };

  return (
    <ToolbarButton
      label={toolTip}
      shortLabel={icon?.short}
      availability={availability}
      onClick={handleClick}
      dataTour={`structure-${StructureUpdateType[updateType]}`}
    >
      {icon && <StructureIcon level={icon.level} action={icon.action} rtl={isHebrew} size="1.5em" />}
    </ToolbarButton>
  );
};

export const CloneStudyBtn = ({
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
    <div data-tour="notes-toggle">
      <button 
        className={`${ctxStropheNoteBtnOn ? 'bg-white': ''} py-2 px-2 rounded-[5px] bg-[#F2F2F2] border-[2px] border-[#D9D9D9] top-0 w-full h-[40px] place-content-around items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {!disabled && ctxSetStropheNoteBtnOn(!ctxStropheNoteBtnOn)}}
        disabled={disabled}
        aria-label="Strophe notes"
        aria-pressed={ctxStropheNoteBtnOn}
        title={disabled ? "Notes aren't available in the English + Hebrew view. Switch to A or \u05d0." : "Strophe notes"}
      >
      <LuNotebookPen />
      </button>
    </div>
  )
}

export const ReadmeBtn = () => {
  const { ctxReadmeBtnOn, ctxSetReadmeBtnOn } = useContext(FormatContext)
  return (
    <div className="p-2">
      <button
        className={`${ctxReadmeBtnOn ? 'bg-white': ''} py-2 px-2 rounded-[5px] bg-[#F2F2F2] border-[2px] border-[#D9D9D9] top-0 w-full h-[40px] place-content-around items-center`}
        onClick={() => {ctxSetReadmeBtnOn(!ctxReadmeBtnOn)}}
      >
        <CgEreader />
      </button>
    </div>
  );
}

export { ToolbarButton, ToolTip };
