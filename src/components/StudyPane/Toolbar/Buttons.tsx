"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowUpWideNarrow, LuArrowDownWideNarrow, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineModeEdit } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineMinusCircle, AiOutlinePlusCircle, AiOutlineClear } from "react-icons/ai";
import { TbArrowAutofitContent } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";

import { SwatchesPicker } from 'react-color'
import React, { useContext, useEffect, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType, ColorPickerProps, InfoPaneActionType } from "@/lib/types";
import { updateWordColor, updateIndented, updateStropheColor } from "@/lib/actions";

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

export const ColorActionBtn: React.FC<ColorPickerProps> = ({
  colorActionType,
  setSelectedColor,
  setColorAction
}) => {
  const { ctxStudyId, ctxColorAction, ctxColorFill, ctxBorderColor, ctxTextColor,
    ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes 
  } = useContext(FormatContext);

  const [buttonCondition, setButtonCondition] = useState(false);
  const [displayColor, setDisplayColor] = useState("");

  useEffect(() => {
    const hasSelectedItems = (ctxNumSelectedWords > 0 || ctxSelectedStrophes.length > 0);
    setButtonCondition(hasSelectedItems);

    // make sure the colour picker turns off completely when user de-selects everything
    if (!hasSelectedItems) {
      setColorAction(ColorActionType.none);
      setSelectedColor("");
    }
    else {
      (colorActionType === ColorActionType.colorFill) && setDisplayColor(ctxColorFill);
      (colorActionType === ColorActionType.borderColor) && setDisplayColor(ctxBorderColor);
      (colorActionType === ColorActionType.textColor) && setDisplayColor(ctxTextColor);
    }
  }, [ctxNumSelectedWords, ctxSelectedStrophes])

  const handleClick = () => {
    if (buttonCondition) {
      setColorAction((ctxColorAction != colorActionType) ? colorActionType : ColorActionType.none);
      setSelectedColor("");
    }
  }

  const handleChange = (color: any) => {
    //console.log("Changing " + colorActionType + " color to " + color.hex);
    setSelectedColor(color.hex);
    setDisplayColor(color.hex);
    if (ctxSelectedWords.length > 0) {
      updateWordColor(ctxStudyId, ctxSelectedWords, colorActionType, color.hex);
    }
    if (ctxNumSelectedStrophes > 0) {
      updateStropheColor(ctxStudyId, ctxSelectedStrophes, colorActionType, color.hex);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonCondition ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
          {
            (colorActionType === ColorActionType.colorFill) && <BiSolidColorFill fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.4em" />
          }
          {
            (colorActionType === ColorActionType.borderColor) && <MdOutlineModeEdit fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.4em" />
          }
          {
            (colorActionType === ColorActionType.textColor) && <BiFont fillOpacity={buttonCondition? "1" : "0.4"} fontSize="1.5em" />
          }
        <div
          // TODO: using embbed style for the color display for now, may move to tailwind after some research
          style={
            {
              width: "100%",
              height: "0.25rem",
              background: `${buttonCondition ? displayColor : '#FFFFFF'}`,
              marginTop: "0.05rem",
            }
          }
        >
        </div>
      </button>

      {
        ctxColorAction === colorActionType && buttonCondition && (
          <div className="relative z-10">
            <div className="absolute top-6 -left-6">
              <SwatchesPicker color={displayColor} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};


export const ClearFormatBtn = ({ setColorAction } : { setColorAction : (arg: number) => void }) => {

  const { ctxStudyId, ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes, 
    ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor
  } = useContext(FormatContext);

  const [buttonCondition, setButtonCondition] = useState(false);

  useEffect(() => {
    const hasSelectedItems = (ctxNumSelectedWords > 0 || ctxSelectedStrophes.length > 0);
    setButtonCondition(hasSelectedItems);

    // make sure the colour picker turns off completely when user de-selects everything
    if (!hasSelectedItems) {
      setColorAction(ColorActionType.none);
    }
  }, [ctxNumSelectedWords, ctxSelectedStrophes])

  const handleClick = () => {
    if (buttonCondition) {
      setColorAction(ColorActionType.resetColor);
      ctxSetColorFill(DEFAULT_COLOR_FILL);
      ctxSetBorderColor(DEFAULT_BORDER_COLOR);
      ctxSetTextColor(DEFAULT_TEXT_COLOR);
      updateWordColor(ctxStudyId, ctxSelectedWords, ColorActionType.resetColor, null);
    }
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonCondition ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <AiOutlineClear fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.4em" />
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

export const IndentBtn = ({ leftIndent } : { leftIndent : boolean }) => {

  const { ctxStudyId, ctxIsHebrew, ctxUniformWidth, ctxSelectedHebWords, ctxSelectedWords, ctxIndentNum, ctxSetIndentNum, ctxNumSelectedWords } = useContext(FormatContext);
  const [buttonCondition, setButtonCondition] = useState(ctxUniformWidth && (ctxNumSelectedWords === 1));

  if (ctxIsHebrew) {
    leftIndent = !leftIndent;
  }

  useEffect(() => {
    ctxSetIndentNum((ctxSelectedHebWords.length === 1) ? ctxSelectedHebWords[0].numIndent : 0);
    let validIndent = (!leftIndent) ? ctxIndentNum > 0 : ctxIndentNum < 3;
    setButtonCondition(ctxUniformWidth && (ctxNumSelectedWords === 1) && validIndent);
  }, [ctxUniformWidth, ctxNumSelectedWords, ctxSelectedHebWords, ctxIndentNum, ctxIsHebrew]);

  const handleClick = () => {
    if (!ctxUniformWidth || ctxSelectedHebWords.length === 0)
      return;

    let numIndent = ctxSelectedHebWords[0].numIndent;
    if (!leftIndent) {
      if (numIndent > 0) {
        updateIndented(ctxStudyId, ctxSelectedHebWords[0].id, --ctxSelectedHebWords[0].numIndent);
        setButtonCondition(ctxSelectedHebWords[0].numIndent > 0);
        ctxSetIndentNum(ctxSelectedHebWords[0].numIndent)
      }
    }
    else {
      if (numIndent < 3) {
        updateIndented(ctxStudyId, ctxSelectedHebWords[0].id, ++ctxSelectedHebWords[0].numIndent);
        setButtonCondition(ctxSelectedHebWords[0].numIndent < 3);
        ctxSetIndentNum(ctxSelectedHebWords[0].numIndent)
      }
    }
  }
  return (
    <div className={`flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row ${!leftIndent && 'border-r border-stroke'}`}>
      <button
        className={`hover:text-primary ${buttonCondition ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        {
          (!ctxIsHebrew && leftIndent) || (ctxIsHebrew && !leftIndent) ? 
            <CgFormatIndentIncrease fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.5em" /> :
            <CgFormatIndentDecrease fillOpacity={buttonCondition ? "1" : "0.4"} fontSize="1.5em" />
        }          
      </button>
      <ToolTip text={(!ctxIsHebrew && leftIndent) || (ctxIsHebrew && !leftIndent) ? "Add Indent" : "Remove indent"} />
    </div>
  );
};

export const NewStropheBtn = () => {
  const { ctxNumSelectedWords, ctxSetNewStropheEvent } = useContext(FormatContext);

  const [visibleOptions, setVisibleOptions] = useState(false);

  const buttonEnabled = (ctxNumSelectedWords===1);

  const handleClick = () => (buttonEnabled && ctxSetNewStropheEvent(true));

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

  const buttonEnabled = ( ctxNumSelectedWords===1 && ctxStructuredWords.length > 1 && ctxCurrentStrophe > 1 )

  const handleClick = () => ( buttonEnabled && ctxSetMergeStropheEvent("up"))

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick}>
        <LuArrowUpWideNarrow opacity={(buttonEnabled)?`1`:`0.4`} fontSize="1.5em" />
      </button>
      <ToolTip text="Merge with strophe above" />
    </div>
  )
}
export const MergeStropheBtnDown = () => {
  const { ctxNumSelectedWords, ctxSetMergeStropheEvent, ctxStructuredWords, ctxCurrentStrophe } = useContext(FormatContext);

  const buttonEnabled = ( ctxNumSelectedWords===1 && ctxStructuredWords.length > 1 && ctxCurrentStrophe < ctxStructuredWords.length )

  const handleClick = () => ( buttonEnabled && ctxSetMergeStropheEvent("down"))

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick}>
        <LuArrowDownWideNarrow opacity={(buttonEnabled)?`1`:`0.4`} fontSize="1.5em" />
      </button>
      <ToolTip text="Merge with strophe below" />
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

