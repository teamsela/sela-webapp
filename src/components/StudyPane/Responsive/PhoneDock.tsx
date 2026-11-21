"use client";

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  LuAlignLeft,
  LuAudioLines,
  LuInfo,
  LuLayers,
  LuMaximize2,
  LuMinimize2,
  LuNetwork,
  LuPaintBucket,
  LuShapes,
  LuType,
  LuX,
} from "react-icons/lu";

import type { WordProps } from "@/lib/data";
import { ColorActionType, InfoPaneActionType, StructureUpdateType } from "@/lib/types";
import { FormatContext } from "../index";
import InfoPane from "../InfoPane";
import WordAnalysisModal from "../Footer/WordAnalysisModal";
import {
  ClearAllFormatBtn,
  ClearFormatBtn,
  ColorActionBtn,
  EditWordBtn,
  IndentBtn,
  StructureUpdateBtn,
} from "../Toolbar/Buttons";
import { StructureIcon } from "../Toolbar/ToolbarIcons";
import { SwatchSlotContext, ToolbarVariantContext, useLayout } from "./layout";

/*
  The bottom of the phone screen.

  - Nothing selected: a tab bar for the tools (Layers, Structure, Motif,
    Syntax, Sounds). A tool opens as a sheet just above the tab bar, so the
    words it selects stay visible above the sheet. The tab bar stays the
    only set of tool tabs.
  - Words or a strophe selected: a selection bar with the toolbar's groups
    (Color, Word, Line, Strophe, Stanza, Info). A group opens a small menu of
    the same buttons as on desktop, drawn as labelled rows that say why an
    action can't be used.
  - Color and Word information open as sheets over the bottom of the screen.

  On a phone half-folded like a laptop ("tabletop"), the tools sheet fills
  the lower half of the screen, below the fold.
*/

type Tray = "word" | "line" | "strophe" | "stanza";

const TABS: { action: InfoPaneActionType; label: string; Icon: typeof LuLayers }[] = [
  { action: InfoPaneActionType.layers, label: "Layers", Icon: LuLayers },
  { action: InfoPaneActionType.structure, label: "Structure", Icon: LuAlignLeft },
  { action: InfoPaneActionType.motif, label: "Motif", Icon: LuShapes },
  { action: InfoPaneActionType.syntax, label: "Syntax", Icon: LuNetwork },
  { action: InfoPaneActionType.sounds, label: "Sounds", Icon: LuAudioLines },
];

const TRAY_TITLES: Record<Tray, string> = { word: "Word", line: "Line", strophe: "Strophe", stanza: "Stanza" };

const allWordsOf = (passage: { stanzaProps: { strophes: { lines: { words: WordProps[] }[] }[] }[] }) =>
  passage.stanzaProps.flatMap((st) => st.strophes.flatMap((sp) => sp.lines.flatMap((l) => l.words)));

const useHeight = (onHeight?: (h: number) => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onHeight) return;
    const report = () => onHeight(el.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeight]);
  return ref;
};

const SheetChrome = ({
  title,
  children,
  onClose,
  closeLabel = "Done",
  style,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
  style?: React.CSSProperties;
}) => (
  <section
    aria-label={typeof title === "string" ? title : undefined}
    className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-[0_-12px_32px_rgba(15,23,42,0.2)]"
    style={{ paddingBottom: "env(safe-area-inset-bottom)", ...style }}
  >
    <div className="flex h-4 shrink-0 justify-center pt-2">
      <span className="h-1.5 w-10 rounded-full bg-bodydark" />
    </div>
    <div className="flex h-12 shrink-0 items-center gap-2 px-4">
      <h2 className="min-w-0 flex-1 truncate text-base font-bold text-black">{title}</h2>
      <button type="button" onClick={onClose} className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-white">
        {closeLabel}
      </button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">{children}</div>
  </section>
);

