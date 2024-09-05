import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorActionBtn, ClearFormatBtn, MoveUpBtn, MoveDownBtn, 
  IndentBtn, UniformWidthBtn, StropheActionBtn, NewStanzaBtn, FitScreenSwitcher } from "./Buttons";
import { useContext } from "react";
import { FormatContext } from '../index';
import { ColorActionType, StropheActionType } from "@/lib/types";

const Toolbar = ({
  setZoomLevel,
  //color functions
  setColorAction,
  setSelectedColor,
  setUniformWidth,
  setFitScreen,
  setZoomLevelSaved
}: {
  setZoomLevel: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setSelectedColor: (arg: string) => void;
  setUniformWidth: (arg: boolean) => void;
  setFitScreen: (arg:boolean) => void;
  setZoomLevelSaved: (arg:number) => void;
} ) => {
  
  const { ctxZoomLevel, ctxInViewMode, ctxFitScreen } = useContext(FormatContext);
  
  /* TODO: may need to refactor this part after more features are added to view mode*/
  return (
    <div id="sela-toolbar" className="fixed top-19 left-0 mr-auto ml-auto z-20 flex justify-center w-full max-w-full">
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
            <FitScreenSwitcher fitScreen={ctxFitScreen} setFitScreen={setFitScreen} setZoomLevel={setZoomLevel} setZoomLevelSaved={setZoomLevelSaved}/>
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
  </div>
  );
};


export default Toolbar;
