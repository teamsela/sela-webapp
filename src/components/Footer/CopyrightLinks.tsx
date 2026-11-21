"use client";

import clsx from "clsx";

import BSBModal from "@/components/Modals/Footer/BSBModal";
import DiscoveryModal from "@/components/Modals/Footer/DiscoveryModal";
import ESVModal from "@/components/Modals/Footer/ESVModal";
import OHBModal from "@/components/Modals/Footer/OHBModal";
import ScripturaModal from "@/components/Modals/Footer/ScripturaModal";
import StepBibleModal from "@/components/Modals/Footer/StepBibleModal";

// Every source whose copyright notice has to be reachable from each page.
const SOURCES = [DiscoveryModal, StepBibleModal, BSBModal, ESVModal, OHBModal, ScripturaModal];

/**
 * "Copyright Information for Discovery Bible, STEP Bible, …": each name opens
 * that source's notice. With `chips`, the names are touch-sized buttons with
 * no lead-in or commas (the phone's ⋯ menu).
 */
export const CopyrightLinks = ({
  className,
  chips = false,
}: {
  className?: string;
  chips?: boolean;
}) => (
  <div className={clsx("flex flex-wrap items-center", chips ? "gap-2" : "gap-x-1 gap-y-1", className)}>
    {!chips && <span>Copyright Information for</span>}
    {SOURCES.map((Source, i) => (
      <span key={i} className="inline-flex items-baseline">
        <Source
          triggerClassName={
            chips
              ? "!px-3 h-10 rounded-full border border-stroke bg-white text-sm font-semibold text-black hover:!no-underline"
              : "px-0 hover:underline"
          }
        />
        {!chips && i < SOURCES.length - 1 && <span>,</span>}
      </span>
    ))}
  </div>
);

export default CopyrightLinks;
