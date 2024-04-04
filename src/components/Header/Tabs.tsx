'use client';

import React, { useState } from "react";
import Link from "next/link";

const Tabs: React.FC = () => {
  const [openTab, setOpenTab] = useState(1);

  const activeClasses = "bg-theme text-black dark:text-white font-bold";
  const inactiveClasses = "bg-gray dark:bg-meta-4 text-black dark:text-white font-medium";

  return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="#"
          className={`rounded-md px-4 py-3 text-sm hover:bg-theme hover:text-black dark:hover:bg-theme md:text-base lg:px-6 ${
            openTab === 1 ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(1)}
        >
          Structure
        </Link>
        <Link
          href="#"
          className={`rounded-md px-4 py-3 text-sm hover:bg-theme hover:text-black dark:hover:bg-theme md:text-base lg:px-6 ${
            openTab === 2 ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(2)}
        >
          Motif
        </Link>
        <Link
          href="#"
          className={`rounded-md px-4 py-3 text-sm hover:bg-theme hover:text-black dark:hover:bg-theme md:text-base lg:px-6 ${
            openTab === 3 ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(3)}
        >
          Syntax
        </Link>
        <Link
          href="#"
          className={`rounded-md px-4 py-3 text-sm hover:bg-theme hover:text-black dark:hover:bg-theme md:text-base lg:px-6 ${
            openTab === 4 ? activeClasses : inactiveClasses
          }`}
          onClick={() => setOpenTab(4)}
        >
          Sounds
        </Link>
      </div>
  );
};

export default Tabs;
