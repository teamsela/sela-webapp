import { MotifType } from "@/lib/types";
import React, { useState } from "react";
import Root from "./Root";
import Syn from "./Syn";

const Motif = ({

}: {

  }) => {
  let [tab, setTab] = useState(MotifType.root);
  const handleTabChange = (type: MotifType) => () => {
    setTab(type);
  }
  return (
    <div className="flex flex-col justify-center items-center w-full h-full">
      <div className="flex justify-center items-center gap-4">
      <button
          className="hover:bg-gray-100 text-black cursor-pointer
        font-semibold py-2 px-6 text-lg border border-gray-400 rounded shadow"
          onClick={handleTabChange(MotifType.root)}
        >
          Root
        </button>
        <button
          className="hover:bg-gray-100 text-black cursor-pointer
        font-semibold py-2 px-6 text-lg border border-gray-400 rounded shadow"
          onClick={handleTabChange(MotifType.syn)}
        >
          Syn
        </button>
      </div>
      {
        tab === MotifType.root ? <Root/> : <Syn/>
      }
    </div>
  );
};
export default Motif;
