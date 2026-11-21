"use client";

import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuChevronLeft, LuEllipsis } from "react-icons/lu";

import type { StudyData } from "@/lib/data";
import { BoxDisplayConfig, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { updateMetadataInDb } from "@/lib/studyPersistence";
import { FormatContext } from "../index";
import ScaleDropDown from "../Toolbar/ScaleDropDown";
import { BoxlessBtn, RedoBtn, UndoBtn, UniformWidthBtn } from "../Toolbar/Buttons";
import CopyrightLinks from "@/components/Footer/CopyrightLinks";

/*
  The phone's header.

  Top row: back, the passage and study name, undo/redo, and a "more" menu.
  Second row: the language switch (A, English + Hebrew, Hebrew) and the two
  word-box toggles (Boxes, Uniform width), each shown once.
  The menu: how Hebrew is shown (script or transliteration), the Hebrew
  reader view, text size, Copy to My Studies where allowed, and the
  copyright notices (the desktop footer's links, which phones don't show).

  "Notes beside strophes" is left out on phones: there is no room beside a
  strophe, so it would only show the note. Each strophe's own note button
  still opens its note in place.
*/

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const Switch = ({ on }: { on: boolean }) => (
  <span aria-hidden="true" className={`flex h-6 w-10 shrink-0 rounded-full p-0.5 transition-colors ${on ? "justify-end bg-primary" : "justify-start bg-bodydark"}`}>
    <span className="h-5 w-5 rounded-full bg-white shadow" />
  </span>
);

const Segmented = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string; ariaLabel?: string; lang?: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) => (
  <div role="radiogroup" aria-label={label} className={`flex rounded-lg bg-whiten p-[3px] ${disabled ? "opacity-50" : ""}`}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={on}
          aria-label={o.ariaLabel}
          lang={o.lang}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`h-10 min-w-[44px] rounded-md px-3 text-[15px] font-semibold ${on ? "bg-white text-primary shadow" : "text-body"}`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
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
    ctxStudyId,
    ctxStudyMetadata,
    ctxInViewMode,
    ctxPracticeMode,
    ctxLanguageMode,
    ctxSetLanguageMode,
    ctxNonEnglishDisplayMode,
    ctxSetNonEnglishDisplayMode,
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

  // Notes beside every strophe don't fit on a phone (see above).
  useEffect(() => {
    if (ctxStropheNoteBtnOn) ctxSetStropheNoteBtnOn(false);
  }, [ctxStropheNoteBtnOn, ctxSetStropheNoteBtnOn]);

  const setLanguage = (mode: LanguageMode) => {
    if (mode === ctxLanguageMode) return;
    ctxStudyMetadata.lang = mode;
    if (!ctxInViewMode) updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    ctxSetLanguageMode(mode);
  };
  const setHebrewDisplay = (mode: NonEnglishDisplayMode) => {
    if (mode === ctxNonEnglishDisplayMode) return;
    ctxStudyMetadata.nonEnglishDisplayMode = mode;
    if (!ctxInViewMode) updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    ctxSetNonEnglishDisplayMode(mode);
  };

  const canCopy = ctxPracticeMode || (ctxInViewMode && (study.model || study.scriptura || study.tutorial));
  const hebrewShown = ctxLanguageMode !== LanguageMode.English;

  return (
    <header
      ref={ref}
      id="selaHeader"
      className="fixed inset-x-0 top-0 z-50 border-b border-stroke bg-white"
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
          <div className="truncate text-xs leading-4 text-body">{study.name}</div>
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

      <div className="flex h-[56px] items-center gap-2 border-t border-stroke px-2">
        <Segmented
          label="Language"
          value={ctxLanguageMode}
          onChange={setLanguage}
          options={[
            { value: LanguageMode.English, label: "A", ariaLabel: "English gloss" },
            { value: LanguageMode.Parallel, label: "Aא", ariaLabel: "English and Hebrew" },
            { value: LanguageMode.Hebrew, label: "א", ariaLabel: "Hebrew", lang: "he" },
          ]}
        />
        <div className="ml-auto flex items-center">
          {!ctxInViewMode && <BoxlessBtn setBoxStyle={setBoxStyle} />}
          <UniformWidthBtn setBoxStyle={setBoxStyle} />
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
          <div role="menu" aria-label="More options" className="absolute right-2 top-14 z-50 max-h-[calc(100dvh-72px)] w-[296px] overflow-y-auto rounded-2xl border border-stroke bg-white p-2 shadow-xl">
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-body">View</p>

            <div className="flex min-h-[56px] items-center justify-between gap-2 px-3">
              <span className="flex flex-col text-[15px] text-black">
                Show Hebrew as
                {!hebrewShown && <span className="text-xs text-body">Used in the {"א"} and A{"א"} views</span>}
              </span>
              <Segmented
                label="Show Hebrew as"
                value={ctxNonEnglishDisplayMode}
                onChange={setHebrewDisplay}
                disabled={!hebrewShown}
                options={[
                  { value: NonEnglishDisplayMode.Hebrew, label: "אב", ariaLabel: "Hebrew script", lang: "he" },
                  { value: NonEnglishDisplayMode.HebrewTransliteration, label: "Abc", ariaLabel: "Transliteration" },
                ]}
              />
            </div>

            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={ctxReadmeBtnOn}
              onClick={() => ctxSetReadmeBtnOn(!ctxReadmeBtnOn)}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-black active:bg-whiten"
            >
              <span className="flex-1">Hebrew reader view</span>
              <Switch on={ctxReadmeBtnOn} />
            </button>

            <div className="flex min-h-[52px] items-center justify-between px-3 text-[15px] text-black">
              <span>Text size</span>
              <ScaleDropDown setScaleValue={setScaleValue} />
            </div>

            {canCopy && (
              <>
                <div className="mx-2 my-1 h-px bg-stroke" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setCloneStudyOpen(true);
                  }}
                  className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-[15px] text-black active:bg-whiten"
                >
                  Copy to My Studies
                </button>
              </>
            )}

            <div className="mx-2 my-1 h-px bg-stroke" />
            <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-wider text-body">Copyright information</p>
            <CopyrightLinks chips className="px-3 pb-2" />
          </div>
        </>
      )}
    </header>
  );
};

export default PhoneHeader;
