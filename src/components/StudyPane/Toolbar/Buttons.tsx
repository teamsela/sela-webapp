"use client";

<<<<<<< HEAD
import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineModeEdit, MdFullscreen, MdFullscreenExit } from "react-icons/md";
=======
import { LuUndo2, LuRedo2, LuArrowUpToLine, LuArrowDownToLine, LuArrowUpWideNarrow, LuArrowDownWideNarrow, LuArrowLeftToLine, LuArrowRightToLine } from "react-icons/lu";
import { MdOutlineModeEdit } from "react-icons/md";
>>>>>>> main
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineMinusCircle, AiOutlinePlusCircle, AiOutlineClear } from "react-icons/ai";
import { TbArrowAutofitContent } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";

import { SwatchesPicker } from 'react-color'
import React, { useContext, useEffect, useState } from 'react';

import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../index';
import { ColorActionType, ColorPickerProps, InfoPaneActionType, StropheActionType } from "@/lib/types";
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
  const { ctxFitScreen } = useContext(FormatContext);
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className={`${ctxFitScreen ? "cursor-not-allowed":"hover:text-primary"}`}
        onClick={() => !ctxFitScreen && (zoomLevel >= 1) && setZoomLevel(zoomLevel - 1)} >
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
  const { ctxFitScreen } = useContext(FormatContext);
  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
      <button
        className={`${ctxFitScreen ? "cursor-not-allowed":"hover:text-primary"}`}
        onClick={() => !ctxFitScreen && (zoomLevel < 10) && setZoomLevel(zoomLevel + 1)} >
        <AiOutlinePlusCircle fontSize="1.5em" />
      </button>
      <ToolTip text="Zoom in" />
    </div>
  );
};

export const ColorActionBtn: React.FC<ColorPickerProps> = ({
  colorAction,
  setSelectedColor,
  setColorAction
}) => {
  const { ctxStudyId, ctxColorAction, ctxColorFill, ctxBorderColor, ctxTextColor,
    ctxNumSelectedWords, ctxSelectedWords, ctxNumSelectedStrophes, ctxSelectedStrophes 
  } = useContext(FormatContext);

  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [displayColor, setDisplayColor] = useState("");

  const refreshDisplayColor = () => {
    (colorAction === ColorActionType.colorFill) && setDisplayColor(ctxColorFill);
    (colorAction === ColorActionType.borderColor) && setDisplayColor(ctxBorderColor);
    (colorAction === ColorActionType.textColor) && setDisplayColor(ctxTextColor);
  }

  useEffect(() => {
    const hasSelectedItems = (ctxNumSelectedWords > 0 || (ctxNumSelectedStrophes > 0 && colorAction != ColorActionType.textColor));
    setButtonEnabled(hasSelectedItems);

    // make sure the colour picker turns off completely when user de-selects everything
    if (!hasSelectedItems) {
      setColorAction(ColorActionType.none);
      setSelectedColor("");
    }
    else {
      refreshDisplayColor();
    }
  }, [ctxNumSelectedWords, ctxNumSelectedStrophes])

  useEffect(() => {
    if (ctxColorAction === ColorActionType.resetColor) {
      refreshDisplayColor();
    }
  }, [ctxColorAction])

  const handleClick = () => {
    if (buttonEnabled) {
      setColorAction((ctxColorAction != colorAction) ? colorAction : ColorActionType.none);
      setSelectedColor("");
    }
  }

  const handleChange = (color: any) => {
    //console.log("Changing " + colorActionType + " color to " + color.hex);
    setSelectedColor(color.hex);
    setDisplayColor(color.hex);
    if (ctxSelectedWords.length > 0) {
      updateWordColor(ctxStudyId, ctxSelectedWords, colorAction, color.hex);
    }
    if (ctxNumSelectedStrophes > 0) {
      updateStropheColor(ctxStudyId, ctxSelectedStrophes, colorAction, color.hex);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
          {
            (colorAction === ColorActionType.colorFill) && <BiSolidColorFill fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.4em" />
          }
          {
            (colorAction === ColorActionType.borderColor) && <MdOutlineModeEdit fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.4em" />
          }
          {
            (colorAction === ColorActionType.textColor) && <BiFont fillOpacity={buttonEnabled? "1" : "0.4"} fontSize="1.5em" />
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
              <SwatchesPicker color={displayColor} onChange={handleChange} />
            </div>
          </div>
        )
      }
    </div>
  );
};