export const PhoneDock = ({
  infoPaneAction,
  setInfoPaneAction,
  infoPaneWidth,
  setInfoPaneWidth,
  setColorAction,
  setSelectedColor,
  headerHeight,
  onHeight,
}: {
  infoPaneAction: InfoPaneActionType;
  setInfoPaneAction: (action: InfoPaneActionType) => void;
  infoPaneWidth: number;
  setInfoPaneWidth: (width: number) => void;
  setColorAction: (action: number) => void;
  setSelectedColor: (color: string) => void;
  headerHeight: number;
  onHeight: (height: number) => void;
}) => {
  const {
    ctxInViewMode,
    ctxSelectedWords,
    ctxNumSelectedWords,
    ctxNumSelectedStrophes,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxSetNumSelectedStrophes,
    ctxPassageProps,
  } = useContext(FormatContext);
  const { fold } = useLayout();
  const [tray, setTray] = useState<Tray | null>(null);
  const [sheet, setSheet] = useState<"color" | "info" | null>(null);
  const [full, setFull] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [swatchSlot, setSwatchSlot] = useState<HTMLDivElement | null>(null);
  const [dockHeight, setDockHeight] = useState(76);

  const reportHeight = useCallback(
    (h: number) => {
      setDockHeight(h);
      onHeight(h);
    },
    [onHeight],
  );
  const dockRef = useHeight(reportHeight);

  const hasSelection = ctxNumSelectedWords > 0 || ctxNumSelectedStrophes > 0;
  const toolsOpen = infoPaneAction !== InfoPaneActionType.none;
  // One bar at the bottom, one rule: with words selected it is the selection
  // bar (with every action), whether or not a tool is open; the tool's panel
  // stays open above it. Done brings the tool tabs back.
  const showSelectionBar = hasSelection && !ctxInViewMode;
  const selectionLabel =
    ctxNumSelectedWords > 0
      ? ctxNumSelectedWords === 1
        ? "1 word selected"
        : `${ctxNumSelectedWords} words selected`
      : ctxNumSelectedStrophes === 1
        ? "Strophe selected"
        : `${ctxNumSelectedStrophes} strophes selected`;

  const closeColor = useCallback(() => {
    setSheet((s) => (s === "color" ? null : s));
    setColorAction(ColorActionType.none);
    setSelectedColor("");
  }, [setColorAction, setSelectedColor]);

  // Menus and the color sheet belong to a selection: close them with it.
  useEffect(() => {
    if (!hasSelection) {
      setTray(null);
      closeColor();
    }
  }, [hasSelection, closeColor]);

  const clearSelection = () => {
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    ctxSetSelectedStrophes([]);
    ctxSetNumSelectedStrophes(0);
    setTray(null);
  };

  const allWords = useMemo(() => allWordsOf(ctxPassageProps), [ctxPassageProps]);
  const firstSelected = useMemo(
    () => [...ctxSelectedWords].sort((a: WordProps, b: WordProps) => a.wordId - b.wordId)[0] as WordProps | undefined,
    [ctxSelectedWords],
  );
  const selectRepeats = () => {
    if (!firstSelected) return;
    const repeats = allWords.filter((w) => w.strongNumber === firstSelected.strongNumber);
    ctxSetSelectedWords(repeats);
    ctxSetNumSelectedWords(repeats.length);
    ctxSetSelectedStrophes([]);
    ctxSetNumSelectedStrophes(0);
    setTray(null);
  };

  const openTool = (action: InfoPaneActionType) => {
    setTray(null);
    setSheet(null);
    setInfoPaneAction(infoPaneAction === action ? InfoPaneActionType.none : action);
  };

  const openColor = () => {
    setTray(null);
    setInfoPaneAction(InfoPaneActionType.none);
    setSheet("color");
    setColorAction(ColorActionType.colorFill);
    setSelectedColor("");
  };

  const toolsTitle = TABS.find((t) => t.action === infoPaneAction)?.label ?? "";
  const toolsHeight = full
    ? `calc(100dvh - ${headerHeight}px - ${dockHeight}px - 8px)`
    : fold === "tabletop"
      ? `calc(env(viewport-segment-height 0 1, 50dvh) - ${dockHeight}px)`
      : showSelectionBar
        ? "40dvh" // the selection bar is taller than the tabs: keep the passage in view
        : "50dvh";

  const groupButton = "flex flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-semibold";
  // The floating pill: light grey, a hairline white edge and a soft shadow.
  const floatingBar = "pointer-events-auto border border-white bg-whiten/95 shadow-[0_8px_28px_rgba(28,36,52,0.16)] backdrop-blur";

  const activeWord = ctxSelectedWords.length ? (ctxSelectedWords[ctxSelectedWords.length - 1] as WordProps) : undefined;
  const info = activeWord?.wordInformation;

  return (
    <SwatchSlotContext.Provider value={swatchSlot}>
      {/* Tools sheet: just above the tab bar */}
      {toolsOpen && (
        <section
          aria-label={toolsTitle}
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-white shadow-[0_-12px_32px_rgba(15,23,42,0.18)]"
          style={{ height: `calc(${toolsHeight} + ${dockHeight}px)`, paddingBottom: dockHeight }}
        >
          <button
            type="button"
            aria-label={full ? "Shrink the tools to half height" : "Expand the tools to full height"}
            onClick={() => setFull((f) => !f)}
            className="flex h-5 shrink-0 items-center justify-center"
          >
            <span className="h-1.5 w-10 rounded-full bg-bodydark" />
          </button>
          <div className="flex h-11 shrink-0 items-center gap-1 border-b border-stroke pl-4 pr-2">
            <h2 className="min-w-0 flex-1 truncate text-[17px] font-bold text-black">{toolsTitle}</h2>
            <button
              type="button"
              aria-label={full ? "Shrink the tools" : "Expand the tools"}
              onClick={() => setFull((f) => !f)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-body"
            >
              {full ? <LuMinimize2 size={18} /> : <LuMaximize2 size={18} />}
            </button>
            <button
              type="button"
              aria-label="Close tools"
              onClick={() => setInfoPaneAction(InfoPaneActionType.none)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-whiten text-black"
            >
              <LuX size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <InfoPane
              variant="sheet"
              infoPaneAction={infoPaneAction}
              setInfoPaneAction={setInfoPaneAction}
              infoPaneWidth={infoPaneWidth}
              setInfoPaneWidth={setInfoPaneWidth}
            />
          </div>
        </section>
      )}

      {/* A group's menu, above the selection bar */}
      {showSelectionBar && tray && (
        <div
          role="menu"
          aria-label={TRAY_TITLES[tray]}
          className="fixed inset-x-2 z-50 rounded-2xl border border-stroke bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
          style={{ bottom: dockHeight + 8 }}
        >
          <div className="flex h-9 items-center pl-3 pr-1">
            <span className="flex-1 text-xs font-bold uppercase tracking-wider text-body">{TRAY_TITLES[tray]}</span>
            <button type="button" aria-label="Close" onClick={() => setTray(null)} className="flex h-9 w-9 items-center justify-center rounded-lg text-body">
              <LuX size={18} />
            </button>
          </div>
          <ToolbarVariantContext.Provider value={{ variant: "row", onAction: () => setTray(null) }}>
            {tray === "word" && (
              <>
                <button
                  type="button"
                  onClick={selectRepeats}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left active:bg-whiten"
                >
                  <span className="flex w-7 justify-center"><LuShapes size={20} /></span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold">Select repeats</span>
                    <span className="text-xs text-body">Every place this Hebrew word appears.</span>
                  </span>
                </button>
                <IndentBtn leftIndent={true} />
                <IndentBtn leftIndent={false} />
                <EditWordBtn />
              </>
            )}
            {tray === "line" && (
              <>
                <StructureUpdateBtn updateType={StructureUpdateType.newLine} toolTip="New line" />
                <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevLine} toolTip="Merge with previous line" />
                <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextLine} toolTip="Merge with next line" />
              </>
            )}
            {tray === "strophe" && (
              <>
                <StructureUpdateBtn updateType={StructureUpdateType.newStrophe} toolTip="New strophe" />
                <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevStrophe} toolTip="Merge with previous strophe" />
                <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextStrophe} toolTip="Merge with next strophe" />
              </>
            )}
            {tray === "stanza" && (
              <>
                <StructureUpdateBtn updateType={StructureUpdateType.newStanza} toolTip="New stanza" />
                <StructureUpdateBtn updateType={StructureUpdateType.mergeWithPrevStanza} toolTip="Merge with previous stanza" />
                <StructureUpdateBtn updateType={StructureUpdateType.mergeWithNextStanza} toolTip="Merge with next stanza" />
              </>
            )}
          </ToolbarVariantContext.Provider>
        </div>
      )}

      {/* The bar at the bottom, floating: selection bar or tool tabs */}
      <div
        ref={dockRef}
        data-bottom-bar
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        {showSelectionBar ? (
          <div role="toolbar" aria-label="Edit the selection" className={`${floatingBar} rounded-[28px] p-1.5`}>
            <div className="flex h-10 items-center gap-2 pl-3 pr-0.5">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-black">{selectionLabel}</span>
              {ctxNumSelectedWords > 0 && (
                <button type="button" onClick={selectRepeats} className="h-9 rounded-lg px-2 text-sm font-semibold text-primary">
                  Select repeats
                </button>
              )}
              <button type="button" onClick={clearSelection} className="h-9 rounded-full bg-white px-4 text-sm font-semibold text-black shadow-sm">
                Done
              </button>
            </div>
            <div className="grid h-[60px] grid-cols-6 gap-0.5">
              <button type="button" onClick={openColor} className={`${groupButton} text-black`}>
                <LuPaintBucket size={21} />
                Color
              </button>
              {(["word", "line", "strophe", "stanza"] as Tray[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-expanded={tray === t}
                  onClick={() => setTray(tray === t ? null : t)}
                  className={`${groupButton} ${tray === t ? "bg-stroke" : ""} text-black`}
                >
                  {t === "word" ? <LuType size={21} /> : <StructureIcon level={t} action="new" size={21} />}
                  {TRAY_TITLES[t]}
                </button>
              ))}
              <button type="button" onClick={() => { setTray(null); setSheet("info"); }} className={`${groupButton} text-black`}>
                <LuInfo size={21} />
                Info
              </button>
            </div>
          </div>
        ) : (
          <nav aria-label="Study tools" className={`${floatingBar} grid h-[68px] grid-cols-5 rounded-full p-1.5`}>
            {TABS.map(({ action, label, Icon }) => {
              const on = infoPaneAction === action;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => openTool(action)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold text-black transition-colors ${on ? "bg-stroke" : ""}`}
                >
                  <Icon size={21} />
                  {label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {sheet === "color" && (
        <SheetChrome title={`Color · ${selectionLabel}`} onClose={closeColor}>
          <ToolbarVariantContext.Provider value={{ variant: "row" }}>
            <ColorActionBtn colorAction={ColorActionType.colorFill} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
            <ColorActionBtn colorAction={ColorActionType.borderColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
            <ColorActionBtn colorAction={ColorActionType.textColor} setColorAction={setColorAction} setSelectedColor={setSelectedColor} />
            <div ref={setSwatchSlot} className="px-2" />
            <div className="mx-2 my-1 h-px bg-stroke" />
            <ClearFormatBtn setColorAction={setColorAction} />
            <ClearAllFormatBtn setColorAction={setColorAction} />
          </ToolbarVariantContext.Provider>
        </SheetChrome>
      )}

      {sheet === "info" && (
        <SheetChrome title="Word information" onClose={() => setSheet(null)} closeLabel="Close">
          {info ? (
            <div className="flex flex-col gap-3 px-2">
              <div className="flex items-end justify-between gap-3 border-b border-stroke pb-3">
                <div className="min-w-0">
                  <div className="text-xl font-bold text-black">{info.gloss || activeWord?.gloss}</div>
                  {info.transliteration && <div className="text-sm text-body">{info.transliteration}</div>}
                </div>
                {info.hebrew && (
                  <span lang="he" dir="rtl" className="hbFont text-3xl text-black">
                    {info.hebrew}
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                {(info.morphology || activeWord?.morphology) && (
                  <>
                    <dt className="text-body">Morphology</dt>
                    <dd className="font-semibold text-black">{info.morphology || activeWord?.morphology}</dd>
                  </>
                )}
                {info.strongsNumber && (
                  <>
                    <dt className="text-body">Strong&rsquo;s</dt>
                    <dd className="font-semibold text-black">{info.strongsNumber}</dd>
                  </>
                )}
              </dl>
              {info.meaning && (
                <button type="button" onClick={() => setAnalysisOpen(true)} className="h-11 rounded-xl border border-stroke text-sm font-semibold text-black">
                  Full word analysis
                </button>
              )}
            </div>
          ) : (
            <p className="px-3 text-sm italic text-body">
              {activeWord ? "No additional word information is available for this selection." : "Select a word to view detailed information."}
            </p>
          )}
        </SheetChrome>
      )}

      <WordAnalysisModal open={analysisOpen && !!info} onClose={() => setAnalysisOpen(false)} wordInformation={info} />
    </SwatchSlotContext.Provider>
  );
};

export default PhoneDock;
