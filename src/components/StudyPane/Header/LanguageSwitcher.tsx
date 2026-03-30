import { useContext } from 'react';
import { FormatContext } from '../index';
import { LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { updateMetadataInDb } from '@/lib/actions';

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

  const handleSwitcherClick = (mode: LanguageMode) => {
    if (mode != ctxLanguageMode)
    {
      ctxStudyMetadata.lang = mode;
      if (!ctxInViewMode) {
        updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      }
      ctxSetLanguageMode(mode);
    }
  }

  const handleDisplayModeChange = (mode: NonEnglishDisplayMode) => {
    if (mode === ctxNonEnglishDisplayMode) {
      return;
    }

    ctxStudyMetadata.nonEnglishDisplayMode = mode;
    if (!ctxInViewMode) {
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }
    ctxSetNonEnglishDisplayMode(mode);
  };

  const buttonBaseStyle = 'px-[24px] py-[6px]';
  const buttonSelectedStyle = 'bg-[#FFFFFF] font-bold'
  const shouldShowDisplayDropdown = ctxLanguageMode !== LanguageMode.English;

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="toggleLang"
        className="flex cursor-pointer select-none items-center ml-2"
      >
        <div className="relative">

          <div className='flex flex-row rounded-[5px] bg-[#F2F2F2] border-[2px] border-[#D9D9D9] top-0 w-full h-full place-content-around items-center'>
            <span onClick={() => { handleSwitcherClick(LanguageMode.English) }} className={`rounded-tl-[5px] rounded-bl-[5px] border-r-2 border-r-[#D9D9D9] ${buttonBaseStyle} ${ctxLanguageMode == LanguageMode.English && buttonSelectedStyle}`}>
              A
            </span>
            <span onClick={() => { handleSwitcherClick(LanguageMode.Parallel) }} className={`${buttonBaseStyle} ${ctxLanguageMode == LanguageMode.Parallel && buttonSelectedStyle}`}>
              Aא
            </span>
            <span onClick={() => { handleSwitcherClick(LanguageMode.Hebrew) }} className={`rounded-tr-[5px] rounded-br-[5px] border-l-2 border-l-[#D9D9D9] ${buttonBaseStyle} ${ctxLanguageMode == LanguageMode.Hebrew && buttonSelectedStyle}`}>
              א
            </span>
          </div>

        </div>
      </label>
      {shouldShowDisplayDropdown && (
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Display</span>
          <select
            value={ctxNonEnglishDisplayMode}
            onChange={(event) =>
              handleDisplayModeChange(Number(event.target.value) as NonEnglishDisplayMode)
            }
            className="rounded-md border border-[#D9D9D9] bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-primary"
          >
            <option value={NonEnglishDisplayMode.Hebrew}>Hebrew OHB</option>
            <option value={NonEnglishDisplayMode.Transliteration}>Transliteration</option>
          </select>
        </label>
      )}
    </div>
  );
};

export default LanguageSwitcher;
