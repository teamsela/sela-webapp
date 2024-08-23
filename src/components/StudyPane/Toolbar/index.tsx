import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, LeftIndentBtn, RightIndentBtn, ClearFormatBtn, UniformWidthBtn, NewStropheBtn, MergeStropheBtnUp, MergeStropheBtnDown, NewStanzaBtn } from "./Buttons";
import { useEffect, useContext } from "react";
import { FormatContext } from '../index';
import { ColorActionType } from "@/lib/types";

const Toolbar = ({
  setZoomLevel,
  //color functions
  setColorAction,
  setColorFill,
  setBorderColor,
  setTextColor,
  setUniformWidth,
  setIndentWord
}: {
  setZoomLevel: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setColorFill: (arg: string) => void;
  setBorderColor: (arg: string) => void;
  setTextColor: (arg: string) => void;
  setUniformWidth: (arg: boolean) => void;
  setIndentWord: (arg: number[]) => void;
} ) => {
  
  const { ctxZoomLevel, ctxNumSelectedWords, ctxInViewMode } = useContext(FormatContext);
  
  useEffect(() => {
    if (ctxNumSelectedWords > 0)
      setColorAction(ColorActionType.none);
  }, [ctxNumSelectedWords])

  /* TODO: may need to refactor this part after more features are added to view mode*/
  return (
    <div className="sticky left-0 mr-auto ml-auto z-9990 flex justify-center w-full max-w-full">
    <div className="mx-auto pl-11 pr-11 max-w-220 bg-white py-2 w-full" style={{position:"relative"}}>
    { // only show zoom in/out & uniform width buttons in view only mode
      ctxInViewMode
      ? (<div className="grid grid-cols-4">
        <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
          <span className="rounded-md border-[.5px] text-center border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white">
          {ctxZoomLevel}
          </span>
        </div>
        <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <UniformWidthBtn setUniformWidth={setUniformWidth}/>
      </div>)
      : (<div className="flex">
        {/* {ctxNumSelectedWords ? <DeselectAllBtn /> : ""} */}

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

        <ColorFillBtn setColor={setColorFill} setColorAction={setColorAction}/>
        <BorderColorBtn setColor={setBorderColor} setColorAction={setColorAction}/>
        <TextColorBtn setColor={setTextColor} setColorAction={setColorAction}/>
        <ClearFormatBtn resetColorFill={setColorFill} resetBorderColor={setBorderColor} resetTextColor={setTextColor} setColorAction={setColorAction} />
        <UniformWidthBtn setUniformWidth={setUniformWidth}/>
        <LeftIndentBtn />
        <RightIndentBtn />
        <NewStropheBtn />
        <MergeStropheBtnUp />
        <MergeStropheBtnDown />
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
