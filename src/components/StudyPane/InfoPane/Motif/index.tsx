import { MotifType } from "@/lib/types";
import { useState } from "react";

import Category from "./Category";
import IdenticalWord from "./IdenticalWord";
import AccordionToggleIcon from "../common/AccordionToggleIcon";

const Motif = () => {
  const [openSection, setOpenSection] = useState<MotifType | null>(MotifType.identical);

  const toggleSection = (section: MotifType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="accordion">
        {/* Identical Words Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(MotifType.identical)}
          >
            <AccordionToggleIcon isOpen={openSection === MotifType.identical} />
            <span className={`${openSection === MotifType.identical ? "text-primary" : "text-black dark:text-white"}`}>
              Identical Words
            </span>
          </button>
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
