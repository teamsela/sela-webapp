import { useState } from "react";

const LanguageSwitcher = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <div>
      <label
        htmlFor="toggleLang"
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            type="checkbox"
            id="toggleLang"
            className="sr-only"
            onChange={() => {
              setEnabled(!enabled);
            }}
          />
          <div className="block h-10 w-34 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          <div
            className={`dot absolute left-1 top-1 flex h-8 w-16 items-center justify-center rounded-full bg-white transition font-semibold ${
              enabled && "!right-1 !translate-x-full"
            }`}
          >
            <span className={`hidden ${enabled && "!block"}`}>
            עִב
            </span>
            <span className={`${enabled && "hidden"}`}>
            En
            </span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default LanguageSwitcher;
