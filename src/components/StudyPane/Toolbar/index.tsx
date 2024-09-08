import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorActionBtn, ClearFormatBtn, MoveUpBtn, MoveDownBtn, 
  IndentBtn, UniformWidthBtn, StropheActionBtn, NewStanzaBtn } from "./Buttons";
import ScaleDropDown from "./ScaleDropDown";
import { useContext } from "react";
import { FormatContext } from '../index';
import { ColorActionType, StropheActionType } from "@/lib/types";

const Toolbar = ({
  setScaleValue,
  //color functions
  setColorAction,
  setSelectedColor,

  setUniformWidth
}: {
  setScaleValue: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setSelectedColor: (arg: string) => void;
  setUniformWidth: (arg: boolean) => void;
} ) => {
  
  const { ctxInViewMode } = useContext(FormatContext);
  
  /* TODO: may need to refactor this part after more features are added to view mode*/
  return (
    <div className="fixed top-19 left-0 mr-auto ml-auto z-20 flex justify-center w-full max-w-full hbFontExemption">
      <div id="selaToolbar" className="fixed left-0 mx-auto pl-11 pr-11 max-w-220 bg-white py-2 w-full">

      { // only show zoom in/out & uniform width buttons in view only mode
        ctxInViewMode
        ? (<div className="flex">
            <ScaleDropDown setScaleValue={setScaleValue} />
            <UniformWidthBtn setUniformWidth={setUniformWidth}/>
        </div>)
        : (<div className="flex">
          {/*<div className="border-r border-stroke flex flex-row">
            <UndoBtn />
            <RedoBtn />
          </div>*/}
          <ScaleDropDown setScaleValue={setScaleValue} />
          <div className="border-r border-stroke flex flex-row">
            <ColorActionBtn colorAction={ColorActionType.colorFill} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
            <ColorActionBtn colorAction={ColorActionType.borderColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
            <ColorActionBtn colorAction={ColorActionType.textColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
            <ClearFormatBtn setColorAction={setColorAction} />          
          </div>
          <div className="border-r border-stroke flex flex-row">
            <UniformWidthBtn setUniformWidth={setUniformWidth}/>
            <IndentBtn leftIndent={true} />
            <IndentBtn leftIndent={false} />
          </div>
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
