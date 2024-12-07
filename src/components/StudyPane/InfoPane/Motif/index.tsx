import { MotifType } from "@/lib/types";
import { HebWord, PassageData } from "@/lib/data";
import React, { useState } from "react";
import Link from "next/link";

import Root from "./Root";
import Category from "./Category";
import RelatedWord from "./Related";

const Motif = ({
   content
}: {
   content: PassageData;
  }) => {

  const [openTab, setOpenTab] = useState(MotifType.root);

  const activeClasses = "text-primary border-primary";
  const inactiveClasses = "border-transparent";
 
  return (
    <div className="h-full">
      <div className="mb-6 flex flex-wrap gap-5 border-b border-stroke dark:border-strokedark sm:gap-8">
        <Link
          href="#"
          className={`border-b-2 pt-4 py-2 text-sm font-medium hover:text-primary md:text-base ${
            openTab === MotifType.root ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(MotifType.root)}
        >
          Identical Words
        </Link>
        <Link
          href="#"
          className={`border-b-2 pt-4 py-2 text-sm font-medium hover:text-primary md:text-base ${
            openTab === MotifType.category ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(MotifType.category)}
        >
          Categories
        </Link>
        <Link
          href="#"
          className={`border-b-2 pt-4 py-2 text-sm font-medium hover:text-primary md:text-base ${
            openTab === MotifType.related ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(MotifType.related)}
        >
          Related Words
        </Link>
      </div>
      <div className="h-full">
        <div
          className={`leading-relaxed ${openTab === MotifType.root ? "block" : "hidden"} h-full`}
        >
          <Root content={content}/>
        </div>
        <div
          className={`leading-relaxed ${openTab === MotifType.category ? "block" : "hidden"} h-full`}
        >
          <Category content={content}/>
        </div>
        <div
          className={`leading-relaxed ${openTab === MotifType.related ? "block" : "hidden"} h-full`}
        >
          <RelatedWord content={content}/>
        </div>
      </div>
    </div>
  );
};
export default Motif;
