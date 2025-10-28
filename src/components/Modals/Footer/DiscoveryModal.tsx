"use client";

import CopyrightModal from "@/components/common/CopyrightModal";

type DiscoveryModalProps = {
  triggerClassName?: string;
};

const DiscoveryModal = ({ triggerClassName }: DiscoveryModalProps) => {
  return (
    <CopyrightModal
      label="Discovery Bible"
      title="Discovery Bible"
      triggerClassName={triggerClassName}
    >
      <p>
        Parts of the English and Hebrew text data were drawn from the Discovery Bible, available at <a href="https://discoverybible.com" className="text-primary hover:underline">discoverybible.com</a>, copyright &copy;2023, <a href="https://helpsministries.org" className="text-primary hover:underline">HELPS Ministries Inc.</a> Used by permission. All rights reserved.
      </p>
      <p>
        <a href="https://discoverybible.com" className="text-primary hover:underline">
          discoverybible.com
        </a>
      </p>
    </CopyrightModal>
  );
};

export default DiscoveryModal;
