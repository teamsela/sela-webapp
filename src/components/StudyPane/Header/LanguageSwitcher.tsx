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
        { value: NonEnglishDisplayMode.Transliteration, label: "English / Transliteration" },
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
      setDropdownOpen(false);
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

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const base = "flex items-center gap-[2px] px-[16px] py-[6px] cursor-pointer";
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
            onClick={() => handleSwitcherClick(LanguageMode.English)}
            className={`rounded-tl-[5px] rounded-bl-[5px] border-r-2 border-r-[#D9D9D9] ${base} ${ctxLanguageMode === LanguageMode.English ? active : ""}`}
          >
            A
            {ctxLanguageMode === LanguageMode.English && <span onClick={toggleDropdown}><Chevron /></span>}
          </span>
          <span
            onClick={() => handleSwitcherClick(LanguageMode.Parallel)}
            className={`${base} ${ctxLanguageMode === LanguageMode.Parallel ? active : ""}`}
          >
            Aא
            {ctxLanguageMode === LanguageMode.Parallel && <span onClick={toggleDropdown}><Chevron /></span>}
          </span>
          <span
            onClick={() => handleSwitcherClick(LanguageMode.Hebrew)}
            className={`rounded-tr-[5px] rounded-br-[5px] border-l-2 border-l-[#D9D9D9] ${base} ${ctxLanguageMode === LanguageMode.Hebrew ? active : ""}`}
          >
            א
            {ctxLanguageMode === LanguageMode.Hebrew && <span onClick={toggleDropdown}><Chevron /></span>}
          </span>
        </div>
      </label>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[280px] rounded-md border border-[#D9D9D9] bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleOptionClick(opt)}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#F2F2F2] ${
                opt.value !== undefined && ctxNonEnglishDisplayMode === opt.value
                  ? "font-semibold text-primary"
                  : "text-slate-700"
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
