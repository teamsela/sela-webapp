"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowUpNarrowWide, LuArrowDownWideNarrow } from "react-icons/lu";
import { MdOutlineModeEdit, MdOutlinePlaylistAdd } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineClear } from "react-icons/ai";
import { VscClearAll } from "react-icons/vsc";
import { TbArrowAutofitContent, TbArrowAutofitContentFilled } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";

import { SwatchesPicker } from 'react-color'
import React, { useContext, useEffect, useCallback, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { BoxDisplayStyle, ColorActionType, ColorPickerProps, InfoPaneActionType, StructureUpdateType } from "@/lib/types";
import { updateMetadata } from "@/lib/actions";

export const ToolTip = ({ text }: { text: string }) => {
  return (
    <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
      {text}
    </div>
  )
}

export const UndoBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => console.log("Undo Clicked")} >
        <LuUndo2 fontSize="1.5em" />
      </button>
      <ToolTip text="Undo" />
    </div>
  );
};

export const RedoBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 px-4 dark:border-strokedark xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => console.log("Redo Clicked")} >
        <LuRedo2 fontSize="1.5em" />
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
    ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes
  } = useContext(FormatContext);

  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [displayColor, setDisplayColor] = useState("");

  const refreshDisplayColor = useCallback(() => {
    (colorAction === ColorActionType.colorFill) && setDisplayColor(ctxColorFill);
    (colorAction === ColorActionType.borderColor) && setDisplayColor(ctxBorderColor);
    (colorAction === ColorActionType.textColor) && setDisplayColor(ctxTextColor);
  }, [colorAction, ctxColorFill, ctxBorderColor, ctxTextColor]);

  useEffect(() => {
    const hasSelectedItems = (ctxNumSelectedWords > 0 || (ctxNumSelectedStrophes > 0 && colorAction != ColorActionType.textColor));
    setButtonEnabled(hasSelectedItems);
    ctxSelectedWords
    // make sure the colour picker turns off completely when user de-selects everything
    if (!hasSelectedItems) {
      setColorAction(ColorActionType.none);
      setSelectedColor("");
    }
    else {
      refreshDisplayColor();
    }
  }, [ctxNumSelectedWords, ctxNumSelectedStrophes, refreshDisplayColor, setColorAction, setSelectedColor, colorAction])

  useEffect(() => {
    if (ctxColorAction === ColorActionType.resetColor) {
      refreshDisplayColor();
    }
  }, [ctxColorAction, refreshDisplayColor])

  const handleClick = () => {
    setColorAction(ColorActionType.none);
    if (buttonEnabled) {
      setColorAction((ctxColorAction != colorAction) ? colorAction : ColorActionType.none);
      setSelectedColor("");
    }
  }

  const handleChange = (color: any) => {
    //console.log("Changing " + colorActionType + " color to " + color.hex);
    setSelectedColor(color.hex);
    setDisplayColor(color.hex);
    let colorObj = {};
    switch (colorAction) {
      case (ColorActionType.colorFill): { colorObj = { fill: color.hex }; break; }
      case (ColorActionType.borderColor): { colorObj = { border: color.hex }; break; }
      case (ColorActionType.textColor): { colorObj = { text: color.hex }; break; }
    }

    if (ctxSelectedWords.length > 0) {
      ctxSelectedWords.map((word) => {
        const wordMetadata = ctxStudyMetadata.words[word.wordId];
        if (wordMetadata) {
          if (wordMetadata?.color) {
            if (colorAction === ColorActionType.colorFill) {
              wordMetadata.color.fill = color.hex;
            }
            else if (colorAction === ColorActionType.borderColor) {
              wordMetadata.color.border = color.hex;
            }
            else if (colorAction === ColorActionType.textColor) {
              wordMetadata.color.text = color.hex;
            }
          }
          else {
            wordMetadata.color = colorObj;
          }
        }
        else {
          ctxStudyMetadata.words[word.wordId] = { color: colorObj };
        }
      })
      updateMetadata(ctxStudyId, ctxStudyMetadata);
    }

    if (ctxSelectedStrophes.length > 0) {

      // find the index to the first word of the strophe
      const selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;

      const wordMetadata = ctxStudyMetadata.words[selectedWordId];
      wordMetadata.stropheMd ??= {};
      wordMetadata.stropheMd.color ??= colorObj;

      if (colorAction === ColorActionType.colorFill) {
        wordMetadata.stropheMd.color.fill = color.hex;
      } else if (colorAction === ColorActionType.borderColor) {
        wordMetadata.stropheMd.color.border = color.hex;
      }

      updateMetadata(ctxStudyId, ctxStudyMetadata);
    }
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
              <SwatchesPicker className={`colorPicker`} width={550} height={300} color={displayColor} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};


