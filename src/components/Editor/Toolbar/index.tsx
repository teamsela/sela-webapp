import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, LeftIndentBtn, RightIndentBtn, ClearFormatBtn, UniformWidthBtn, NewStropheBtn, NewStanzaBtn } from "./Buttons";
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
  setIndentWord,
  showEditButtons
}: {
  setZoomLevel: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setColorFill: (arg: string) => void;
  setBorderColor: (arg: string) => void;
  setTextColor: (arg: string) => void;
  setUniformWidth: (arg: boolean) => void;
  setIndentWord: (arg: number[]) => void;
  showEditButtons: boolean
} ) => {
  
  const { ctxZoomLevel, ctxNumSelectedWords } = useContext(FormatContext);
  
  useEffect(() => {
    if (ctxNumSelectedWords > 0)
      setColorAction(ColorActionType.none);
  }, [ctxNumSelectedWords])

  return (
    <div className="sticky left-0 top-20 z-9999 flex w-full drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className={`mx-auto my-2 grid max-w-180 bg-white ${showEditButtons ? "grid-cols-16" : "grid-cols-12"} rounded-md border border-stroke py-2 shadow-1 dark:border-strokedark dark:bg-[#37404F]`} style={{position:"relative"}}>
        <UndoBtn />
        <RedoBtn />
        <ZoomOutBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
          <span className="rounded-md border-[.5px] text-center mr-3 border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
          {ctxZoomLevel}
          </span>
        </div>
        <ZoomInBtn zoomLevel={ctxZoomLevel} setZoomLevel={setZoomLevel} />
        {showEditButtons &&
          <div className = "col-span-4">
            <div className="grid grid-cols-4">
              <ColorFillBtn setColor={setColorFill} setColorAction={setColorAction}/>
              <BorderColorBtn setColor={setBorderColor} setColorAction={setColorAction}/>
              <TextColorBtn setColor={setTextColor} setColorAction={setColorAction}/>
              <ClearFormatBtn resetColorFill={setColorFill} resetBorderColor={setBorderColor} resetTextColor={setTextColor} setColorAction={setColorAction} />
            </div>
          </div>
        }
        <UniformWidthBtn setUniformWidth={setUniformWidth}/>
        <LeftIndentBtn />
        <RightIndentBtn />
        <NewStropheBtn />
        <NewStanzaBtn />
        <MoveUpBtn />
        <MoveDownBtn />
      </div>
    </div>
  );
};


export default Toolbar;