export const ClearFormatBtn = ({ setColorAction } : { setColorAction : (arg: number) => void }) => {

  const { ctxStudyId, ctxNumSelectedWords, ctxSelectedWords, 
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
  }, [ctxNumSelectedWords, ctxNumSelectedStrophes])

  const handleClick = () => {
    if (buttonEnabled) {
      setColorAction(ColorActionType.resetColor);
      ctxSetColorFill(DEFAULT_COLOR_FILL);
      ctxSetBorderColor(DEFAULT_BORDER_COLOR);
      if (ctxSelectedWords.length > 0) {
        ctxSetTextColor(DEFAULT_TEXT_COLOR);
        updateWordColor(ctxStudyId, ctxSelectedWords, ColorActionType.resetColor, null);
      }
      if (ctxSelectedStrophes.length > 0) {
        updateStropheColor(ctxStudyId, ctxSelectedStrophes, ColorActionType.resetColor, null);
      }      
    }
  }

  return (
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 border-r border-stroke xsm:flex-row">
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        <AiOutlineClear fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.4em" />
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
  const [buttonEnabled, setButtonEnabled] = useState(ctxUniformWidth && (ctxNumSelectedWords === 1));

  if (ctxIsHebrew) {
    leftIndent = !leftIndent;
  }

  useEffect(() => {
    ctxSetIndentNum((ctxSelectedHebWords.length === 1) ? ctxSelectedHebWords[0].numIndent : 0);
    let validIndent = (!leftIndent) ? ctxIndentNum > 0 : ctxIndentNum < 3;
    setButtonEnabled(ctxUniformWidth && (ctxNumSelectedWords === 1) && validIndent);
  }, [ctxUniformWidth, ctxNumSelectedWords, ctxSelectedHebWords, ctxIndentNum, ctxIsHebrew]);

  const handleClick = () => {
    if (!ctxUniformWidth || ctxSelectedHebWords.length === 0)
      return;

    let numIndent = ctxSelectedHebWords[0].numIndent;
    if (!leftIndent) {
      if (numIndent > 0) {
        updateIndented(ctxStudyId, ctxSelectedHebWords[0].id, --ctxSelectedHebWords[0].numIndent);
        setButtonEnabled(ctxSelectedHebWords[0].numIndent > 0);
        ctxSetIndentNum(ctxSelectedHebWords[0].numIndent)
      }
    }
    else {
      if (numIndent < 3) {
        updateIndented(ctxStudyId, ctxSelectedHebWords[0].id, ++ctxSelectedHebWords[0].numIndent);
        setButtonEnabled(ctxSelectedHebWords[0].numIndent < 3);
        ctxSetIndentNum(ctxSelectedHebWords[0].numIndent)
      }
    }
  }
  return (
    <div className={`flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row ${!leftIndent && 'border-r border-stroke'}`}>
      <button
        className={`hover:text-primary ${buttonEnabled ? '' : 'pointer-events-none'}`}
        onClick={handleClick} >
        {
          (!ctxIsHebrew && leftIndent) || (ctxIsHebrew && !leftIndent) ? 
            <CgFormatIndentIncrease fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" /> :
            <CgFormatIndentDecrease fillOpacity={buttonEnabled ? "1" : "0.4"} fontSize="1.5em" />
        }          
      </button>
      <ToolTip text={(!ctxIsHebrew && leftIndent) || (ctxIsHebrew && !leftIndent) ? "Add Indent" : "Remove indent"} />
    </div>
  );
};