export const ClearFormatBtn = ({ setColorAction }: { setColorAction: (arg: number) => void }) => {

  const { ctxStudyId, ctxStudyMetadata,
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
      if (ctxSelectedWords.length > 0) {
        ctxSetTextColor(DEFAULT_TEXT_COLOR);
        ctxSelectedWords.map((word) => {
          const wordMetadata = ctxStudyMetadata.words[word.wordId];
          if (wordMetadata && wordMetadata?.color) {
            delete wordMetadata["color"];
          }
        })
        updateMetadata(ctxStudyId, ctxStudyMetadata);
      }
      if (ctxSelectedStrophes.length > 0) {
        const selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
        (ctxStudyMetadata.words[selectedWordId].color) && (delete ctxStudyMetadata.words[selectedWordId].color);
        updateMetadata(ctxStudyId, ctxStudyMetadata);
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

export const UniformWidthBtn = ({ setBoxStyle }: {
  setBoxStyle: (arg: BoxDisplayStyle) => void,
}) => {
  const { ctxBoxDisplayStyle, ctxInViewMode, ctxStudyId, ctxStudyMetadata, ctxSetStudyMetadata } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxBoxDisplayStyle === BoxDisplayStyle.box) {
      ctxStudyMetadata.boxStyle = BoxDisplayStyle.uniformBoxes;
      setBoxStyle(BoxDisplayStyle.uniformBoxes);
    } else if (ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) {
      ctxStudyMetadata.boxStyle = BoxDisplayStyle.box;
      setBoxStyle(BoxDisplayStyle.box);
    }
    ctxSetStudyMetadata(ctxStudyMetadata);
    (!ctxInViewMode) && updateMetadata(ctxStudyId, ctxStudyMetadata);
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

  const { ctxStudyId, ctxIsHebrew, ctxStudyMetadata, ctxSetStudyMetadata, ctxBoxDisplayStyle, ctxIndentNum, ctxSetIndentNum,
    ctxSelectedWords, ctxNumSelectedWords } = useContext(FormatContext);
  const [buttonEnabled, setButtonEnabled] = useState(ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes && (ctxNumSelectedWords === 1));

  useEffect(() => {
    let indentNum: number = 0;
    if (ctxSelectedWords.length === 1) {
      const wordMetadata = ctxStudyMetadata.words[ctxSelectedWords[0].wordId];
      indentNum = (wordMetadata) ? (wordMetadata?.indent || 0) : 0;
      ctxSetIndentNum(indentNum);
    }
    let validIndent = (!leftIndent) ? ctxIndentNum > 0 : ctxIndentNum < 3;
    setButtonEnabled((ctxBoxDisplayStyle === BoxDisplayStyle.uniformBoxes) && (ctxNumSelectedWords === 1) && validIndent);
  }, [ctxBoxDisplayStyle, ctxNumSelectedWords, ctxSelectedWords, ctxIndentNum, ctxIsHebrew, ctxSetIndentNum, leftIndent]);

  const handleClick = () => {
    if (ctxBoxDisplayStyle !== BoxDisplayStyle.uniformBoxes || ctxSelectedWords.length === 0)
      return;

    const selectedWordId = ctxSelectedWords[0].wordId;
    const wordMetadata = ctxStudyMetadata.words[selectedWordId];
    let indentNum: number = (wordMetadata) ? (wordMetadata?.indent || 0) : 0;
    if (!leftIndent) {
      if (indentNum > 0) {
        ctxStudyMetadata.words[selectedWordId] = {
          ...ctxStudyMetadata.words[selectedWordId],
          indent: --indentNum,
        };
        (indentNum == 0) && (delete ctxStudyMetadata.words[selectedWordId].indent);
        updateMetadata(ctxStudyId, ctxStudyMetadata);
        ctxSetStudyMetadata(ctxStudyMetadata);
        setButtonEnabled(indentNum > 0);
        ctxSetIndentNum(indentNum);
      }
    }
    else {
      if (indentNum < 3) {
        ctxStudyMetadata.words[selectedWordId] = {
          ...ctxStudyMetadata.words[selectedWordId],
          indent: ++indentNum,
        };
        updateMetadata(ctxStudyId, ctxStudyMetadata);
        ctxSetStudyMetadata(ctxStudyMetadata);
        setButtonEnabled(indentNum < 3);
        ctxSetIndentNum(indentNum)
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
  let hasWordSelected = (ctxSelectedWords.length === 1);
  let hasStropheSelected = (ctxSelectedStrophes.length === 1);
  let hasStrophesSelected = (ctxNumSelectedStrophes === 1) && (ctxPassageProps.stropheCount > 1) && (ctxSelectedStrophes[0] !== undefined);

  if (updateType === StructureUpdateType.newLine) {
    buttonEnabled = hasWordSelected && !ctxSelectedWords[0].newLine && !ctxSelectedWords[0].metadata?.lineBreak && !ctxSelectedWords[0].firstWordInStrophe;
  } else if (updateType === StructureUpdateType.mergeWithPrevLine) {
    buttonEnabled = hasWordSelected && (ctxSelectedWords[0].lineId !== 0);
  } else if (updateType === StructureUpdateType.mergeWithNextLine) {
    buttonEnabled = hasWordSelected &&
      ctxPassageProps.stanzaProps[ctxSelectedWords[0].stanzaId]
        .strophes[ctxSelectedWords[0].stropheId].lines.length - 1 !== ctxSelectedWords[0].lineId;
  } else if (updateType === StructureUpdateType.newStrophe) {
    buttonEnabled = hasWordSelected && (!ctxSelectedWords[0].firstWordInStrophe);
  } else if (updateType === StructureUpdateType.mergeWithPrevStrophe) {
    buttonEnabled = (hasWordSelected && (!ctxSelectedWords[0].firstStropheInStanza) || (hasStropheSelected && !ctxSelectedStrophes[0].firstStropheInStanza));
  } else if (updateType === StructureUpdateType.mergeWithNextStrophe) {
    buttonEnabled = (hasWordSelected && (!ctxSelectedWords[0].lastStropheInStanza) || (hasStropheSelected && !ctxSelectedStrophes[0].lastStropheInStanza));
  } else if (updateType === StructureUpdateType.newStanza) {
    buttonEnabled = hasStrophesSelected && (!ctxSelectedStrophes[0].firstStropheInStanza);
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

export const ClearAllFormatBtn = ({ setColorAction }: { setColorAction: (arg: number) => void }) => {

  const { ctxStudyId, ctxStudyMetadata,
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor
  } = useContext(FormatContext);

  const handleClick = () => {
    setColorAction(ColorActionType.resetAllColor);
    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    ctxSetTextColor(DEFAULT_TEXT_COLOR);
    Object.values(ctxStudyMetadata.words).forEach((wordMetadata) => {
      if (wordMetadata && wordMetadata?.color) {
        delete wordMetadata["color"];
      }
      if (wordMetadata && wordMetadata?.stropheMd && wordMetadata.stropheMd.color) {
        delete wordMetadata.stropheMd.color;
      }
    })
    updateMetadata(ctxStudyId, ctxStudyMetadata);
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary`}
        onClick={handleClick} >
        <VscClearAll className="ClickBlock" fillOpacity="1" fontSize="1.4em" />
      </button>
      <ToolTip text="Clear All Format" />
    </div>
  );
};


