"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowUpWideNarrow, LuArrowDownWideNarrow, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineModeEdit } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineMinusCircle, AiOutlinePlusCircle, AiOutlineClear } from "react-icons/ai";
import { TbArrowAutofitContent } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";
import { RiArrowDropDownLine } from "react-icons/ri";

import { SwatchesPicker } from 'react-color'
import React, { useContext, useEffect, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType, ColorPickerProps, InfoPaneActionType } from "@/lib/types";
import { updateColor, updateIndented } from "@/lib/actions";
import { PassageData } from "@/lib/data";

const ToolTip = ({ text }: { text: string }) => {
  return (
    <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
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
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => console.log("Redo Clicked")} >
        <LuRedo2 fontSize="1.5em" />
      </button>
      <ToolTip text="Redo" />
    </div>
  );
};

export const ZoomOutBtn = ({
  zoomLevel,
  setZoomLevel
}: {
  zoomLevel: number;
  setZoomLevel: (arg: number) => void;
}) => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => (zoomLevel >= 1) && setZoomLevel(zoomLevel - 1)} >
        <AiOutlineMinusCircle fontSize="1.5em" />
      </button>
      <ToolTip text="Zoom out" />
    </div>
  );
};

export const ZoomInBtn = ({
  zoomLevel,
  setZoomLevel
}: {
  zoomLevel: number;
  setZoomLevel: (arg: number) => void;
}) => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => (zoomLevel < 10) && setZoomLevel(zoomLevel + 1)} >
        <AiOutlinePlusCircle fontSize="1.5em" />
      </button>
      <ToolTip text="Zoom in" />
    </div>
  );
};



