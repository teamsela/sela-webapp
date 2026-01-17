import React, { useEffect, useRef, useState, useContext } from "react";
import { fetchESVTranslation } from "@/lib/actions";
import { LanguageMode } from "@/lib/types";
import { FormatContext } from '../index';

const EsvPopover = ({
    chapterNumber,
    verseNumber,
    verseNumStyles,
    bookName
  } : {
    chapterNumber: number;
    verseNumber: number;
    verseNumStyles: { className: string }
    bookName: string;
  }) => {

  const { ctxLanguageMode } = useContext(FormatContext);

  const [popoversOpen, setPopoversOpen] = useState(false);
  const [esvData, setEsvData] = useState("Loading...");

  const trigger = useRef<any>(null);
  const popovers = useRef<any>(null);

  const isHebrew = (ctxLanguageMode == LanguageMode.Hebrew);

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

  return (
    <div>
      <div>
        <div className="relative inline-block">
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
          <div
            ref={popovers}
            onFocus={() => setPopoversOpen(true)}
            onBlur={() => setPopoversOpen(false)}
            className={`absolute bottom-full text-left ${isHebrew ? 'right-1 max-w-[420px]' : 'left-0 max-w-[560px]'} z-20 mb-1 w-max rounded bg-black bg-opacitiy-50 dark:bg-meta-4 sm:p-3 xl:p-3 ${
              popoversOpen === true ? "block" : "hidden"
            }`}
          >
            <p className="text-sm text-white text-wrap">
              {esvData}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsvPopover;
