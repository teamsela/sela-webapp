import { useContext } from 'react';
import { FormatContext } from '../index';
import { LanguageMode } from "@/lib/types";
import { updateMetadataInDb } from '@/lib/actions';

const LanguageSwitcher = () => {
  const { ctxStudyId, ctxLanguageMode, ctxSetLanguageMode, ctxStudyMetadata } = useContext(FormatContext);

  const handleSwitcherClick = (mode: LanguageMode) => {
    if (mode != ctxLanguageMode)
    {
      ctxStudyMetadata.lang = mode;
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
      ctxSetLanguageMode(mode);
    }
  }

  const buttonBaseStyle = 'px-[24px] py-[6px]';
  const buttonSelectedStyle = 'bg-[#FFFFFF] font-bold'

  return (
    <div>
      <label
        htmlFor="toggleLang"
        className="flex cursor-pointer select-none items-center"
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
    </div>
  );
};

export default LanguageSwitcher;
