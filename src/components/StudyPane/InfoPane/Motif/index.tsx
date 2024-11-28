import { MotifType } from "@/lib/types";
import { HebWord, PassageData } from "@/lib/data";
import React, { useState } from "react";
import Link from "next/link";

import Root from "./Root";
import Category from "./Category";
import RelatedWord from "./RelatedWord";

const Motif = ({
   content
}: {
   content: PassageData;
  }) => {

  const [expandedTab, setExpandedTab] = useState<MotifType | null>(null);

  const activeClasses = "text-primary border-primary";
  const inactiveClasses = "border-transparent";

  const toggleTab = (tab: MotifType) => {
    if (expandedTab === tab) {
      setExpandedTab(null);
    } else {
      setExpandedTab(tab);
    }
  };

  return (
    <div className="h-full">
      <div className="mb-6 flex flex-col gap-2 sm:gap-3 pt-6">
        <div
          className={`border-b border-stroke dark:border-strokedark ${
            expandedTab !== null && expandedTab !== MotifType.root ? 'hidden' : ''
          }`}
        >
          <Link
            href="#"
            className={`block border-b-2 py-2 text-sm font-medium hover:text-primary md:text-base ${
              expandedTab === MotifType.root ? activeClasses : inactiveClasses
            }`}
            onClick={() => toggleTab(MotifType.root)}
          >
            Identical Roots
          </Link>
          {expandedTab === MotifType.root && (
            <div className="py-4">
              <Root content={content} />
            </div>
          )}
        </div>

        <div
          className={`border-b border-stroke dark:border-strokedark ${
            expandedTab !== null && expandedTab !== MotifType.syn ? 'hidden' : ''
          }`}
        >
          <Link
            href="#"
            className={`block border-b-2 py-2 text-sm font-medium hover:text-primary md:text-base ${
              expandedTab === MotifType.syn ? activeClasses : inactiveClasses
            }`}
            onClick={() => toggleTab(MotifType.syn)}
          >
            Categories
          </Link>
          {expandedTab === MotifType.syn && (
            <div className="py-4">
              <Category content={content} />
            </div>
          )}
        </div>
        <div
          className={`border-b border-stroke dark:border-strokedark ${
            expandedTab !== null && expandedTab !== MotifType.relword ? 'hidden' : ''
          }`}
        >
          <Link
            href="#"
            className={`block border-b-2 py-2 text-sm font-medium hover:text-primary md:text-base ${
              expandedTab === MotifType.relword ? activeClasses : inactiveClasses
            }`}
            onClick={() => toggleTab(MotifType.relword)}
          >
            Related Word
          </Link>
          {expandedTab === MotifType.relword && (
            <div className="py-4">
              <RelatedWord />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Motif;