export const ColorFillBtn: React.FC<ColorPickerProps> = ({
  setColor,
  setColorAction
}) => {

  const { ctxStudyId, ctxColorAction, ctxNumSelectedWords, ctxSelectedWords, ctxColorFill } = useContext(FormatContext);

  //to make sure the colour picker turns off completely when user de-selects everything
  useEffect(() => {
    if (!(ctxNumSelectedWords > 0)) {
      setColorAction(ColorActionType.none);
    }
  }, [ctxNumSelectedWords, ctxColorAction])

  const handleClick = () => {
    if (ctxNumSelectedWords > 0) {
      setColorAction((ctxColorAction != ColorActionType.colorFill) ? ColorActionType.colorFill : ColorActionType.none);
    }
  }

  const handleChange = (color: any) => {
    setColor(color.hex);
    updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.colorFill, color.hex);
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        <BiSolidColorFill fillOpacity={ctxNumSelectedWords > 0 ? "1" : "0.4"} fontSize="1.4em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            {
              width: "100%",
              height: "0.25rem",
              background: `${ctxNumSelectedWords > 0 ? ctxColorFill : '#FFFFFF'}`,
              marginTop: "0.05rem",
            }
          }
        >
        </div>
      </button>

      {
        ctxColorAction === ColorActionType.colorFill && ctxNumSelectedWords > 0 && (
          <div className="relative z-10">
            <div className="absolute top-6 -left-6">
              <SwatchesPicker color={ctxColorFill} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};


export const BorderColorBtn: React.FC<ColorPickerProps> = ({
  setColor,
  setColorAction
}) => {

  const { ctxStudyId, ctxColorAction, ctxNumSelectedWords, ctxSelectedWords, ctxBorderColor } = useContext(FormatContext);

  //to make sure the colour picker turns off completely when user de-selects everything
  useEffect(() => {
    if (!(ctxNumSelectedWords > 0)) {
      setColorAction(ColorActionType.none);
    }
  }, [ctxNumSelectedWords, ctxColorAction])

  const handleClick = () => {
    if (ctxNumSelectedWords > 0) {
      setColorAction((ctxColorAction != ColorActionType.borderColor) ? ColorActionType.borderColor : ColorActionType.none);
    }
  }

  const handleChange = (color: any) => {
    setColor(color.hex);
    updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.borderColor, color.hex);
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        <MdOutlineModeEdit fillOpacity={ctxNumSelectedWords > 0 ? "1" : "0.4"} fontSize="1.4em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            {
              width: "100%",
              height: "0.25rem",
              background: `${ctxNumSelectedWords > 0 ? ctxBorderColor : '#FFFFFF'}`,
              marginTop: "0.05rem",
            }
          }
        >
        </div>
      </button>
      {
        ctxColorAction === ColorActionType.borderColor && ctxNumSelectedWords > 0 && (
          <div className="relative z-10">
            <div className="absolute top-6 -left-6">
              <SwatchesPicker color={ctxBorderColor} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};

export const TextColorBtn: React.FC<ColorPickerProps> = ({
  setColor,
  setColorAction
}) => {

  const { ctxStudyId, ctxColorAction, ctxNumSelectedWords, ctxSelectedWords, ctxTextColor } = useContext(FormatContext);

  //to make sure the colour picker turns off completely when user de-selects everything
  useEffect(() => {
    if (!(ctxNumSelectedWords > 0)) {
      setColorAction(ColorActionType.none);
    }
  }, [ctxNumSelectedWords, ctxColorAction])

  const handleClick = () => {
    if (ctxNumSelectedWords > 0) {
      setColorAction((ctxColorAction != ColorActionType.textColor) ? ColorActionType.textColor : ColorActionType.none);
    }
  }

  const handleChange = (color: any) => {
    setColor(color.hex);
    updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.textColor, color.hex);
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        <BiFont fillOpacity={ctxNumSelectedWords > 0 ? "1" : "0.4"} fontSize="1.5em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            {
              width: "100%",
              height: "0.25rem",
              background: `${ctxNumSelectedWords > 0 ? ctxTextColor : '#FFFFFF'}`,
              marginTop: "0.05rem",
            }
          }
        >
        </div>
      </button>
      {
        ctxColorAction === ColorActionType.textColor && ctxNumSelectedWords > 0 && (
          <div className="relative z-10">
            <div className="absolute top-6 -left-6">
              <SwatchesPicker color={ctxTextColor} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};

export const ClearFormatBtn = ({ resetColorFill, resetBorderColor, resetTextColor, setColorAction }: {
  resetColorFill: (arg: string) => void;
  resetBorderColor: (arg: string) => void;
  resetTextColor: (arg: string) => void;
  setColorAction: (arg: number) => void,
}) => {

  const { ctxStudyId, ctxNumSelectedWords, ctxSelectedWords } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxNumSelectedWords > 0) {
      setColorAction(ColorActionType.resetColor);
      resetColorFill(DEFAULT_COLOR_FILL);
      resetBorderColor(DEFAULT_BORDER_COLOR);
      resetTextColor(DEFAULT_TEXT_COLOR);
      updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.resetColor, null);
    }
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        <AiOutlineClear fillOpacity={ctxNumSelectedWords > 0 ? "1" : "0.4"} fontSize="1.4em" />
      </button>
      <ToolTip text="Clear format" />
    </div>
  );
};

export const UniformWidthBtn = ({ setUniformWidth }: {
  setUniformWidth: (arg: boolean) => void,
}) => {
  const { ctxUniformWidth } = useContext(FormatContext);

  const handleClick = () => {
    setUniformWidth(!ctxUniformWidth);
  }
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        <TbArrowAutofitContent fontSize="1.5em" />
      </button>
      {
        ctxUniformWidth ? (<ToolTip text="Disable uniform width" />) : (<ToolTip text="Enable uniform width" />)
      }
    </div>
  );
};

