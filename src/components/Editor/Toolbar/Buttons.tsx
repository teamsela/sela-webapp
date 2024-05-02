"use client";

import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdBorderColor, MdFormatColorText } from "react-icons/md";
import { BiSolidColorFill } from "react-icons/bi";
import { AiOutlineMinusCircle, AiOutlinePlusCircle, AiOutlineClear } from "react-icons/ai";
import { TbArrowAutofitContent } from "react-icons/tb";

import { SwatchesPicker } from 'react-color'
import React, { useEffect, useState, useContext } from 'react';
import { FormatContext } from '../index';
import { MdOutlineModeEdit } from "react-icons/md";



export const UndoBtn = () => {

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Undo Clicked")} >
        <LuUndo2 fontSize="1.5em" />
      </button>
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
       Undo
      </div>
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
       Redo
      </div>
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Zoom out
      </div>      
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Zoom in
      </div>
    </div>
  );
};


interface ColorPickerProps {
  setColor: (arg: string) => void;
  setColorPickerOpened: (arg: number) => void,
}

export const ColorFillBtn: React.FC<ColorPickerProps> = ({
  setColor,
  setColorPickerOpened
}) => {

  const { ctxColorPickerOpened, ctxActiveColorType, ctxHasSelectedWords, ctxColorFill } = useContext(FormatContext);

  const [localColorPickerOpened, setLocalColorPickerOpened] = useState(false);


  const handleClick = () => {
    if (ctxHasSelectedWords) {
      if (!localColorPickerOpened || (localColorPickerOpened && ctxColorPickerOpened != ctxActiveColorType.colorFill)) {
        setLocalColorPickerOpened(true);
        setColorPickerOpened(ctxActiveColorType.colorFill);
      }
      else {
        setLocalColorPickerOpened(false);
        setColorPickerOpened(ctxActiveColorType.none);
      }
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
        ctxColorPickerOpened === ctxActiveColorType.colorFill && (
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

  const { ctxColorPickerOpened, ctxActiveColorType, ctxHasSelectedWords, ctxBorderColor } = useContext(FormatContext);

  const [localColorPickerOpened, setLocalColorPickerOpened] = useState(false);

  const handleClick = () => {
    if (ctxHasSelectedWords) {
      if (!localColorPickerOpened || (localColorPickerOpened && ctxColorPickerOpened != ctxActiveColorType.borderColor)) {
        setLocalColorPickerOpened(true);
        setColorPickerOpened(ctxActiveColorType.borderColor);
      }
      else {
        setLocalColorPickerOpened(false);
        setColorPickerOpened(ctxActiveColorType.none);
      }
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
        ctxColorPickerOpened === ctxActiveColorType.borderColor && (
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Clear format
      </div>
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Move up
      </div>      
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Move down
      </div>      
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Move left
      </div>
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Move right
      </div>
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
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Uniform block size
      </div>      
    </div>
  );
};

