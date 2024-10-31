import { MotifType } from "@/lib/types";
import { PassageData } from "@/lib/data";
import React, { useState } from "react";
import Link from "next/link";

import Root from "./Root";
import Syn from "./Syn";

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
          Identical Roots
        </Link>
        <Link
          href="#"
          className={`border-b-2 pt-4 py-2 text-sm font-medium hover:text-primary md:text-base ${
            openTab === MotifType.syn ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(MotifType.syn)}
        >
          Synonyms
        </Link>
      </div>
      <div className="h-full">
        <div
          className={`leading-relaxed ${openTab === MotifType.root ? "block" : "hidden"} h-full`}
        >
          <Root content={content} />
        </div>
        <div
          className={`leading-relaxed ${openTab === MotifType.syn ? "block" : "hidden"}`}
        >
          <Syn/>
        </div>
      </div>
    </div>
  );
};
export default Motif;
