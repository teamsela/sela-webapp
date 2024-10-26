import React, { useEffect, useRef, useState, useContext } from "react";
import { fetchESVTranslation } from "@/lib/actions";
import { FormatContext } from '../index';

const EsvPopover = ({
    chapterNumber,
    verseNumber,
    verseNumStyles
  } : {
    chapterNumber: number;
    verseNumber: number;
    verseNumStyles: { className: string }
  }) => {

  const { ctxIsHebrew, ctxStropheCount, ctxStanzaCount, ctxStructureUpdateType, ctxSelectedHebWords } = useContext(FormatContext);

  const [popoversOpen, setPopoversOpen] = useState(false);
  const [esvData, setEsvData] = useState("Loading...");

  const trigger = useRef<any>(null);
  const popovers = useRef<any>(null);

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
    const localEsvData = localStorage.getItem(`${chapterNumber}:${verseNumber}`)
    if (localEsvData) {
      console.log(localEsvData);
      setEsvData(localEsvData);
    }
    else {
      const esvContent = fetchESVTranslation(chapterNumber, verseNumber);
      esvContent.then((data) =>{
        localStorage.setItem(`${chapterNumber}:${verseNumber}`, data);
        setEsvData(data)
      }
      )
    }
  }, []);

  return (
    <div>
      <div>
        <div className="relative inline-block">
          <button
            ref={trigger}
            onClick={() => {
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
            className={`absolute bottom-full text-left ${ctxIsHebrew ? 'right-1 max-w-[420px]' : 'left-0 max-w-[560px]'} z-20 mb-1 w-max rounded bg-black bg-opacitiy-50 dark:bg-meta-4 sm:p-3 xl:p-3 ${
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
