'use client';

import React from "react";

import { InfoPaneActionType } from "@/lib/types";

export const Tabs = ({
  setInfoPaneAction,
  infoPaneAction,
}: {
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {
  
  const activeClasses = "bg-primary text-white dark:text-white";
  const inactiveClasses = "dark:bg-meta-4 text-black dark:text-white";

  const handleClick = (actionType : InfoPaneActionType) => {
    if (infoPaneAction != actionType) {
      setInfoPaneAction(actionType);
    } else {
      setInfoPaneAction(InfoPaneActionType.none);
    }
  }

  return (
    <div className="flex items-center rounded-full">
      <button
        className={`inline-flex rounded-l-full border border-primary font-medium text-black dark:border-strokedark hover:border-primary hover:bg-primary hover:text-white dark:text-white dark:hover:border-primary sm:px-4 sm:py-[6px]
          ${
            infoPaneAction === InfoPaneActionType.notes ? activeClasses : inactiveClasses
          }`}
        onClick={() => handleClick(InfoPaneActionType.notes)}
      >
        Notes
      </button>
      <button
        className="inline-flex border-y border-primary font-medium text-meta-9 dark:border-strokedark dark:text-white dark:hover:border-primary sm:px-4 sm:py-[6px]"
        disabled={true}
      >
        Structure
      </button>
      <button
        className={`inline-flex border border-primary font-medium text-black dark:border-strokedark hover:border-primary hover:bg-primary hover:text-white dark:text-white dark:hover:border-primary sm:px-4 sm:py-[6px]
          ${
            infoPaneAction === InfoPaneActionType.motif ? activeClasses : inactiveClasses
          }`}
        onClick={() => handleClick(InfoPaneActionType.motif)}
      >
        Motif
      </button>
      <button
        className={`inline-flex border-y border-primary font-medium text-black dark:border-strokedark hover:border-primary hover:bg-primary hover:text-white dark:text-white dark:hover:border-primary sm:px-4 sm:py-[6px]
          ${
            infoPaneAction === InfoPaneActionType.syntax ? activeClasses : inactiveClasses
          }`}
        onClick={() => handleClick(InfoPaneActionType.syntax)}
      >
        Syntax
      </button>
      <button
        className="inline-flex rounded-r-full border border-primary font-medium text-meta-9 dark:border-strokedark dark:text-white dark:hover:border-primary sm:px-4 sm:py-[6px]"
        disabled={true}
      >
        Sounds
      </button>
    </div>
  );
};

export default Tabs;
