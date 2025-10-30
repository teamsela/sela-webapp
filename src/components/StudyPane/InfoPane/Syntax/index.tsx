import { SyntaxType } from "@/lib/types";
import { useState } from "react";

import AccordionToggleIcon from "../common/AccordionToggleIcon";
import PartsOfSpeech from "./PartsOfSpeech";

const Syntax = () => {
  const [openSection, setOpenSection] = useState<SyntaxType | null>(SyntaxType.partsOfSpeech);

  const toggleSection = (section: SyntaxType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="accordion">
        {/* Parts of Speech Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(SyntaxType.partsOfSpeech)}
          >
            <AccordionToggleIcon isOpen={openSection === SyntaxType.partsOfSpeech} />
            <span className={`${openSection === SyntaxType.partsOfSpeech ? "text-primary" : "text-black dark:text-white"}`}>
              Parts of Speech
            </span>
          </button>
          {openSection === SyntaxType.partsOfSpeech && (
            <div className="p-4">
              <PartsOfSpeech />
            </div>
          )}
        </div>

        {/* Verbal Conjugations Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(SyntaxType.verbalConjugations)}
          >
            <AccordionToggleIcon isOpen={openSection === SyntaxType.verbalConjugations} />
            <span className={`${openSection === SyntaxType.verbalConjugations ? "text-primary" : "text-black dark:text-white"}`}>
              Verbal Conjugations
            </span>
          </button>
          {openSection === SyntaxType.verbalConjugations && (
            <div className="p-4">
              Verbal Conjugations STARTS HERE
            </div>
          )}
        </div>

        {/* Verbal Stems Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(SyntaxType.verbalStems)}
          >
            <AccordionToggleIcon isOpen={openSection === SyntaxType.verbalStems} />
            <span className={`${openSection === SyntaxType.verbalStems ? "text-primary" : "text-black dark:text-white"}`}>
              Verbal Stems
            </span>
          </button>
          {openSection === SyntaxType.verbalStems && (
            <div className="p-4">
              Verbal Stems STARTS HERE
            </div>
          )}
        </div>

        {/* Persons, Gender, Number Accordion */}
        <div className="border-b border-stroke dark:border-strokedark mx-4">
          <button
            className="ClickBlock w-full text-left py-4 px-2 text-sm font-medium md:text-base flex items-center gap-2"
            onClick={() => toggleSection(SyntaxType.personsGenderNumber)}
          >
            <AccordionToggleIcon isOpen={openSection === SyntaxType.personsGenderNumber} />
            <span className={`${openSection === SyntaxType.personsGenderNumber ? "text-primary" : "text-black dark:text-white"}`}>
              Persons, Gender, Number
            </span>
          </button>
          {openSection === SyntaxType.personsGenderNumber && (
            <div className="p-4">
              Persons, Gender, Number STARTS HERE
            </div>
          )}
        </div>        
      </div>
    </div>
  );
};

export default Syntax;