export const StropheActionBtn = ({ stropheAction, toolTip } : {stropheAction : StropheActionType, toolTip : string }) => {

  const { ctxNumSelectedWords, ctxSetStropheAction } = useContext(FormatContext);

  const buttonEnabled = (ctxNumSelectedWords === 1);

  const handleClick = () => { buttonEnabled && ctxSetStropheAction(stropheAction) };

  return (
    <>
    <div className="relative">
    <div className="flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <button
        className="hover:text-primary"
        onClick={handleClick} >
          {
            (stropheAction === StropheActionType.new) && <CgArrowsBreakeV opacity={(buttonEnabled)?`1`:`0.4`} fontSize="1.5em" />
          }
          {
            (stropheAction === StropheActionType.mergeUp) && <LuArrowUpWideNarrow opacity={(buttonEnabled)?`1`:`0.4`} fontSize="1.5em" />
          }
          {
            (stropheAction === StropheActionType.mergeDown) && <LuArrowDownWideNarrow opacity={(buttonEnabled)?`1`:`0.4`} fontSize="1.5em" />
          }          
        <ToolTip text={toolTip} />
      </button>
    </div>
    </div>
    </>
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

export const StructureBtn = ({
  setInfoPaneAction,
  infoPaneAction,
}: {
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {

  const handleClick = () => {
    if (infoPaneAction != InfoPaneActionType.structure) {
      setInfoPaneAction(InfoPaneActionType.structure);
    } else {
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        disabled={true}
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
  const handleClick = () => {
    if (infoPaneAction != InfoPaneActionType.motif) {
      setInfoPaneAction(InfoPaneActionType.motif);
    } else {
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
  const handleClick = () => {
    if (infoPaneAction != InfoPaneActionType.syntax) {
      setInfoPaneAction(InfoPaneActionType.syntax);
    } else {
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        disabled={true}
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
  const handleClick = () => {
    if (infoPaneAction != InfoPaneActionType.sounds) {
      setInfoPaneAction(InfoPaneActionType.sounds);
    } else {
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }
  return (
    <div>
      <button
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        disabled={true}
        onClick={handleClick} >
        Sounds
      </button>
      <ToolTip text="Sounds" />
    </div>
  );
};

export const FitScreenSwitcher = ({
  fitScreen,
  setFitScreen,
  setZoomLevel,
  setZoomLevelSaved
}: {
  fitScreen: boolean;
  setFitScreen: (arg:boolean)=>void;
  setZoomLevel: (arg: number) => void;
  setZoomLevelSaved: (arg: number) => void;
} ) => {
  const { ctxZoomLevel, ctxNumOfLines, ctxZoomLevelSaved } = useContext(FormatContext);
  const getFitScreenZoomLevel = () => {
    if (!fitScreen) {
      // store previous zoom level
      setZoomLevelSaved(ctxZoomLevel);
      
      // calculate fit screen zoom level
      const headerHeight = document.getElementById("sela-header")?.offsetHeight;
      const toolbarHeight = document.getElementById("sela-toolbar")?.offsetHeight;
      const passageHeight = window.innerHeight - (headerHeight || 0) -  (toolbarHeight || 0);
      // console.log(window.innerHeight, headerHeight, toolbarHeight, passageHeight, ctxNumOfLines);
      const REM = 16; 

      // formula: numOfLines * (1rem + 4 + fontSize) + 3rem = passageHeight
      const fontSize = (passageHeight - 3 * REM - ctxNumOfLines * (REM+4)) / ctxNumOfLines 
      // zoomLevel to font size map: 
      // level 0: 6, level 1: 8, level 2: 10, level 3: 12, level 4: 14, level 5: 16
      // level 6: 18, level 7: 20, level 8: 24, level 9: 30, level 10: 36 
      let zoomLevel = 0;
      if (fontSize < 6) {
        return;
      } else if (fontSize < 22) {
        zoomLevel = Math.floor((fontSize - 6) / 2);
      } else if (fontSize < 24) {
        zoomLevel=7;
      }else if (fontSize < 30) {
        zoomLevel = 8;
      } else if (fontSize < 36) {
        zoomLevel = 9;
      } else {
        zoomLevel = 10;
      }
      // console.log(`${fontSize} calculated fit screen zoom level is ${zoomLevel}`);
      setZoomLevel(zoomLevel);
    } else { // restore previous zoom level
      setZoomLevel(ctxZoomLevelSaved);
    }
  }
  return (
    <div className="border-l border-stroke px-4 dark:border-strokedark flex flex-col group relative inline-block items-center justify-center px-2 xsm:flex-row">
      <label
        htmlFor="toggleFitScreen"
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            id="toggleFitScreen"
            type="checkbox"
            className="sr-only"
            onChange={() => {
              setFitScreen(!fitScreen);
              getFitScreenZoomLevel();
            }}
          />
          <div className="block h-8 w-14 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          <div
            className={`dot absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white transition ${
              fitScreen && "!right-1 !translate-x-full"
            }`}
          >
            <span className={`hidden ${fitScreen && "!block"}`}>
              <MdFullscreen />
            </span>
            <span className={`${fitScreen && "hidden"}`}>
              <MdFullscreenExit/>
            </span>
          </div>
        </div>
      </label>
      <ToolTip text="Fit content to screen" />
    </div>
  );
};