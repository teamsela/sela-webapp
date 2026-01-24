import { useContext, useState } from "react";

import { UndoBtn, RedoBtn, ColorActionBtn, ClearFormatBtn, 
  IndentBtn, UniformWidthBtn, StructureUpdateBtn, StudyBtn, 
  ClearAllFormatBtn, EditWordBtn, BoxlessBtn,
  StropheNoteBtn} from "./Buttons";
import ScaleDropDown from "./ScaleDropDown";
import { FormatContext } from '../index';
import { ColorActionType, StructureUpdateType, BoxDisplayConfig, LanguageMode } from "@/lib/types";
import { StudyData } from '@/lib/data';

import LanguageSwitcher from "../Header/LanguageSwitcher";
import ButtonInfoModal, { InfoModalSection } from "@/components/Modals/Toolbar/ButtonInfoModal";

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
  setBoxStyle: (arg: BoxDisplayConfig) => void,
  setCloneStudyOpen: (arg: boolean) => void;
}) => {

  const { ctxInViewMode, ctxLanguageMode } = useContext(FormatContext);
  const [activeInfoSection, setActiveInfoSection] = useState<InfoModalSection | null>(null);

  const isHebrew = (ctxLanguageMode == LanguageMode.Hebrew);

  /* TODO: may need to refactor this part after more features are added to view mode*/
  return (
    <div className="mx-auto px-6 py-2 bg-white w-full hbFontExemption">

      { // only show zoom in/out & uniform width buttons in view only mode
        ctxInViewMode ?
          (
            <div className="flex flex-row space-x-4">
              <div className="flex h-8 basis-1/3 items-center justify-left">
                <ScaleDropDown setScaleValue={setScaleValue} />
                <UniformWidthBtn setBoxStyle={setBoxStyle} />
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
        : (
            <div className="flex justify-between">
              <div className="flex">
                <div className="border-r border-stroke flex flex-col items-center pt-2 px-2">
                  <div className="flex flex-row">
                    <ScaleDropDown setScaleValue={setScaleValue} />
                  </div>
                </div>
                <div className="border-r border-stroke flex flex-col items-center pt-3 px-2">
                  <div className="flex flex-row">
                    <UndoBtn />
                    <RedoBtn />
                  </div>
                </div>
                <div className="border-r border-stroke flex flex-col items-center px-2">
                  <ButtonInfoModal
                    section="Format"
                    activeSection={activeInfoSection}
                    setActiveSection={setActiveInfoSection}
                  />
                  <div className="flex flex-row">
                    <ColorActionBtn colorAction={ColorActionType.colorFill} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
                    <ColorActionBtn colorAction={ColorActionType.borderColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
                    <ColorActionBtn colorAction={ColorActionType.textColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
                    <ClearFormatBtn setColorAction={setColorAction} />
                    <ClearAllFormatBtn setColorAction={setColorAction} />
                  </div>
                </div>
                <div className="border-r border-stroke flex flex-col items-center px-2">
                  <ButtonInfoModal
                    section="Word"
                    activeSection={activeInfoSection}
                    setActiveSection={setActiveInfoSection}
                  />
                  <div className="flex flex-row">
                    <BoxlessBtn setBoxStyle={setBoxStyle}/>
                    <UniformWidthBtn setBoxStyle={setBoxStyle} />
                    <IndentBtn leftIndent={true} />
                    <IndentBtn leftIndent={false} />
                    <EditWordBtn />
                  </div>
                </div>
                <div className="border-r border-stroke flex flex-col items-center px-2">
                  <ButtonInfoModal
                    section="Line"
                    activeSection={activeInfoSection}
                    setActiveSection={setActiveInfoSection}
                  />
                  <div className="flex flex-row">
                    <StructureUpdateBtn updateType={StructureUpdateType.newLine} toolTip="New line" />
                    <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevLine} toolTip="Merge with previous line" />
                    <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextLine} toolTip="Merge with next line" />
                  </div>
                </div>
                <div className="border-r border-stroke flex flex-col items-center px-2">
                  <ButtonInfoModal
                    section="Strophe"
                    activeSection={activeInfoSection}
                    setActiveSection={setActiveInfoSection}
                  />
                  <div className="flex flex-row">
                    <StructureUpdateBtn updateType={StructureUpdateType.newStrophe} toolTip="New strophe" />
                    <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevStrophe} toolTip="Merge with previous strophe" />
                    <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextStrophe} toolTip="Merge with next strophe" />
                  </div>
                </div>
                <div className="border-r border-stroke flex flex-col items-center px-2">
                  <ButtonInfoModal
                    section="Stanza"
                    activeSection={activeInfoSection}
                    setActiveSection={setActiveInfoSection}
                  />
                  <div className="flex flex-row">
                    <StructureUpdateBtn updateType={StructureUpdateType.newStanza} toolTip="New stanza" />
                    <StructureUpdateBtn updateType={isHebrew ? StructureUpdateType.mergeWithNextStanza : StructureUpdateType.mergeWithPrevStanza} toolTip={isHebrew ? "Merge with next stanza" : "Merge with previous stanza"} />
                    <StructureUpdateBtn updateType={isHebrew ? StructureUpdateType.mergeWithPrevStanza : StructureUpdateType.mergeWithNextStanza} toolTip={isHebrew ? "Merge with previous stanza" : "Merge with next stanza"} />
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-center">
                <StropheNoteBtn />
                <LanguageSwitcher />
              </div>
            </div>
            )
      }
    </div>
  );
};


export default Toolbar;
