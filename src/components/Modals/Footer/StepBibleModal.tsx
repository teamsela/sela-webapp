"use client";

import CopyrightModal from "@/components/common/CopyrightModal";

type StepBibleModalProps = {
  triggerClassName?: string;
};

const StepBibleModal = ({ triggerClassName }: StepBibleModalProps) => {
  return (
    <CopyrightModal
      label="STEP Bible"
      title="STEP Bible"
      triggerClassName={triggerClassName}
    >
      <p>
        Related words data drawn from <a href="https://www.stepbible.org" className="text-primary hover:underline">STEP Bible&apos;s</a> data available under <a href="https://creativecommons.org/licenses/by/4.0/deed.en" className="text-primary hover:underline">CC BY 4.0</a>.
      </p>
      <p>
        Datasets from STEP Bible are based on scholars&apos; work at <a href="https://tyndalehouse.com" className="text-primary hover:underline">Tyndale House</a>&mdash;an international Biblical Studies research institute in Cambridge, UK.
      </p>
      <p>
        <a href="https://www.stepbible.org" className="text-primary hover:underline">
          STEPBible.org
        </a>
      </p>
      <p>
        <a href="https://tyndalehouse.com" className="text-primary hover:underline">
          TyndaleHouse.com
        </a>
      </p>
    </CopyrightModal>
  );
};

export default StepBibleModal;
