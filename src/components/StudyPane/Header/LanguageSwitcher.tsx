import { useContext, useState, useRef, useEffect } from 'react';
import { FormatContext } from '../index';
import { LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { updateMetadataInDb } from '@/lib/actions';

const displayModeOptions = [
  { value: NonEnglishDisplayMode.Hebrew, label: "English Gloss / Hebrew OHB" },
  { value: NonEnglishDisplayMode.HebrewTransliteration, label: "English Gloss / Hebrew Transliteration" },
];

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const handleDisplayModeChange = (mode: NonEnglishDisplayMode) => {
    if (mode !== ctxNonEnglishDisplayMode) {
      ctxStudyMetadata.nonEnglishDisplayMode = mode;
      if (!ctxInViewMode) {
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      }
      ctxSetNonEnglishDisplayMode(mode);
    }
    setDropdownOpen(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const buttonBaseStyle = "flex items-center gap-[2px] px-[16px] py-[6px] cursor-pointer";
  const buttonSelectedStyle = "bg-[#FFFFFF] font-bold";
  const chevron = (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" className="ml-[2px] opacity-60">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const showDropdown = ctxLanguageMode !== LanguageMode.English;

  return (
    <div className="relative" ref={dropdownRef}>
      <label
        htmlFor="toggleLang"
        className="flex cursor-pointer select-none items-center ml-2"
      >
        <div className="flex flex-row rounded-[5px] bg-[#F2F2F2] border-[2px] border-[#D9D9D9] place-content-around items-center">
          <span
            onClick={() => handleSwitcherClick(LanguageMode.English)}
            className={`rounded-tl-[5px] rounded-bl-[5px] border-r-2 border-r-[#D9D9D9] ${buttonBaseStyle} ${ctxLanguageMode === LanguageMode.English ? buttonSelectedStyle : ""}`}
          >
            A
          </span>
          <span
            onClick={() => handleSwitcherClick(LanguageMode.Parallel)}
            className={`${buttonBaseStyle} ${ctxLanguageMode === LanguageMode.Parallel ? buttonSelectedStyle : ""}`}
          >
            Aא
            {ctxLanguageMode === LanguageMode.Parallel && (
              <span onClick={toggleDropdown} className="ml-[2px]">{chevron}</span>
            )}
          </span>
          <span
            onClick={() => handleSwitcherClick(LanguageMode.Hebrew)}
            className={`rounded-tr-[5px] rounded-br-[5px] border-l-2 border-l-[#D9D9D9] ${buttonBaseStyle} ${ctxLanguageMode === LanguageMode.Hebrew ? buttonSelectedStyle : ""}`}
          >
            א
            {ctxLanguageMode === LanguageMode.Hebrew && (
              <span onClick={toggleDropdown} className="ml-[2px]">{chevron}</span>
            )}
          </span>
        </div>
      </label>

      {showDropdown && dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[280px] rounded-md border border-[#D9D9D9] bg-white py-1 shadow-lg">
          {displayModeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDisplayModeChange(opt.value)}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#F2F2F2] ${
                ctxNonEnglishDisplayMode === opt.value
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
