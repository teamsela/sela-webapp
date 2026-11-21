import React, { useEffect, useRef, useState, useContext, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { fetchESVTranslation } from "@/lib/actions";
import { LanguageContext } from './PassageBlock';

const EsvPopover = ({
    chapterNumber,
    verseNumber,
    verseNumStyles,
    bookName,
    renderFromBottom = false
  } : {
    chapterNumber: number;
    verseNumber: number;
    verseNumStyles: { className: string }
    bookName: string;
    renderFromBottom?: boolean;
  }) => {

  const { ctxIsHebrew } = useContext(LanguageContext);

  const [popoversOpen, setPopoversOpen] = useState(false);
  const [esvData, setEsvData] = useState("Loading...");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const trigger = useRef<any>(null);
  const popovers = useRef<any>(null);

  const isHebrew = ctxIsHebrew;

  useEffect(() => {
    if (typeof document === "undefined") return;
    setPortalTarget(document.body);
  }, []);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!popovers.current) return;
      if (
        !popoversOpen ||
        popovers.current.contains(target) ||
        trigger.current.contains(target) ||
        // The tutorial's bubble (Continue, Back) isn't a click on the page.
        (target instanceof Element && target.closest("[data-tour-ui]"))
      )
        return;
      setPopoversOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!popoversOpen || keyCode !== 27) return;
      setPopoversOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  // Where the box goes: beside the verse number (above it, or below with
  // renderFromBottom), lined up with whichever edge keeps it over the line,
  // then nudged so the whole box stays on screen. On a phone that means a
  // 12px margin each side, and flipping below the number when it would run
  // under the fixed header (or below it when it would run under the bottom bar).
  useLayoutEffect(() => {
    if (!popoversOpen) return;
    const updatePosition = () => {
      if (!trigger.current || !popovers.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const box = popovers.current as HTMLElement;
      const width = box.offsetWidth;
      const height = box.offsetHeight;
      const lineEl = trigger.current.closest('[data-strophe-line="true"]');
      const lineRect = lineEl?.getBoundingClientRect();
      const triggerCenter = rect.left + rect.width / 2;
      const gap = 4;
      const edge = 12;

      const baseAlign: "left" | "right" = isHebrew ? "right" : "left";
      const lineMidpoint = lineRect ? lineRect.left + lineRect.width / 2 : null;
      const isSecondHalf = lineMidpoint !== null
        ? (isHebrew ? triggerCenter < lineMidpoint : triggerCenter > lineMidpoint)
        : false;
      const align: "left" | "right" = isSecondHalf
        ? (baseAlign === "left" ? "right" : "left")
        : baseAlign;
      const preferredLeft = align === "right" ? rect.right + gap - width : rect.left;
      const left = Math.max(edge, Math.min(preferredLeft, window.innerWidth - width - edge));

      const header = document.getElementById("selaHeader");
      const topLimit = Math.max(edge, header ? header.getBoundingClientRect().bottom + gap : 0);
      const above = rect.top - gap - height;
      const below = rect.bottom + gap;
      // The phone's floating bottom bar (or the window's bottom edge).
      const bottomBar = document.querySelector("[data-bottom-bar]");
      const bottomLimit = (bottomBar ? bottomBar.getBoundingClientRect().top : window.innerHeight) - gap;
      const fitsAbove = above >= topLimit;
      const fitsBelow = below + height <= bottomLimit;
      const top = renderFromBottom
        ? (fitsBelow || !fitsAbove ? below : above)
        : (fitsAbove || !fitsBelow ? above : below);

      setPopoverPosition({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [popoversOpen, renderFromBottom, isHebrew, esvData]);

  const popoverContent = (
    <div
      ref={popovers}
      data-tour="esv-popover"
      data-open={popoversOpen ? "true" : "false"}
      onFocus={() => setPopoversOpen(true)}
      onBlur={() => setPopoversOpen(false)}
      style={{
        top: popoverPosition.top,
        left: popoverPosition.left,
        maxWidth: `min(${isHebrew ? 420 : 560}px, calc(100vw - 24px))`,
      }}
      className={`fixed text-left z-[45] w-max rounded-lg bg-black px-3.5 py-3 shadow-lg dark:bg-meta-4 ${
        popoversOpen === true ? "block" : "hidden"
      }`}
    >
      <p className="text-[15px] leading-6 text-white text-wrap sm:text-sm sm:leading-5">
        {esvData}
      </p>
    </div>
  );

  return (
    <div>
      <div>
        <div className={`relative inline-block ${popoversOpen ? 'z-30' : 'z-0'}`}>
          <button
            ref={trigger}
            // Only verse 1 is marked, so the tutorial lights up one verse number.
            data-tour={verseNumber === 1 ? "verse-number" : undefined}
            onClick={() => {
              const esvContent = fetchESVTranslation(bookName, chapterNumber, verseNumber);
              esvContent.then((data) =>
                setEsvData(data)
              )              
              setPopoversOpen(!popoversOpen);
            }}
            {...verseNumStyles}
          >
            {verseNumber}
          </button>
          {/* Render in a portal so the popover is not clipped by stacking contexts. */}
          {portalTarget ? createPortal(popoverContent, portalTarget) : null}
        </div>
      </div>
    </div>
  );
};

export default EsvPopover;
