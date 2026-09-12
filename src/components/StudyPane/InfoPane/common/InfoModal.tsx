import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { createPortal } from "react-dom";

type InfoModalProps = {
  title: string;
  body: string;
  note: string;
  onClose: () => void;
  titleId?: string;
};

const InfoModal = ({
  title,
  body,
  note,
  onClose,
  titleId,
}: InfoModalProps) =>
  createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={titleId ? undefined : title}
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <IconX size={18} stroke={2} />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <IconInfoCircle size={22} stroke={2.2} />
          <h3
            id={titleId}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h3>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <p>{body}</p>
          <p className="text-xs italic text-gray-500 dark:text-gray-400">
            <span className="font-semibold not-italic">Note:</span> {note}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );

export default InfoModal;
