import React, { useEffect, useRef, useState, useContext } from "react";
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
        trigger.current.contains(target)
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

  useEffect(() => {
    if (!popoversOpen) return;
    const updatePosition = () => {
      if (!trigger.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const margin = 4;
      const top = renderFromBottom ? rect.bottom + margin : rect.top - margin;
      const left = isHebrew ? rect.right + margin : rect.left;
      setPopoverPosition({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [popoversOpen, renderFromBottom, isHebrew]);

  const popoverContent = (
    <div
      ref={popovers}
      onFocus={() => setPopoversOpen(true)}
      onBlur={() => setPopoversOpen(false)}
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
      className={`fixed ${renderFromBottom ? '' : '-translate-y-full'} ${isHebrew ? '-translate-x-full max-w-[420px]' : 'max-w-[560px]'} text-left z-20 w-max rounded bg-black bg-opacitiy-50 dark:bg-meta-4 sm:p-3 xl:p-3 ${
        popoversOpen === true ? "block" : "hidden"
      }`}
    >
      <p className="text-sm text-white text-wrap">
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
