'use client'
import React, { useEffect, useRef, useState } from "react";

const Notes = ({
}:{
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    const textarea = textareaRef.current;

    if (!container|| !textarea) return;

    const containerPadding = 16;
    textarea.style.lineHeight = '1.5';

    const computeRows = () => {
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      // 1 tailwind unit = 4px, and there are 8 instances of padding needed to be subtracted
      const containerHeight = container.clientHeight - containerPadding*8;
      if (lineHeight > 0) {
        const calculatedRows = Math.floor(containerHeight/lineHeight);
        setRows(calculatedRows);
      }
    };

    computeRows();

    const resizeObserver = new ResizeObserver(() => {
      computeRows();
    })

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [])

  return (
    <div  ref={containerRef} className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Notes
              </h3>
            </div>
            <div  className="flex flex-col gap-5.5 p-6.5">
              <div>
                <textarea
                  ref={textareaRef}
                  rows={rows}
                  placeholder="Your notes here..."
                  className="resize-none w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>
            </div>
          </div>
  );
};
export default Notes;