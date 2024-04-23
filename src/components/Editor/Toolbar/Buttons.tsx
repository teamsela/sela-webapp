"use client";

import { LuUndo2, LuRedo2, LuZoomIn, LuZoomOut, LuArrowUpToLine, LuArrowDownToLine, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineTextIncrease, MdOutlineTextDecrease, MdFormatColorFill, MdBorderColor, MdFormatColorText, MdOutlineDehaze, MdOutlineMenu, MdOutlineSort, MdOutlineAddRoad } from "react-icons/md";
import { SketchPicker } from 'react-color'
import React, { useState } from 'react';

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
        onClick={ () => (zoomLevel > 1) && setZoomLevel(zoomLevel - 1) } >
        <LuZoomOut fontSize="1.5em" />
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
        onClick={ () => (zoomLevel < 7) && setZoomLevel(zoomLevel + 1) } >
        <LuZoomIn fontSize="1.5em" />
      </button>
      <div className="absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded bg-black px-4.5 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100">
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
        Zoom in
      </div>
    </div>
  );
};


interface ColorProps {
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  setColor: (arg: object) => void;
}

export const ColorFillBtn: React.FC<ColorProps> = ({
  color,
  setColor,
}) => {
  
  const [colorPanelActive, setColorPanelActive] = useState(false);
  const handleClick = () => {
    console.log("Color Fill Clicked")
    setColorPanelActive(prevState => !prevState);
  }
  const handleChange = () => {
    console.log('change')
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={handleClick} >
        <MdFormatColorFill fillOpacity="0.4" fontSize="1.4em" />
        <div
          //using embbed style for the color display for now, may move to tailwind after some research
          style={
            { 
              width: "100%",
              height:"0.25rem",
              background:`rgba(${color.r},${color.g},${color.b},${color.a})`,
              marginTop:"0.15rem",
            }
          }
        >
        </div>
      </button>
      
      {
        colorPanelActive && (
          <div style={{position:"relative",zIndex:"2"}}>
            <div style={{position:"absolute",top:"1.5rem",left:"-2rem"}}>
              <SketchPicker color={color} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};

export const BorderColorBtn: React.FC<ColorProps> = ({
  color,
  setColor
}) => {

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Border Color Clicked")} >
        <MdBorderColor fillOpacity="0.4" fontSize="1.4em" />
      </button>
    </div>
  );
};

export const TextColorBtn: React.FC<ColorProps> = ({
  color,
  setColor
}) => {

  return (
    <div className="flex flex-col items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Text Color Clicked")} >
        <MdFormatColorText fillOpacity="0.4" fontSize="1.4em" />
      </button>
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