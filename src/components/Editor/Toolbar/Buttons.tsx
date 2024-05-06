"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineModeEdit } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineMinusCircle, AiOutlinePlusCircle, AiOutlineClear } from "react-icons/ai";
import { TbArrowAutofitContent } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";

import { SwatchesPicker } from 'react-color'
import React, { useContext } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType, ColorPickerProps } from "@/lib/types";
import { updateColor } from "@/lib/actions";

const ToolTip = ({ text } : { text: string }) => {
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
        onClick={ () => (zoomLevel >= 1) && setZoomLevel(zoomLevel - 1) } >
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
        onClick={ () => (zoomLevel < 10) && setZoomLevel(zoomLevel + 1) } >
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

  const { ctxStudyId, ctxColorAction, ctxHasSelectedWords, ctxSelectedWords, ctxColorFill } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
      setColorAction((ctxColorAction != ColorActionType.colorFill) ? ColorActionType.colorFill : ColorActionType.none);
    }
  }

  const handleChange = (color:any) => {
    setColor(color.hex);
    updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.colorFill, color.hex);
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={handleClick} >
        <BiSolidColorFill fillOpacity={ctxHasSelectedWords ? "1" : "0.4"} fontSize="1.4em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            { 
              width: "100%",
              height: "0.25rem",
              background:`${ctxHasSelectedWords ? ctxColorFill : '#FFFFFF'}`,
              marginTop:"0.05rem",
            }
          }
        >
        </div>
      </button>

      {
        ctxColorAction === ColorActionType.colorFill && (
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

  const { ctxStudyId, ctxColorAction, ctxHasSelectedWords, ctxSelectedWords, ctxBorderColor } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
      setColorAction((ctxColorAction != ColorActionType.borderColor) ? ColorActionType.borderColor : ColorActionType.none);
    }
  }

  const handleChange = (color:any) => {
    setColor(color.hex);
    updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.borderColor, color.hex);
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={handleClick} >
        <MdOutlineModeEdit fillOpacity={ctxHasSelectedWords ? "1" : "0.4"} fontSize="1.4em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            { 
              width: "100%",
              height: "0.25rem",
              background:`${ctxHasSelectedWords ? ctxBorderColor : '#FFFFFF'}`,
              marginTop:"0.05rem",
            }
          }
        >
        </div>
      </button>
      {
        ctxColorAction === ColorActionType.borderColor && (
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

  const { ctxStudyId, ctxColorAction, ctxHasSelectedWords, ctxSelectedWords, ctxTextColor } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
      setColorAction((ctxColorAction != ColorActionType.textColor) ? ColorActionType.textColor : ColorActionType.none);
    }
  }

  const handleChange = (color:any) => {
    setColor(color.hex);
    updateColor(ctxStudyId, ctxSelectedWords, ColorActionType.textColor, color.hex);
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={handleClick} >
        <BiFont fillOpacity={ctxHasSelectedWords ? "1" : "0.4"} fontSize="1.5em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            { 
              width: "100%",
              height: "0.25rem",
              background:`${ctxHasSelectedWords ? ctxTextColor : '#FFFFFF'}`,
              marginTop:"0.05rem",
            }
          }
        >
        </div>
      </button>
      {
        ctxColorAction === ColorActionType.textColor && (
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

export const ClearFormatBtn = ({resetColorFill, resetBorderColor, resetTextColor, setColorAction} : {
  resetColorFill: (arg: string) => void;
  resetBorderColor: (arg: string) => void;
  resetTextColor: (arg: string) => void;
  setColorAction: (arg: number) => void,
})  => {

  const { ctxStudyId, ctxHasSelectedWords, ctxSelectedWords } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
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
        <AiOutlineClear fillOpacity={ctxHasSelectedWords ? "1" : "0.4"} fontSize="1.4em" />
      </button>
      <ToolTip text="Clear format" />
    </div>
  );
};

export const UniformWidthBtn = ({setUniformWidth} : {
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

  const { ctxIsHebrew, ctxHasSelectedWords, ctxUniformWidth } = useContext(FormatContext);

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Add Indent Clicked")} >
        <CgFormatIndentIncrease fillOpacity={ctxUniformWidth && ctxHasSelectedWords ? "1" : "0.4"} fontSize="1.5em" />
      </button>
      <ToolTip text={ctxIsHebrew ? "Remove Ident" : "Add indent"} />
    </div>
  );
};

export const RightIndentBtn = () => {

  const { ctxIsHebrew, ctxHasSelectedWords, ctxUniformWidth } = useContext(FormatContext);

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Remove Indent Clicked")} >
        <CgFormatIndentDecrease fillOpacity={ctxUniformWidth && ctxHasSelectedWords ? "1" : "0.4"}  fontSize="1.5em" />
      </button>
      <ToolTip text={ctxIsHebrew ? "Add Ident" : "Remove indent"} />
    </div>
  );
};

export const NewStropheBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("New Strophe Clicked")} >
        <CgArrowsBreakeV opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="New strophe" />
    </div>
  );
};

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

