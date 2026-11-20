"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuChevronLeft, LuEllipsis, LuNotebookPen } from "react-icons/lu";

import type { StudyData } from "@/lib/data";
import { BoxDisplayConfig, LanguageMode } from "@/lib/types";
import { FormatContext } from "../index";
import LanguageSwitcher from "../Header/LanguageSwitcher";
import ScaleDropDown from "../Toolbar/ScaleDropDown";
import { BoxlessBtn, RedoBtn, UndoBtn, UniformWidthBtn } from "../Toolbar/Buttons";
import { ToolbarVariantContext } from "./layout";

/*
  The phone's header: back, the passage and study name, undo/redo and a
  "more" menu on top; the language switch, word boxes and notes on a second
  row. Everything the desktop toolbar's view controls do is in the menu.
*/

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const MenuToggle = ({ label, on, onToggle, reason }: { label: string; on: boolean; onToggle: () => void; reason?: string }) => (
  <button
    type="button"
    role="menuitemcheckbox"
    aria-checked={on}
    aria-disabled={reason ? true : undefined}
    onClick={() => !reason && onToggle()}
    className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] ${reason ? "cursor-not-allowed text-slate-400" : "active:bg-slate-100"}`}
  >
    <span className="flex min-w-0 flex-1 flex-col">
      <span>{label}</span>
      {reason && <span className="text-xs text-slate-500">{reason}</span>}
    </span>
    <span className={`flex h-6 w-10 shrink-0 rounded-full p-0.5 ${on ? "justify-end bg-primary" : "justify-start bg-slate-300"}`}>
      <span className="h-5 w-5 rounded-full bg-white" />
    </span>
  </button>
);

export const PhoneHeader = ({
  study,
  setScaleValue,
  setBoxStyle,
  setCloneStudyOpen,
  onHeight,
}: {
  study: StudyData;
  setScaleValue: (value: number) => void;
  setBoxStyle: (arg: BoxDisplayConfig) => void;
  setCloneStudyOpen: (open: boolean) => void;
  onHeight: (height: number) => void;
}) => {
  const {
    ctxInViewMode,
    ctxPracticeMode,
    ctxLanguageMode,
    ctxStropheNoteBtnOn,
    ctxSetStropheNoteBtnOn,
    ctxReadmeBtnOn,
    ctxSetReadmeBtnOn,
  } = useContext(FormatContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onHeight(el.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeight]);

  const notesReason = ctxLanguageMode === LanguageMode.Parallel ? "Not available in the English + Hebrew view." : undefined;
  // As on the desktop toolbar: tutorial practice copies, and read-only studies that can be copied.
  const canCopy = ctxPracticeMode || (ctxInViewMode && (study.model || study.scriptura || study.tutorial));

  return (
    <header
      ref={ref}
      id="selaHeader"
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center gap-0.5 px-1">
        <Link href="/" aria-label="Back to my studies" className="flex h-11 w-11 items-center justify-center rounded-lg text-black">
          <LuChevronLeft size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold leading-5 text-black">
            {capitalize(study.book)} {study.passage}
          </div>
          <div className="truncate text-xs leading-4 text-slate-500">{study.name}</div>
        </div>
        {!ctxInViewMode && (
          <div className="flex items-center">
            <UndoBtn />
            <RedoBtn />
          </div>
        )}
        <button
          type="button"
          aria-label="More options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-black"
        >
          <LuEllipsis size={22} />
        </button>
      </div>

      <div className="flex h-[52px] items-center gap-2 border-t border-slate-100 px-2">
        <LanguageSwitcher />
        <div className="ml-auto flex items-center gap-1">
          {!ctxInViewMode && <BoxlessBtn setBoxStyle={setBoxStyle} />}
          <button
            type="button"
            aria-label="Strophe notes"
            aria-pressed={ctxStropheNoteBtnOn}
            aria-disabled={notesReason ? true : undefined}
            title={notesReason}
            onClick={() => !notesReason && ctxSetStropheNoteBtnOn(!ctxStropheNoteBtnOn)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg ${ctxStropheNoteBtnOn ? "bg-primary/10 text-primary" : "text-black"} ${notesReason ? "opacity-40" : ""}`}
          >
            <LuNotebookPen size={20} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default bg-black/10"
            onClick={() => setMenuOpen(false)}
          />
          <div role="menu" aria-label="More options" className="absolute right-2 top-14 z-50 w-[288px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">View</p>
            <ToolbarVariantContext.Provider value={{ variant: "row" }}>
              {!ctxInViewMode && <BoxlessBtn setBoxStyle={setBoxStyle} />}
              <UniformWidthBtn setBoxStyle={setBoxStyle} />
            </ToolbarVariantContext.Provider>
            <MenuToggle label="Notes beside strophes" on={ctxStropheNoteBtnOn} onToggle={() => ctxSetStropheNoteBtnOn(!ctxStropheNoteBtnOn)} reason={notesReason} />
            <MenuToggle label="Hebrew reader view" on={ctxReadmeBtnOn} onToggle={() => ctxSetReadmeBtnOn(!ctxReadmeBtnOn)} />
            <div className="flex min-h-[48px] items-center justify-between px-3 text-[15px]">
              <span>Text size</span>
              <ScaleDropDown setScaleValue={setScaleValue} />
            </div>
            {canCopy && (
              <>
                <div className="mx-2 my-1 h-px bg-slate-200" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setCloneStudyOpen(true);
                  }}
                  className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-[15px] active:bg-slate-100"
                >
                  Copy to My Studies
                </button>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default PhoneHeader;