export const LeftIndentBtn = () => {

  const { ctxStudyId, ctxIsHebrew, ctxUniformWidth, ctxSelectedWords, ctxIndentWord, ctxSetIndentWord, ctxNumSelectedWords, ctxContent } = useContext(FormatContext);
  const [buttonCondition, setButtonCondition] = useState(ctxUniformWidth && (ctxNumSelectedWords === 1));
  useEffect(() => {
    setButtonCondition(ctxUniformWidth && (ctxNumSelectedWords === 1));
  }, [ctxUniformWidth, ctxNumSelectedWords]);

  const handleClick = () => {
    let numIndent = getNumIndentById(ctxContent.chapters, ctxSelectedWords[0]);
    if (ctxUniformWidth && ctxSelectedWords.length == 1) {
      if (ctxIsHebrew) {
        ctxSetIndentWord(ctxIndentWord.filter(num => !ctxSelectedWords.includes(num)));
        if (numIndent > 0) {
          updateIndented(ctxStudyId, ctxSelectedWords, numIndent - 1);
          setNumIndentById(ctxContent.chapters, ctxSelectedWords[0], numIndent - 1);
        }
      }
      else {
        ctxSetIndentWord(Array.from(new Set(ctxIndentWord.concat(ctxSelectedWords))));
        if (numIndent < 3) {
          updateIndented(ctxStudyId, ctxSelectedWords, numIndent + 1);
          setNumIndentById(ctxContent.chapters, ctxSelectedWords[0], numIndent + 1);
        }
      }
      let newButtonCondition = ctxUniformWidth && (ctxSelectedWords.length === 1);
      setButtonCondition(newButtonCondition);
    }
  }
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonCondition ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <CgFormatIndentIncrease fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.5em" />
      </button>
      <ToolTip text={ctxIsHebrew ? "Remove Ident" : "Add indent"} />
    </div>
  );
};

export const RightIndentBtn = () => {
  const { ctxStudyId, ctxIsHebrew, ctxUniformWidth, ctxSelectedWords, ctxIndentWord, ctxSetIndentWord, ctxNumSelectedWords, ctxContent } = useContext(FormatContext);
  const [buttonCondition, setButtonCondition] = useState(ctxUniformWidth && (ctxNumSelectedWords === 1));
  useEffect(() => {
    setButtonCondition(ctxUniformWidth && (ctxNumSelectedWords === 1));
  }, [ctxUniformWidth, ctxNumSelectedWords]);

  const handleClick = () => {
    let numIndent = getNumIndentById(ctxContent.chapters, ctxSelectedWords[0]);
    if (ctxIsHebrew) {
      ctxSetIndentWord(Array.from(new Set(ctxIndentWord.concat(ctxSelectedWords))));
      if (numIndent < 3) {
        updateIndented(ctxStudyId, ctxSelectedWords, numIndent + 1);
        setNumIndentById(ctxContent.chapters, ctxSelectedWords[0], numIndent + 1);
      }
    }
    else {
      ctxSetIndentWord(ctxIndentWord.filter(num => !ctxSelectedWords.includes(num)));
      if (numIndent > 0) {
        updateIndented(ctxStudyId, ctxSelectedWords, numIndent - 1);
        setNumIndentById(ctxContent.chapters, ctxSelectedWords[0], numIndent - 1);
      }
    }
  }
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonCondition ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <CgFormatIndentDecrease fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.5em" />
      </button>
      <ToolTip text={ctxIsHebrew ? "Add Ident" : "Remove indent"} />
    </div>
  );
};

function getNumIndentById(chapters: any[], id: number) {
  for (let chapter of chapters) {
    for (let verse of chapter.verses) {
      for (let paragraph of verse.paragraphs) {
        for (let word of paragraph.words) {
          if (word.id === id) {
            return word.numIndent == undefined ? 0 : word.numIndent;
          }
        }
      }
    }
  }
  return null; // If ID not found
}

function setNumIndentById(chapters: any[], id: number, numIndent: number) {
  for (let chapter of chapters) {
    for (let verse of chapter.verses) {
      for (let paragraph of verse.paragraphs) {
        for (let word of paragraph.words) {
          if (word.id === id) {
            word.numIndent = numIndent;
          }
        }
      }
    }
  }
}

