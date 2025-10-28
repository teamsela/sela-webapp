"use client";

import CopyrightModal from "@/components/common/CopyrightModal";

type OHBModalProps = {
  triggerClassName?: string;
};

const OHBModal = ({ triggerClassName }: OHBModalProps) => {
  return (
    <CopyrightModal label="OHB" title="Open Scriptures Hebrew Bible" triggerClassName={triggerClassName}>
      <p>
        Original Hebrew text based on the Westminster Leningrad Codex (WLC), which is in the <a href="https://creativecommons.org/publicdomain/mark/1.0/" className="text-primary hover:underline">public domain</a>. Metadata for the WLC is maintained by <a href="https://openscriptures.org" className="text-primary hover:underline">OpenScriptures.org</a>.
      </p>
      <p>
        <a href="https://hb.openscriptures.org" className="text-primary hover:underline">
          hb.openscriptures.org
        </a>
      </p>
    </CopyrightModal>
  );
};

export default OHBModal;
