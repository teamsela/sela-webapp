"use client";

import CopyrightModal from "@/components/common/CopyrightModal";

type BSBModalProps = {
  triggerClassName?: string;
};

const BSBModal = ({ triggerClassName }: BSBModalProps) => {
  return (
    <CopyrightModal label="BSB" title="Berean Standard Bible" triggerClassName={triggerClassName}>
      <p>
        The line divisions found in the <a href="https://berean.bible/index.html" className="text-primary hover:underline">Berean Standard Bible</a> have been adapted for displaying the default lines found in the Bible passages here. Some discrepancies remain due to word order differences in the Hebrew text and this translation.
      </p>
      <p>
        The <a href="https://berean.bible/index.html" className="text-primary hover:underline">Berean Bible</a> is officially dedicated to the <a href="https://creativecommons.org/publicdomain/zero/1.0/" className="text-primary hover:underline">public domain</a> as of April 30, 2023.
      </p>
      <p>
        <a href="https://berean.bible/index.html" className="text-primary hover:underline">berean.bible</a>
      </p>
    </CopyrightModal>
  );
};

export default BSBModal;
