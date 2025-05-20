"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowUpNarrowWide, LuArrowDownWideNarrow } from "react-icons/lu";
import { MdOutlineModeEdit, MdOutlinePlaylistAdd } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineClear } from "react-icons/ai";
import { VscClearAll } from "react-icons/vsc";
import { TbArrowAutofitContent, TbArrowAutofitContentFilled } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";

import { SwatchesPicker } from 'react-color';
import React, { useContext, useEffect, useCallback, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { BoxDisplayStyle, ColorActionType, ColorPickerProps, InfoPaneActionType, StructureUpdateType } from "@/lib/types";
import { updateMetadataInDb } from "@/lib/actions";

import { StudyMetadata } from '@/lib/data';

export const ToolTip = ({ text }: { text: string }) => {
  return (
    <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
      {text}
    </div>
  )
}

export const UndoBtn = () => {
  const { ctxStudyId, ctxSetStudyMetadata, ctxHistory, ctxPointer, ctxSetPointer } = useContext(FormatContext);

  const buttonEnabled = (ctxPointer !== 0);

  const handleClick = () => {
    if (buttonEnabled) {
      const newPointer = ctxPointer - 1;
      ctxSetPointer(newPointer);
      ctxSetStudyMetadata(structuredClone(ctxHistory[newPointer]));
      updateMetadataInDb(ctxStudyId, ctxHistory[newPointer]);  
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
  const { ctxStudyId, ctxSetStudyMetadata, ctxHistory, ctxPointer, ctxSetPointer } = useContext(FormatContext);

  const buttonEnabled = (ctxPointer !== ctxHistory.length - 1);

  const handleClick = () => {
    if (buttonEnabled) {
      const newPointer = ctxPointer + 1;
      ctxSetPointer(newPointer);
      ctxSetStudyMetadata(structuredClone(ctxHistory[newPointer]));
      updateMetadataInDb(ctxStudyId, ctxHistory[newPointer]);  
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
    ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes, ctxAddToHistory
  } = useContext(FormatContext);

  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [displayColor, setDisplayColor] = useState("");
  const [stagedMetadata, setStagedMetadata] = useState<StudyMetadata | undefined>(undefined);

  const refreshDisplayColor = useCallback(() => {
    (colorAction === ColorActionType.colorFill) && setDisplayColor(ctxColorFill);
    (colorAction === ColorActionType.borderColor) && setDisplayColor(ctxBorderColor);
    (colorAction === ColorActionType.textColor) && setDisplayColor(ctxTextColor);
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
    let colorObj = {};
    switch (colorAction) {
      case (ColorActionType.colorFill): { colorObj = { fill: color.hex }; break; }
      case (ColorActionType.borderColor): { colorObj = { border: color.hex }; break; }
      case (ColorActionType.textColor): { colorObj = { text: color.hex }; break; }
    }

    let isChanged = false;

    ctxSelectedWords.forEach((word) => {
      const wordId = word.wordId;
      const wordMetadata = ctxStudyMetadata.words[wordId];
    
      if (!wordMetadata) {
        isChanged = true;
        ctxStudyMetadata.words[wordId] = { color: colorObj };
        return;
      }
    
      if (!wordMetadata.color) {
        isChanged = (wordMetadata.color !== colorObj);
        wordMetadata.color = colorObj;
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
        wordMetadata.stropheMd.color ??= colorObj;
        isChanged = true;
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
              <SwatchesPicker width={580} height={160} color={displayColor} onChange={handleColorPickerChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};

export const ClearFormatBtn = ({ setColorAction }: { setColorAction: (arg: number) => void }) => {

  const { ctxStudyId, ctxStudyMetadata, ctxAddToHistory,
    ctxNumSelectedWords, ctxSelectedWords, 
    ctxNumSelectedStrophes, ctxSelectedStrophes,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor
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
        ctxAddToHistory(ctxStudyMetadata);
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      }
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
    ctxAddToHistory, ctxSetRootsColorMap
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

    let isChanged = false;

    Object.values(ctxStudyMetadata.words).forEach((wordMetadata) => {
      if (wordMetadata && wordMetadata?.color) {
        isChanged = true;
        delete wordMetadata["color"];
      }
      if (wordMetadata && wordMetadata?.stropheMd && wordMetadata.stropheMd.color) {
        isChanged = true;
        delete wordMetadata.stropheMd.color;
      }
    });

    if (isChanged) {
      ctxSetRootsColorMap(new Map());
      ctxAddToHistory(ctxStudyMetadata);
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      setButtonEnabled(false);
    }
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
  setBoxStyle: (arg: BoxDisplayStyle) => void,
}) => {
  const { ctxBoxDisplayStyle, ctxInViewMode, ctxStudyId, ctxStudyMetadata, ctxSetStudyMetadata, ctxAddToHistory } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxBoxDisplayStyle === BoxDisplayStyle.box) {
      ctxStudyMetadata.boxStyle = BoxDisplayStyle.uniformBoxes;
      setBoxStyle(BoxDisplayStyle.uniformBoxes);
    } else if (ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) {
      ctxStudyMetadata.boxStyle = BoxDisplayStyle.box;
      setBoxStyle(BoxDisplayStyle.box);
    }
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
          (ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) && <TbArrowAutofitContentFilled fontSize="1.5em" />
        }
        {
          (ctxBoxDisplayStyle === BoxDisplayStyle.box) && <TbArrowAutofitContent fontSize="1.5em" />
        }
      </button>
      {
        (ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) && <ToolTip text="Disable uniform width" />
      }
      {
        (ctxBoxDisplayStyle === BoxDisplayStyle.box) && <ToolTip text="Enable uniform width" />
      }      
    </div>
  );
};

export const IndentBtn = ({ leftIndent }: { leftIndent: boolean }) => {

  const { ctxStudyId, ctxIsHebrew, ctxStudyMetadata, ctxBoxDisplayStyle, ctxIndentNum, ctxSetIndentNum, 
    ctxSelectedWords, ctxNumSelectedWords, ctxAddToHistory } = useContext(FormatContext);
  const [buttonEnabled, setButtonEnabled] = useState(ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes && (ctxNumSelectedWords === 1));

  useEffect(() => {
    let indentNum : number = 0;
    if (ctxSelectedWords.length === 1) {
      const wordMetadata = ctxStudyMetadata.words[ctxSelectedWords[0].wordId];
      indentNum = (wordMetadata) ? (wordMetadata?.indent || 0) : 0;
      ctxSetIndentNum(indentNum);
    }
    let validIndent = (!leftIndent) ? ctxIndentNum > 0 : ctxIndentNum < 3;
    setButtonEnabled((ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) && (ctxNumSelectedWords === 1) && validIndent);
  }, [ctxBoxDisplayStyle, ctxNumSelectedWords, ctxSelectedWords, ctxStudyMetadata, ctxIndentNum, ctxIsHebrew, ctxSetIndentNum, leftIndent]);

  const handleClick = () => {
    if (ctxBoxDisplayStyle !== BoxDisplayStyle.uniformBoxes || ctxSelectedWords.length === 0)
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
          (!ctxIsHebrew && leftIndent) || (ctxIsHebrew && !leftIndent) ?
            <CgFormatIndentIncrease fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" /> :
            <CgFormatIndentDecrease fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" />
        }
      </button>
      <ToolTip text={(leftIndent) ? "Add indent" : "Remove indent"} />
    </div>
  );
};

export const StructureUpdateBtn = ({ updateType, toolTip }: { updateType: StructureUpdateType, toolTip: string }) => {

  const { ctxIsHebrew, ctxSelectedWords, ctxSetStructureUpdateType, ctxNumSelectedStrophes, ctxSelectedStrophes, ctxPassageProps } = useContext(FormatContext);

  let buttonEnabled = false;
  let hasContiguousWords = false;
  let hasWordSelected = (ctxSelectedWords.length === 1);
  let hasStropheSelected = (ctxSelectedStrophes.length === 1);
  let hasStrophesSelected = (ctxNumSelectedStrophes >= 1) && (ctxPassageProps.stropheCount > 1) && (ctxSelectedStrophes[0] !== undefined);
  let highestSelectedStrophe = ctxSelectedStrophes[0];

  if (ctxSelectedWords.length > 1) {
    const sortedWords = [...ctxSelectedWords].sort((a, b) => a.wordId - b.wordId);
    hasContiguousWords = sortedWords.every((word, idx) =>
      idx === 0 || sortedWords[idx - 1].wordId + 1 === word.wordId
    );
  }
  if (ctxSelectedStrophes.length > 1) {
    highestSelectedStrophe = ctxSelectedStrophes.reduce((prev, curr) =>
      (curr.stropheId < prev.stropheId ? curr : prev), ctxSelectedStrophes[0]);
  }

  const sameStrophe = ctxSelectedWords.length > 0 && ctxSelectedWords.every(w => w.stropheId === ctxSelectedWords[0].stropheId);

  if (updateType === StructureUpdateType.newLine) {
    buttonEnabled = (hasWordSelected || hasContiguousWords) && !ctxSelectedWords[0].newLine && !ctxSelectedWords[0].metadata?.lineBreak && !ctxSelectedWords[0].firstWordInStrophe;
  } else if (updateType === StructureUpdateType.mergeWithPrevLine) {
    buttonEnabled = (hasWordSelected || hasContiguousWords) && (ctxSelectedWords[0].lineId !== 0);
  } else if (updateType === StructureUpdateType.mergeWithNextLine) {
    buttonEnabled = (hasWordSelected || hasContiguousWords) &&
      ctxPassageProps.stanzaProps[ctxSelectedWords[0].stanzaId]
        .strophes[ctxSelectedWords[0].stropheId]?.lines?.length - 1 !== ctxSelectedWords[0].lineId;
  } else if (updateType === StructureUpdateType.newStrophe) {
    buttonEnabled = (hasWordSelected || (hasContiguousWords && sameStrophe)) && (!ctxSelectedWords[0].firstWordInStrophe);
  } else if (updateType === StructureUpdateType.mergeWithPrevStrophe) {
    buttonEnabled = (hasWordSelected && (!ctxSelectedWords[0].firstStropheInStanza) || (hasStrophesSelected && !highestSelectedStrophe.firstStropheInStanza));
  } else if (updateType === StructureUpdateType.mergeWithNextStrophe) {
    buttonEnabled = (hasWordSelected && (!ctxSelectedWords[0].lastStropheInStanza) || (hasStrophesSelected && !highestSelectedStrophe.lastStropheInStanza));
  } else if (updateType === StructureUpdateType.newStanza) {
    buttonEnabled = hasStrophesSelected && (!highestSelectedStrophe.firstStropheInStanza);
  } else if (updateType === StructureUpdateType.mergeWithPrevStanza) {
    buttonEnabled = hasStrophesSelected && (ctxSelectedStrophes[0].lines[0].words[0].stanzaId !== undefined && ctxSelectedStrophes[0].lines[0].words[0].stanzaId > 0)
  } else if (updateType === StructureUpdateType.mergeWithNextStanza) {
    buttonEnabled = hasStrophesSelected && (ctxSelectedStrophes[0].lines[0].words[0].stanzaId !== undefined && ctxSelectedStrophes[0].lines[0].words[0].stanzaId < ctxPassageProps.stanzaCount - 1)
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
          ((updateType == StructureUpdateType.mergeWithPrevStanza && !ctxIsHebrew) || updateType == StructureUpdateType.mergeWithNextStanza && ctxIsHebrew) && <LuArrowDownWideNarrow style={{ transform: 'rotate(90deg)' }} opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
        }
        {
          ((updateType == StructureUpdateType.mergeWithNextStanza && !ctxIsHebrew) || updateType == StructureUpdateType.mergeWithPrevStanza && ctxIsHebrew) && <LuArrowUpNarrowWide style={{ transform: 'rotate(90deg)' }} opacity={(buttonEnabled) ? `1` : `0.4`} fontSize="1.5em" />
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
