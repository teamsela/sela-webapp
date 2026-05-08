import { useContext, useState, useRef, useEffect } from 'react';
import { FormatContext } from '../index';
import { LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { updateMetadataInDb } from '@/lib/actions';

type DropdownOption = { label: string; value?: NonEnglishDisplayMode };

const getDropdownOptions = (mode: LanguageMode): DropdownOption[] => {
  switch (mode) {
    case LanguageMode.English:
      return [{ label: "English Gloss" }];
    case LanguageMode.Parallel:
      return [
        { value: NonEnglishDisplayMode.Hebrew, label: "English Gloss / Hebrew OHB" },
        { value: NonEnglishDisplayMode.HebrewTransliteration, label: "English Gloss / Hebrew Transliteration" },
      ];
    case LanguageMode.Hebrew:
      return [
        { value: NonEnglishDisplayMode.Hebrew, label: "Hebrew OHB" },
        { value: NonEnglishDisplayMode.HebrewTransliteration, label: "Transliteration" },
      ];
  }
};

const Chevron = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" className="ml-[2px] opacity-60">
    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LanguageSwitcher = () => {
  const {
    ctxStudyId,
    ctxLanguageMode,
    ctxSetLanguageMode,
    ctxStudyMetadata,
    ctxNonEnglishDisplayMode,
    ctxSetNonEnglishDisplayMode,
    ctxInViewMode,
  } = useContext(FormatContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitcherClick = (mode: LanguageMode) => {
    if (mode !== ctxLanguageMode) {
      ctxStudyMetadata.lang = mode;
      if (!ctxInViewMode) {
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      }
      ctxSetLanguageMode(mode);
    }
  };

  const handleOptionClick = (opt: DropdownOption) => {
    if (opt.value !== undefined && opt.value !== ctxNonEnglishDisplayMode) {
      ctxStudyMetadata.nonEnglishDisplayMode = opt.value;
      if (!ctxInViewMode) {
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      }
      ctxSetNonEnglishDisplayMode(opt.value);
    }
    setDropdownOpen(false);
  };

  // Clicking the whole button: switch mode (if needed) + open dropdown
  const handleButtonClick = (mode: LanguageMode) => {
    handleSwitcherClick(mode);
    const opts = getDropdownOptions(mode);
    if (opts.length > 0) {
      setDropdownOpen((prev) => !prev);
    } else {
      setDropdownOpen(false);
    }
  };

  const base = "flex items-center gap-[2px] px-[16px] py-[6px] cursor-pointer select-none transition-colors hover:bg-[#E6E6E6]";
  const active = "bg-[#FFFFFF] font-bold";
  const options = getDropdownOptions(ctxLanguageMode);

  return (
    <div className="relative" ref={ref}>
      <label
        htmlFor="toggleLang"
        className="flex cursor-pointer select-none items-center ml-2"
      >
        <div className="flex flex-row rounded-[5px] bg-[#F2F2F2] border-[2px] border-[#D9D9D9] place-content-around items-center">
          <span
            onClick={() => handleButtonClick(LanguageMode.English)}
            className={`rounded-tl-[5px] rounded-bl-[5px] border-r-2 border-r-[#D9D9D9] ${base} ${ctxLanguageMode === LanguageMode.English ? active : ""}`}
          >
            A
            <Chevron />
          </span>
          <span
            onClick={() => handleButtonClick(LanguageMode.Parallel)}
            className={`${base} ${ctxLanguageMode === LanguageMode.Parallel ? active : ""}`}
          >
            Aא
            <Chevron />
          </span>
          <span
            onClick={() => handleButtonClick(LanguageMode.Hebrew)}
            className={`rounded-tr-[5px] rounded-br-[5px] border-l-2 border-l-[#D9D9D9] ${base} ${ctxLanguageMode === LanguageMode.Hebrew ? active : ""}`}
          >
            א
            <Chevron />
          </span>
        </div>
      </label>

      {dropdownOpen && (
        <div className={`absolute top-full mt-1 z-50 min-w-[280px] rounded-md border border-[#D9D9D9] bg-white py-1 shadow-lg ${ctxLanguageMode === LanguageMode.English ? "left-0" : "right-0"}`}>
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleOptionClick(opt)}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                (opt.value === ctxNonEnglishDisplayMode) || (ctxLanguageMode === LanguageMode.English)
                  ? "bg-[#F2F2F2] font-semibold text-slate-900"
                  : "text-slate-900 hover:bg-[#F2F2F2]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
