"use client";

import { LuUndo2, LuRedo2, LuZoomIn, LuZoomOut } from "react-icons/lu";
import { MdFormatColorFill, MdBorderColor, MdFormatColorText } from "react-icons/md";

export const UndoBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Undo Clicked")} >
        <LuUndo2 fontSize="1.5em" />
      </button>
    </div>
  );
};

export const RedoBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Redo Clicked")} >
        <LuRedo2 fontSize="1.5em" />
      </button>
    </div>
  );
};

export const ZoomInBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Zoom In Clicked")} >
        <LuZoomIn fontSize="1.5em" />
      </button>
    </div>
  );
};

export const ZoomOutBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Zoom Out Clicked")} >
        <LuZoomOut fontSize="1.5em" />
      </button>
    </div>
  );
};

export const ColorFillBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Color Fill Clicked")} >
        <MdFormatColorFill fill-opacity="0.4" fontSize="1.4em" />
      </button>
    </div>
  );
};

export const BorderColorBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Border Color Clicked")} >
        <MdBorderColor fill-opacity="0.4" fontSize="1.4em" />
      </button>
    </div>
  );
};

export const TextColorBtn = () => {

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button 
        className="hover:text-primary"
        onClick={() => console.log("Text Color Clicked")} >
        <MdFormatColorText fill-opacity="0.4" fontSize="1.4em" />
      </button>
    </div>
  );
};