import { MotifType } from "@/lib/types";
import { PassageData } from "@/lib/data";
import React, { useState } from "react";

import Root from "./Root";
import Category from "./Category";
// import RelatedWord from "./Related";

const Motif = ({ content }: { content: PassageData }) => {
  const [openSection, setOpenSection] = useState<MotifType | null>(MotifType.root);

  const toggleSection = (section: MotifType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="accordion">
        {/* Identical Words Accordion */}
        <div className="border-b border-stroke dark:border-strokedark">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(MotifType.root)}
          >
            <svg
              className={`fill-primary stroke-primary duration-200 ease-in-out dark:fill-white dark:stroke-white ${openSection === MotifType.root ? "rotate-180" : ""}`}
              width="18"
              height="10"
              viewBox="0 0 18 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.28882 8.43257L8.28874 8.43265L8.29692 8.43985C8.62771 8.73124 9.02659 8.86001 9.41667 8.86001C9.83287 8.86001 10.2257 8.69083 10.5364 8.41713L10.5365 8.41721L10.5438 8.41052L16.765 2.70784L16.771 2.70231L16.7769 2.69659C17.1001 2.38028 17.2005 1.80579 16.8001 1.41393C16.4822 1.1028 15.9186 1.00854 15.5268 1.38489L9.41667 7.00806L3.3019 1.38063L3.29346 1.37286L3.28467 1.36548C2.93287 1.07036 2.38665 1.06804 2.03324 1.41393L2.0195 1.42738L2.00683 1.44184C1.69882 1.79355 1.69773 2.34549 2.05646 2.69659L2.06195 2.70196L2.0676 2.70717L8.28882 8.43257Z"
                fill=""
                stroke=""
              />
            </svg>
            <span className={`${openSection === MotifType.root ? "text-primary" : "text-black dark:text-white"}`}>Identical Words</span>
          </button>
          {openSection === MotifType.root && (
            <div className="p-4">
              <Root content={content} />
            </div>
          )}
        </div>

        {/* Categories Accordion */}
        <div className="border-b border-stroke dark:border-strokedark">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(MotifType.category)}
          >
            <svg
              className={`fill-primary stroke-primary duration-200 ease-in-out dark:fill-white dark:stroke-white ${openSection === MotifType.category ? "rotate-180" : ""}`}
              width="18"
              height="10"
              viewBox="0 0 18 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.28882 8.43257L8.28874 8.43265L8.29692 8.43985C8.62771 8.73124 9.02659 8.86001 9.41667 8.86001C9.83287 8.86001 10.2257 8.69083 10.5364 8.41713L10.5365 8.41721L10.5438 8.41052L16.765 2.70784L16.771 2.70231L16.7769 2.69659C17.1001 2.38028 17.2005 1.80579 16.8001 1.41393C16.4822 1.1028 15.9186 1.00854 15.5268 1.38489L9.41667 7.00806L3.3019 1.38063L3.29346 1.37286L3.28467 1.36548C2.93287 1.07036 2.38665 1.06804 2.03324 1.41393L2.0195 1.42738L2.00683 1.44184C1.69882 1.79355 1.69773 2.34549 2.05646 2.69659L2.06195 2.70196L2.0676 2.70717L8.28882 8.43257Z"
                fill=""
                stroke=""
              />
            </svg>
            <span className={`${openSection === MotifType.category ? "text-primary" : "text-black dark:text-white"}`}>Categories</span>
          </button>
          {openSection === MotifType.category && (
            <div className="p-4">
              <Category content={content} />
            </div>
          )}
        </div>

        {/* Related Words Accordion */}
        {/* <div className="border-b border-stroke dark:border-strokedark">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(MotifType.related)}
          >
            <svg
              className={`fill-primary stroke-primary duration-200 ease-in-out dark:fill-white dark:stroke-white ${openSection === MotifType.related ? "rotate-180" : ""}`}
              width="18"
              height="10"
              viewBox="0 0 18 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.28882 8.43257L8.28874 8.43265L8.29692 8.43985C8.62771 8.73124 9.02659 8.86001 9.41667 8.86001C9.83287 8.86001 10.2257 8.69083 10.5364 8.41713L10.5365 8.41721L10.5438 8.41052L16.765 2.70784L16.771 2.70231L16.7769 2.69659C17.1001 2.38028 17.2005 1.80579 16.8001 1.41393C16.4822 1.1028 15.9186 1.00854 15.5268 1.38489L9.41667 7.00806L3.3019 1.38063L3.29346 1.37286L3.28467 1.36548C2.93287 1.07036 2.38665 1.06804 2.03324 1.41393L2.0195 1.42738L2.00683 1.44184C1.69882 1.79355 1.69773 2.34549 2.05646 2.69659L2.06195 2.70196L2.0676 2.70717L8.28882 8.43257Z"
                fill=""
                stroke=""
              />
            </svg>
            <span className={`${openSection === MotifType.related ? "text-primary" : "text-black dark:text-white"}`}>Related Words</span>
          </button>
          {openSection === MotifType.related && (
            <div className="p-4">
              <RelatedWord content={content} />
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default Motif;
