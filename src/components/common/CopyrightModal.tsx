"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
  useId,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import clsx from "clsx";

type CopyrightModalProps = {
  label: ReactNode;
  title: string;
  children: ReactNode;
  triggerClassName?: string;
};

const CopyrightModal = ({
  label,
  title,
  children,
  triggerClassName,
}: CopyrightModalProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const modalTitleId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const modalMarkup = useMemo(() => {
    if (!open) {
      return null;
    }

    const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        setOpen(false);
      }
    };

    return (
      <div
        className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        onClick={handleOverlayClick}
      >
        <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 text-left text-sm text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-200">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Close copyright information"
          >
            <IconX size={18} stroke={2} />
          </button>

          <h3 id={modalTitleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {children}
          </div>
        </div>
      </div>
    );
  }, [children, modalTitleId, open, title]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          "rounded px-1 text-left text-sm font-medium text-primary transition hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          triggerClassName
        )}
      >
        {label}
      </button>
      {isMounted && modalMarkup ? createPortal(modalMarkup, document.body) : null}
    </>
  );
};

export default CopyrightModal;
