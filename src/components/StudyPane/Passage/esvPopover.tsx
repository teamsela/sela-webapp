import React, { useEffect, useRef, useState } from "react";

const EsvPopover = ({
    verseNumber,
    verseNumStyles
  } : {
    verseNumber: number;
    verseNumStyles: { className: string }
  }) => {

  const [popoversOpen, setPopoversOpen] = useState(false);

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

  return (
    <div>
      <div>
        <div className="relative inline-block">
          <button
            ref={trigger}
            onClick={() => setPopoversOpen(!popoversOpen)}
            {...verseNumStyles}
          >
            {verseNumber}
          </button>
          <div
            ref={popovers}
            onFocus={() => setPopoversOpen(true)}
            onBlur={() => setPopoversOpen(false)}
            className={`absolute left-full top-0 z-20 ml-3 w-max max-w-[640px] rounded bg-white drop-shadow-5 dark:bg-meta-4 ${
              popoversOpen === true ? "block" : "hidden"
            }`}
          >
            <span className="absolute -left-1.5 top-4 -z-10 h-4 w-4 rotate-45 rounded-sm bg-white dark:bg-meta-4"></span>
            <div className="px-5 py-4.5 text-center">
              <p className="font-medium">
                Lorem ipsum dolor sit amet, consect adipiscing elit. Mauris
                facilisis congue exclamate justo nec facilisis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsvPopover;
