import { MotifType } from "@/lib/types";
import { HebWord, PassageData } from "@/lib/data";
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
  let rootWordsMap = new Map<number, HebWord[]>();
    content.stanzas.map((stanzas) => {
        stanzas.strophes.map((strophe) => {
            strophe.lines.map((line) => {
                line.words.map((word) => {
                    const currentWord = rootWordsMap.get(word.strongNumber);
                    if (currentWord !== undefined) {
                        currentWord.push(word);
                    }
                    else {
                        rootWordsMap.set(word.strongNumber, [word]);
                    }
                })
            })
        });
    })

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
          <Root rootWordsMap={rootWordsMap}  />
        </div>
        <div
          className={`leading-relaxed ${openTab === MotifType.syn ? "block" : "hidden"}`}
        >
          <Syn content={content}/>
        </div>
      </div>
    </div>
  );
};
export default Motif;