export const NewStropheBtn = () => {
  const { ctxNumSelectedWords, ctxNewStropheEvent, ctxSetNewStropheEvent} = useContext(FormatContext);

  const [visibleOptions, setVisibleOptions] = useState(false);

  const enabledButton = ()=>{
    if(ctxNumSelectedWords===1){
      return true;
    }
    else{
      return false;
    }
  }

  const buttonEnabled = enabledButton();

  const handleClick = () => {
    if(buttonEnabled){
      ctxSetNewStropheEvent(true);
      return;
    }
    else{
      return;
    }
  }

  return (
    <>
    <div className="relative">
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
        <CgArrowsBreakeV opacity={(buttonEnabled)?`1`:`0.4`} fontSize="1.5em" />
        <ToolTip text="New strophe" />
      </button>
    </div>
    </div>
    </>
  );
};

export const MergeStropheBtnUp = () => {
  const { ctxNumSelectedWords, ctxSetMergeStropheEvent, ctxStructuredWords, ctxCurrentStrophe } = useContext(FormatContext);

  const enabledButton = ( ctxNumSelectedWords===1 && ctxStructuredWords.length > 1 && ctxCurrentStrophe > 1 )

  const handleClick = () => ( enabledButton && ctxSetMergeStropheEvent("up"))

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick}>
        <LuArrowUpWideNarrow opacity={(enabledButton)?`1`:`0.4`} fontSize="1.5em" />
      </button>
      <ToolTip text="Merge strophe above" />
    </div>
  )
}
export const MergeStropheBtnDown = () => {
  const { ctxNumSelectedWords, ctxSetMergeStropheEvent, ctxStructuredWords, ctxCurrentStrophe } = useContext(FormatContext);

  const enabledButton = ( ctxNumSelectedWords===1 && ctxStructuredWords.length > 1 && ctxCurrentStrophe < ctxStructuredWords.length )

  const handleClick = () => ( enabledButton && ctxSetMergeStropheEvent("down"))

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick}>
        <LuArrowDownWideNarrow opacity={(enabledButton)?`1`:`0.4`} fontSize="1.5em" />
      </button>
      <ToolTip text="Merge to strophe below" />
    </div>
  )
}

export const NewStanzaBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => console.log("New Stanza Clicked")} >
        <CgArrowsBreakeH opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="New stanza" />
    </div>
  );
};

export const MoveUpBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => console.log("Move Up Clicked")} >
        <LuArrowUpToLine opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="Move up" />
    </div>
  );
};

export const MoveDownBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={() => console.log("Move Down Clicked")} >
        <LuArrowDownToLine opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="Move down" />
    </div>
  );
};

export const StructureBtn = ({
  setInfoPaneAction,
  infoPaneAction,
}: {
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {

  const handleClick = () =>{
    if (infoPaneAction != InfoPaneActionType.structure) {
      setInfoPaneAction(InfoPaneActionType.structure);
    } else {
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={handleClick} >
        Structure
      </button>
      <ToolTip text="Structure" />
    </div>
  );
};
export const MotifBtn = ({
  setInfoPaneAction,
  infoPaneAction,
}: {
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {
  const handleClick = () =>{
    if(infoPaneAction != InfoPaneActionType.motif){
      setInfoPaneAction(InfoPaneActionType.motif);
    }else{
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={handleClick} >
        Motif
      </button>
      <ToolTip text="Motif" />
    </div>
  );
};
export const SyntaxBtn = ({
  setInfoPaneAction,
  infoPaneAction,
}: {
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {
  const handleClick = () =>{
    if(infoPaneAction != InfoPaneActionType.syntax){
      setInfoPaneAction(InfoPaneActionType.syntax);
    }else{
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={handleClick} >
        Syntax
      </button>
      <ToolTip text="Syntax" />
    </div>
  );
};
export const SoundsBtn = ({
  setInfoPaneAction,
  infoPaneAction,
}: {
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {
  const handleClick = () =>{
    if(infoPaneAction != InfoPaneActionType.sounds){
      setInfoPaneAction(InfoPaneActionType.sounds);
    }else{
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={handleClick} >
        Sounds
      </button>
      <ToolTip text="Sounds" />
    </div>
  );
};

