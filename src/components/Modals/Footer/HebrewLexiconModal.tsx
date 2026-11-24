"use client";

import CopyrightModal from "@/components/Modals/Footer/CopyrightModal";

type HebrewLexiconModalProps = {
  triggerClassName?: string;
};

const HebrewLexiconModal = ({ triggerClassName }: HebrewLexiconModalProps) => {
  return (
    <CopyrightModal label="Hebrew Lexicon" title="Open Scriptures Hebrew Lexicon" triggerClassName={triggerClassName}>
      <p>
        Hebrew root data is derived from the <a href="https://github.com/openscriptures/HebrewLexicon" className="text-primary hover:underline">Open Scriptures Hebrew Lexicon</a> (Brown-Driver-Briggs lexical index and Strong&apos;s Hebrew Dictionary) and the <a href="https://hb.openscriptures.org" className="text-primary hover:underline">Open Scriptures Hebrew Bible</a> morphology, available under <a href="https://creativecommons.org/licenses/by/4.0/deed.en" className="text-primary hover:underline">CC BY 4.0</a>.
      </p>
      <p>
        Root groupings have been adapted for this site: words are grouped by shared meaning, homonyms are separated, and Aramaic words are joined with their Hebrew cognates.
      </p>
      <p>
        <a href="https://openscriptures.org" className="text-primary hover:underline">
          OpenScriptures.org
        </a>
      </p>
    </CopyrightModal>
  );
};

export default HebrewLexiconModal;
