import { useContext } from "react";

import { UndoBtn, RedoBtn, ColorActionBtn, ClearFormatBtn, 
  IndentBtn, UniformWidthBtn, StructureUpdateBtn, StudyBtn, 
  ClearAllFormatBtn} from "./Buttons";
import ScaleDropDown from "./ScaleDropDown";
import { FormatContext } from '../index';
import { ColorActionType, StructureUpdateType, BoxDisplayStyle } from "@/lib/types";
import { StudyData } from '@/lib/data';

const Toolbar = ({
  study,
  setScaleValue,
  //color functions
  setColorAction,
  setSelectedColor,
  setBoxStyle,
  setCloneStudyOpen
}: {
  study: StudyData;
  setScaleValue: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setSelectedColor: (arg: string) => void;
  setBoxStyle: (arg: BoxDisplayStyle) => void,
  setCloneStudyOpen: (arg: boolean) => void;
} ) => {
  
  const { ctxInViewMode, ctxIsHebrew } = useContext(FormatContext);
 
  /* TODO: may need to refactor this part after more features are added to view mode*/
  return (
      <div className="mx-auto px-6 py-2 bg-white w-full hbFontExemption">

      { // only show zoom in/out & uniform width buttons in view only mode
        ctxInViewMode ? 
          (
            <div className="flex flex-row space-x-4">
              <div className="flex h-8 basis-1/3 items-center justify-left">
                <ScaleDropDown setScaleValue={setScaleValue} />
                <UniformWidthBtn setBoxStyle={setBoxStyle}/>
              </div>
              {
                 (study.model) &&
                 (
                  <div className="flex h-8 basis-2/3 items-center justify-end">
                    <StudyBtn setCloneStudyOpen={setCloneStudyOpen} />
                  </div>
                 )
              }
            </div>
          )
        : (<div className="flex">
          <ScaleDropDown setScaleValue={setScaleValue} />
          <div className="border-r border-stroke flex flex-row">
            <UndoBtn />
            <RedoBtn />
          </div>
          <div className="border-r border-stroke flex flex-row">
            <ColorActionBtn colorAction={ColorActionType.colorFill} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
            <ColorActionBtn colorAction={ColorActionType.borderColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
            <ColorActionBtn colorAction={ColorActionType.textColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor}/>
            <ClearFormatBtn setColorAction={setColorAction} />
            <ClearAllFormatBtn setColorAction={setColorAction}/>
          </div>
          <div className="border-r border-stroke flex flex-row">
            <UniformWidthBtn setBoxStyle={setBoxStyle}/>
            <IndentBtn leftIndent={true} />
            <IndentBtn leftIndent={false} />
          </div>
          <div className="border-r border-stroke flex flex-row">
            <StructureUpdateBtn updateType={StructureUpdateType.newLine} toolTip="New line" />
            <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevLine} toolTip="Merge with previous line" />
            <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextLine} toolTip="Merge with next line" />
          </div>
          <div className="border-r px-3 border-stroke flex flex-row">
            <StructureUpdateBtn updateType={StructureUpdateType.newStrophe} toolTip="New strophe" />
            <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevStrophe} toolTip="Merge with previous strophe" />
            <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextStrophe} toolTip="Merge with next strophe" />
          </div>
          <div className="border-r px-3 border-stroke flex flex-row">
            <StructureUpdateBtn updateType={StructureUpdateType.newStanza} toolTip="New stanza" />
            <StructureUpdateBtn updateType={ctxIsHebrew ? StructureUpdateType.mergeWithNextStanza : StructureUpdateType.mergeWithPrevStanza} toolTip={ctxIsHebrew ? "Merge with next stanza" : "Merge with previous stanza"} />
            <StructureUpdateBtn updateType={ctxIsHebrew ? StructureUpdateType.mergeWithPrevStanza : StructureUpdateType.mergeWithNextStanza} toolTip={ctxIsHebrew ? "Merge with previous stanza" : "Merge with next stanza"} />
          </div>
        </div>)
      }
    </div>
  );
};


export default Toolbar;
