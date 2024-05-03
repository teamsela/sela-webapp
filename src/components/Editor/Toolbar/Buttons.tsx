"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineModeEdit, MdFormatColorText } from "react-icons/md";
import { BiSolidColorFill } from "react-icons/bi";
import { AiOutlineMinusCircle, AiOutlinePlusCircle, AiOutlineClear } from "react-icons/ai";
import { TbArrowAutofitContent } from "react-icons/tb";

import { SwatchesPicker } from 'react-color'
import React, { useEffect, useState, useContext } from 'react';

import { FormatContext } from '../index';
import { ActiveColorType, ColorPickerProps } from "@/lib/types";

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
  setColorPickerOpened
}) => {

  const { ctxColorPickerOpened, ctxHasSelectedWords, ctxColorFill } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
      setColorPickerOpened((ctxColorPickerOpened != ActiveColorType.colorFill) ? ActiveColorType.colorFill : ActiveColorType.none);
    }
  }

  const handleChange = (color:any) => {
    setColor(color.hex);
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
        ctxColorPickerOpened === ActiveColorType.colorFill && (
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
  setColorPickerOpened
}) => {

  const { ctxColorPickerOpened, ctxHasSelectedWords, ctxBorderColor } = useContext(FormatContext);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
      setColorPickerOpened((ctxColorPickerOpened != ActiveColorType.borderColor) ? ActiveColorType.borderColor : ActiveColorType.none);
    }
  }

  const handleChange = (color:any) => {
    setColor(color.hex);
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
        ctxColorPickerOpened === ActiveColorType.borderColor && (
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

// export const TextColorBtn: React.FC<ColorPickerProps> = ({
//   color,
//   setColor
// }) => {

//   return (
//     <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
//       <button 
//         className="hover:text-primary"
//         onClick={() => console.log("Text Color Clicked")} >
//         <MdFormatColorText fillOpacity="0.4" fontSize="1.4em" />
//       </button>
//     </div>
//   );
// };


export const ClearFormatBtn = () => {

  const { ctxHasSelectedWords } = useContext(FormatContext)

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => { console.log("Clear Format") }} >
        <AiOutlineClear fillOpacity={ctxHasSelectedWords ? "1" : "0.4"} fontSize="1.4em" />
      </button>
      <ToolTip text="Clear format" />
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

export const MoveLeftBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Move Down Clicked")} >
        <LuArrowLeftToLine opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="Move left" />
    </div>
  );
};

export const MoveRightBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Move Down Clicked")} >
        <LuArrowRightToLine opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="Move right" />
    </div>
  );
};

export const UniformWidthBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Uniform Width Clicked")} >
        <TbArrowAutofitContent opacity="0.4" fontSize="1.5em" />
      </button>
      <ToolTip text="Uniform block size" />
    </div>
  );
};

