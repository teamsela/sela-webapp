import { useContext } from 'react';
import { FormatContext } from '../index';

const LanguageSwitcher = ({ 
  setLangToHebrew
} : {
  setLangToHebrew: (arg: boolean) => void;
}) => {
  const { ctxIsHebrew } = useContext(FormatContext);

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
              setLangToHebrew(!ctxIsHebrew);
            }}
          />
          <div className="block h-10 w-18 lg:w-26 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          <div
            className={`dot absolute left-1 top-1 flex h-8 w-8 lg:w-12 items-center justify-center rounded-full bg-white transition font-semibold ${
              ctxIsHebrew && "!right-1 !translate-x-full"
            }`}
          >
            <span className={`hidden ${ctxIsHebrew && "!block"}`}>
            עִב
            </span>
            <span className={`${ctxIsHebrew && "hidden"}`}>
            En
            </span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default LanguageSwitcher;
