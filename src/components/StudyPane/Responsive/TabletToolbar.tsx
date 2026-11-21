"use client";

import { useContext, useState } from "react";

import type { StudyData } from "@/lib/data";
import { BoxDisplayConfig, ColorActionType, LanguageMode, StructureUpdateType } from "@/lib/types";
import ButtonInfoModal, { InfoModalSection } from "@/components/Modals/Toolbar/ButtonInfoModal";
import { FormatContext } from "../index";
import LanguageSwitcher from "../Header/LanguageSwitcher";
import ScaleDropDown from "../Toolbar/ScaleDropDown";
import Toolbar from "../Toolbar";
import {
  BoxlessBtn,
  ClearAllFormatBtn,
  ClearFormatBtn,
  CloneStudyBtn,
  ColorActionBtn,
  EditWordBtn,
  IndentBtn,
  ReadmeBtn,
  RedoBtn,
  StropheNoteBtn,
  StructureUpdateBtn,
  UndoBtn,
  UniformWidthBtn,
} from "../Toolbar/Buttons";
import { ToolbarVariantContext } from "./layout";

/*
  The tablet toolbar: a ribbon. The desktop toolbar shows every button in
  one row of icons, which doesn't fit under about 1280px and relies on hover
  tooltips that touch screens don't have. The ribbon shows one group's
  buttons at a time, each with its name under it: Undo/Redo, the group tabs,
  the chosen group's buttons, then the view controls. It wraps onto a second
  row on narrow tablets.
*/

const GROUPS: InfoModalSection[] = ["Format", "Word", "Line", "Strophe", "Stanza"];

export const TabletToolbar = ({
  study,
  setScaleValue,
  setColorAction,
  setSelectedColor,
  setBoxStyle,
  setCloneStudyOpen,
}: {
  study: StudyData;
  setScaleValue: (arg: number) => void;
  setColorAction: (arg: number) => void;
  setSelectedColor: (arg: string) => void;
  setBoxStyle: (arg: BoxDisplayConfig) => void;
  setCloneStudyOpen: (arg: boolean) => void;
}) => {
  const { ctxInViewMode, ctxLanguageMode, ctxPracticeMode } = useContext(FormatContext);
  const [group, setGroup] = useState<InfoModalSection>("Format");
  const [infoSection, setInfoSection] = useState<InfoModalSection | null>(null);
  const isHebrew = ctxLanguageMode == LanguageMode.Hebrew;

  // Read-only studies only have the view controls, which already fit.
  if (ctxInViewMode) {
    return (
      <Toolbar
        study={study}
        setScaleValue={setScaleValue}
        setColorAction={setColorAction}
        setSelectedColor={setSelectedColor}
        setBoxStyle={setBoxStyle}
        setCloneStudyOpen={setCloneStudyOpen}
      />
    );
  }

  return (
    <div role="toolbar" aria-label="Edit" className="hbFontExemption flex w-full flex-wrap items-center gap-x-3 gap-y-2 bg-white px-3 py-2">
      <ToolbarVariantContext.Provider value={{ variant: "ribbon" }}>
        <div className="flex items-center">
          <UndoBtn />
          <RedoBtn />
        </div>

        <div role="tablist" aria-label="Tool group" className="flex rounded-lg bg-whiten p-1">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              // The tutorial lights the group to open (lib/tutorials/tour.ts forLayout).
              data-tour={`ribbon-${g}`}
              aria-selected={group === g}
              onClick={() => {
                setGroup(g);
                setColorAction(ColorActionType.none);
              }}
              className={`h-10 rounded-md px-3 text-sm font-semibold ${group === g ? "bg-white text-primary shadow-sm" : "text-body"}`}
            >
              {g}
            </button>
          ))}
        </div>

        <div role="group" aria-label={`${group} actions`} className="flex flex-1 flex-wrap items-start">
          {group === "Format" && (
            <>
              <ColorActionBtn colorAction={ColorActionType.colorFill} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
              <ColorActionBtn colorAction={ColorActionType.borderColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
              <ColorActionBtn colorAction={ColorActionType.textColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
              <ClearFormatBtn setColorAction={setColorAction} />
              <ClearAllFormatBtn setColorAction={setColorAction} />
            </>
          )}
          {group === "Word" && (
            <>
              <BoxlessBtn setBoxStyle={setBoxStyle} />
              <UniformWidthBtn setBoxStyle={setBoxStyle} />
              <IndentBtn leftIndent={true} />
              <IndentBtn leftIndent={false} />
              <EditWordBtn />
            </>
          )}
          {group === "Line" && (
            <>
              <StructureUpdateBtn updateType={StructureUpdateType.newLine} toolTip="New line" />
              <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevLine} toolTip="Merge with previous line" />
              <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextLine} toolTip="Merge with next line" />
            </>
          )}
          {group === "Strophe" && (
            <>
              <StructureUpdateBtn updateType={StructureUpdateType.newStrophe} toolTip="New strophe" />
              <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevStrophe} toolTip="Merge with previous strophe" />
              <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextStrophe} toolTip="Merge with next strophe" />
            </>
          )}
          {group === "Stanza" && (
            <>
              <StructureUpdateBtn updateType={StructureUpdateType.newStanza} toolTip="New stanza" />
              <StructureUpdateBtn
                updateType={isHebrew ? StructureUpdateType.mergeWithNextStanza : StructureUpdateType.mergeWithPrevStanza}
                toolTip={isHebrew ? "Merge with next stanza" : "Merge with previous stanza"}
              />
              <StructureUpdateBtn
                updateType={isHebrew ? StructureUpdateType.mergeWithPrevStanza : StructureUpdateType.mergeWithNextStanza}
                toolTip={isHebrew ? "Merge with previous stanza" : "Merge with next stanza"}
              />
            </>
          )}
          <div className="ml-1 w-16 self-center">
            <ButtonInfoModal section={group} activeSection={infoSection} setActiveSection={setInfoSection} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ReadmeBtn />
          <StropheNoteBtn />
          <ScaleDropDown setScaleValue={setScaleValue} />
          <LanguageSwitcher />
          {ctxPracticeMode && (
            <div className="ml-2">
              <CloneStudyBtn setCloneStudyOpen={setCloneStudyOpen} />
            </div>
          )}
        </div>
      </ToolbarVariantContext.Provider>
    </div>
  );
};

export default TabletToolbar;
