import { useContext } from 'react';
import { FormatContext } from '../index';

const LanguageSwitcher = ({
  setLangToHebrew
}: {
  setLangToHebrew: (arg: boolean) => void;
}) => {
  const { ctxIsHebrew, ctxLanguageMode, ctxSetLanguageMode } = useContext(FormatContext);

  const updateScaleOrigin = () => {
    const passageDiv = document.getElementById('selaPassage');
    if (!passageDiv) {
      console.error("Can not find the passage division.");
      return;
    }
    // ctxIsHebrew is not updated yet, so reversed origin 
    passageDiv.style.transformOrigin = ctxIsHebrew ? "0 0" : "100% 0";
  };

  const handleSwitcherClick = (mode: string) => {
    console.log(mode);

    switch (mode) {
      case "en":
        console.log('set en');
        ctxSetLanguageMode({ English: true, Parallel: false, Hebrew: false })
        break;
      case "both":
        console.log('set both');
        ctxSetLanguageMode({ English: false, Parallel: true, Hebrew: false })
        break;
      case "heb":
        console.log("set heb")
        ctxSetLanguageMode({ English: false, Parallel: false, Hebrew: true })
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
            <span onClick={() => { handleSwitcherClick('en') }} className={`rounded-tl-[5px] rounded-bl-[5px] border-r-2 border-r-[#D9D9D9] ${buttonBaseStyle} ${ctxLanguageMode.English && buttonSelectedStyle}`}>
              En
            </span>
            <span onClick={() => { handleSwitcherClick('both') }} className={`${buttonBaseStyle} ${ctxLanguageMode.Parallel && buttonSelectedStyle}`}>
              A/עִ
            </span>
            <span onClick={() => { handleSwitcherClick('heb') }} className={`rounded-tr-[5px] rounded-br-[5px] border-l-2 border-l-[#D9D9D9] ${buttonBaseStyle} ${ctxLanguageMode.Hebrew && buttonSelectedStyle}`}>
              עִב
            </span>
          </div>

        </div>
      </label>
    </div>
  );
};

export default LanguageSwitcher;
