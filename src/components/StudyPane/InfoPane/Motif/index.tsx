import { MotifType } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { MdInfoOutline } from "react-icons/md";

import Category from "./Category";
import IdenticalWord from "./IdenticalWord";
import RepeatedRootsInfoModal from "./RepeatedRootsInfoModal";
import AccordionToggleIcon from "../common/AccordionToggleIcon";

const Motif = () => {
  const [openSection, setOpenSection] = useState<MotifType | null>(MotifType.identical);
  const [showInfo, setShowInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const closeInfo = useCallback(() => setShowInfo(false), []);

  // The info popup is portaled to document.body, so gate it behind mount.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close the info popup on Escape while it is open.
  useEffect(() => {
    if (!showInfo) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeInfo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showInfo, closeInfo]);

  const toggleSection = (section: MotifType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="accordion">
        {/* Repeated Roots Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(MotifType.identical)}
          >
            <AccordionToggleIcon isOpen={openSection === MotifType.identical} />
            <span className={`${openSection === MotifType.identical ? "text-primary" : "text-black dark:text-white"}`}>
              Repeated Roots
            </span>
            <span
              role="button"
              aria-label="About repeated roots"
              className="ClickBlock inline-flex cursor-pointer items-center justify-center text-primary transition hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(true);
              }}
            >
              <MdInfoOutline size="18px" />
            </span>
          </button>
          {isMounted && showInfo && <RepeatedRootsInfoModal onClose={closeInfo} />}
          {openSection === MotifType.identical && (
            <div className="p-4">
              <IdenticalWord />
            </div>
          )}
        </div>

        {/* Categories Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(MotifType.category)}
          >
            <AccordionToggleIcon isOpen={openSection === MotifType.category} />
            <span className={`${openSection === MotifType.category ? "text-primary" : "text-black dark:text-white"}`}>
              Categories
            </span>
          </button>
          {openSection === MotifType.category && (
            <div className="p-4">
              <Category />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Motif;
