import { MotifType } from "@/lib/types";
import React, { useState } from "react";
import Link from "next/link";

import Root from "./Root";
import Syn from "./Syn";

const Motif = ({

}: {

  }) => {

  const [openTab, setOpenTab] = useState(MotifType.root);

  const activeClasses = "text-primary border-primary";
  const inactiveClasses = "border-transparent";

  return (
    <div className="flex flex-wrap gap-3 pb-8 sm:gap-6">
        <Link
          href="#"
          className={`border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base ${
            openTab === MotifType.root ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(MotifType.root)}
        >
          Identical Roots
        </Link>
        <Link
          href="#"
          className={`border-b-2 py-4 text-sm font-medium hover:text-primary md:text-base ${
            openTab === MotifType.syn ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(MotifType.syn)}
        >
          Synonyms
        </Link>

      <div>
        <div
          className={`leading-relaxed ${openTab === MotifType.root ? "block" : "hidden"}`}
        >
          <Root/>
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
