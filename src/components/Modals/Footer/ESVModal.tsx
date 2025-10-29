"use client";

import CopyrightModal from "@/components/common/CopyrightModal";

type ESVModalProps = {
  triggerClassName?: string;
};

const ESVModal = ({ triggerClassName }: ESVModalProps) => {
  return (
    <CopyrightModal label="ESV" title="English Standard Version" triggerClassName={triggerClassName}>
      <p>
        Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language.
      </p>
      <p>
        Users may not copy or download more than 500 verses of the ESV Bible or more than one half of any book of the ESV Bible.
      </p>
      <p>
        <a href="https://www.esv.org" className="text-primary hover:underline">
          esv.org
        </a>
      </p>
    </CopyrightModal>
  );
};

export default ESVModal;
