<<<<<<< HEAD
import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, LeftIndentBtn, RightIndentBtn, ClearFormatBtn, UniformWidthBtn, NewStropheBtn, NewStanzaBtn, FitScreenSwitcher } from "./Buttons";
import { useEffect, useContext } from "react";
=======
import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorActionBtn, ClearFormatBtn, MoveUpBtn, MoveDownBtn, 
  IndentBtn, UniformWidthBtn, StropheActionBtn, NewStanzaBtn } from "./Buttons";
import { useContext } from "react";
>>>>>>> main
import { FormatContext } from '../index';
import { ColorActionType, StropheActionType } from "@/lib/types";

const Toolbar = ({
  setZoomLevel,
  //color functions
  setColorAction,
<<<<<<< HEAD
  setColorFill,
  setBorderColor,
  setTextColor,
  setUniformWidth,
  setIndentWord,
  setFitScreen,
  setZoomLevelSaved
=======
  setSelectedColor,

  setUniformWidth
>>>>>>> main
}: {
  setZoomLevel: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setSelectedColor: (arg: string) => void;
  setUniformWidth: (arg: boolean) => void;
<<<<<<< HEAD
  setIndentWord: (arg: number[]) => void;
  setFitScreen: (arg:boolean) => void;
  setZoomLevelSaved: (arg:number) => void;
} ) => {
  
  const { ctxZoomLevel, ctxNumSelectedWords, ctxInViewMode, ctxFitScreen } = useContext(FormatContext);
=======
} ) => {
  
  const { ctxZoomLevel, ctxInViewMode } = useContext(FormatContext);
>>>>>>> main
  
  /* TODO: may need to refactor this part after more features are added to view mode*/
  return (
<<<<<<< HEAD
    <div id="sela-toolbar" className="sticky left-0 top-20 mr-auto ml-auto z-9999 flex justify-center max-w-180 drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
    <div className="mx-auto my-2 max-w-180 bg-white rounded-md border border-stroke py-2 shadow-1 dark:border-strokedark dark:bg-[#37404F]" style={{position:"relative"}}>
    { // only show zoom in/out & uniform width buttons in view only mode
      ctxInViewMode
      ? (
      // <div className="flex justify-center">
      <div className="grid grid-cols-5">
        <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
          <span className="rounded-md border-[.5px] text-center border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white">
          {ctxZoomLevel}
          </span>
        </div>
        <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <UniformWidthBtn setUniformWidth={setUniformWidth}/>
        <FitScreenSwitcher fitScreen={ctxFitScreen} setFitScreen={setFitScreen} setZoomLevel={setZoomLevel} setZoomLevelSaved={setZoomLevelSaved}/>
      </div>)
      : (<div className="grid grid-cols-16">
        {/* {ctxNumSelectedWords ? <DeselectAllBtn /> : ""} */}
        <UndoBtn />
        <RedoBtn />
        <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
          <span className="rounded-md border-[.5px] text-center mr-3 border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
          {ctxZoomLevel}
          </span>
        </div>
        <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <ColorFillBtn setColor={setColorFill} setColorAction={setColorAction}/>
        <BorderColorBtn setColor={setBorderColor} setColorAction={setColorAction}/>
        <TextColorBtn setColor={setTextColor} setColorAction={setColorAction}/>
        <ClearFormatBtn resetColorFill={setColorFill} resetBorderColor={setBorderColor} resetTextColor={setTextColor} setColorAction={setColorAction} />
        <UniformWidthBtn setUniformWidth={setUniformWidth}/>
        <LeftIndentBtn />
        <RightIndentBtn />
        <NewStropheBtn />
        <NewStanzaBtn />
        <MoveUpBtn />
        <MoveDownBtn />
      </div>)
    }
  </div>
=======
    <div className="fixed top-19 left-0 mr-auto ml-auto z-20 flex justify-center w-full max-w-full">
      <div className="fixed left-0 mx-auto pl-11 pr-11 max-w-220 bg-white py-2 w-full">
      { // only show zoom in/out & uniform width buttons in view only mode
        ctxInViewMode
        ? (<div className="flex">
          <div className="flex flex-row group">
            <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
            <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
              <span className="rounded-md border-[.5px] text-center border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white">
              {ctxZoomLevel}
              </span>
            </div>
            <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
            <UniformWidthBtn setUniformWidth={setUniformWidth}/>
          </div>
        </div>)
        : (<div className="flex">
          <div className="flex flex-row group">
            <UndoBtn />
            <RedoBtn />
          </div>

          <div className="flex flex-row group">
            <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
            <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
              <span className="rounded-md border-[.5px] text-center mr-3 border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
              {ctxZoomLevel}
              </span>
            </div>
            <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
          </div>

          <ColorActionBtn colorAction={ColorActionType.colorFill} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
          <ColorActionBtn colorAction={ColorActionType.borderColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
          <ColorActionBtn colorAction={ColorActionType.textColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
          <ClearFormatBtn setColorAction={setColorAction} />
          <UniformWidthBtn setUniformWidth={setUniformWidth}/>
          <IndentBtn leftIndent={true} />
          <IndentBtn leftIndent={false} />
          <StropheActionBtn stropheAction={StropheActionType.new} toolTip="New Strophe" />
          <StropheActionBtn stropheAction={StropheActionType.mergeUp} toolTip="Merge with previous strophe" />
          <StropheActionBtn stropheAction={StropheActionType.mergeDown} toolTip="Merge with next strophe" />
          <NewStanzaBtn />
          <MoveUpBtn />
          <MoveDownBtn />
        </div>)
      }
    </div>
>>>>>>> main
  </div>
  );
};


export default Toolbar;
