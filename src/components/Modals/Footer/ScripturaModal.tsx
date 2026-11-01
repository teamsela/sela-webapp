"use client";

import CopyrightModal from "@/components/Modals/Footer/CopyrightModal";

type ScripturaModalProps = {
  triggerClassName?: string;
};

const ScripturaModal = ({ triggerClassName }: ScripturaModalProps) => {
  return (
    <CopyrightModal label="Scriptura" title="Scriptura" triggerClassName={triggerClassName}>
      <p>
        Within Scriptura Studies, only the layer notes are from <em>Psalms: Layer by Layer</em> ©️ Scriptura, used with permission. All other text, visual markings, and Smart Tools are not the work of Scriptura and are independent of Scriptura&rsquo;s research findings.
      </p>
      <p>
        <a
          href="https://psalms.scriptura.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          https://psalms.scriptura.org
        </a>
      </p>
    </CopyrightModal>
  );
};

export default ScripturaModal;
