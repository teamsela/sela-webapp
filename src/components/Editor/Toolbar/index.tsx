import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, /*TextColorBtn,*/ MoveUpBtn, MoveDownBtn, MoveLeftBtn, MoveRightBtn, ClearFormatBtn, UniformWidthBtn } from "./Buttons";
import { useState, useEffect, useContext, useRef } from "react";
import { FormatContext } from '../index';

const Toolbar = ({
  setZoomLevel,
  //color functions
  setColorPickerOpened,
  setColorFill,
  setBorderColor,
}: {
  setZoomLevel: (arg: number) => void;
  //color functions
  setColorPickerOpened: (arg: number) => void,
  setColorFill: (arg: {
    r: number;
    g: number;
    b: number;
    a: number;
  }) => void;
  setBorderColor: (arg: {
    r: number;
    g: number;
    b: number;
    a: number;
  }) => void;
  //TBD: border color, text color...
} ) => {
  
  const { ctxZoomLevel, ctxHasSelectedWords, ctxColorPickerOpened, ctxActiveColorType } = useContext(FormatContext);

  //2024-04-24 plan:
  //add a useState for each colour button (fill, border, text) to determine whether those pickers are clicked & active here
  
  //pass the set state function to each colour button component
  //when clicked, their state will be fliped
  //if one become active, deactivate all others

  //for setColorPanelActive: dont pass the function to each colour button component
  //if at least one useState for colour button is active, set colorPanelActive as positive
  //if not, set to negative
  // - setColorPanelActive is used by Passage/index.tsx to determine whether it should apply the new colour to word boxes
  
  useEffect(() => {
    if (!ctxHasSelectedWords)
      setColorPickerOpened(ctxActiveColorType.none);
  }, [ctxHasSelectedWords])

  //to make sure only one picker is active at a time
  // const handlePickers = (activeVariable: string) => {
  //   setFillColorActive(activeVariable === 'fillColorActive');
  //   setBorderColorActive(activeVariable === 'borderColorActive');
  //   setTextColorActive(activeVariable === 'textColorActive');
  // };
  

  // const clearSelection = () => {
  //   console.log("Clear selection");
  //   setSelectedWords([]);
  // }


  return (
    <div className="mx-auto mb-5 mt-4 grid max-w-180 bg-white grid-cols-12 rounded-md border border-stroke py-2 shadow-1 dark:border-strokedark dark:bg-[#37404F]" style={{position:"relative"}}>
      <UndoBtn />
      <RedoBtn />
      <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
      <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
        <span className="rounded-md border-[.5px] text-center mr-3 border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
        {ctxZoomLevel}
        </span>
      </div>
      <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
      <ColorFillBtn setColor={setColorFill} setColorPickerOpened={setColorPickerOpened}/>
      {/* TBD: realize border and text color */}
      <BorderColorBtn setColor={setBorderColor} setColorPickerOpened={setColorPickerOpened}/>
      {/* <TextColorBtn /> */}
      <ClearFormatBtn />
      <MoveUpBtn />
      <MoveDownBtn />
      <MoveLeftBtn />
      <MoveRightBtn />
      <UniformWidthBtn />
    </div>
  );
};


export default Toolbar;
