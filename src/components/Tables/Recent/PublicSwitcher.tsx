"use client";

import { useState } from "react";
import { updatePublic } from '@/lib/actions';

const PublicSwitcher = ({
  studyId,
  publicAccess
}: {
  studyId: string;
  publicAccess: boolean;
} ) => {


  const [enabled, setEnabled] = useState(publicAccess);

  return (
    <div>
      <label
        htmlFor={studyId}
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            type="checkbox"
            id={studyId}
            className="sr-only"
            checked={enabled}
            onChange={() => {
              setEnabled(!enabled);
              updatePublic(studyId, !enabled);
            }}
          />
          <div className="block h-8 w-14 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          <div
            className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white transition ${
              enabled && "!right-1 !translate-x-full !bg-primary dark:!bg-white"
            }`}
          >
            <svg
              className={`pointer-events-none absolute inset-0 m-auto h-4 w-4 text-slate-500 transition-opacity ${
                enabled ? "opacity-0" : "opacity-100"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>

            <svg
              className={`pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white dark:text-black transition-opacity ${
                enabled ? "opacity-100" : "opacity-0"
              }`}
              viewBox="0 0 11 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="0.4"
              ></path>
            </svg>
          </div>
        </div>
      </label>
    </div>
  );
};

export default PublicSwitcher;
