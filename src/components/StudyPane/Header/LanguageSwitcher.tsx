import { useContext } from 'react';
import { FormatContext } from '../index';

const LanguageSwitcher = ({ 
  setLangToHebrew
} : {
  setLangToHebrew: (arg: boolean) => void;
}) => {
  const { ctxIsHebrew, ctxSetLanguageMode } = useContext(FormatContext);

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
    // ctxSetLanguageMode({ English: false, Parallel: false, Hebrew: false })
    switch(mode){
      case "en":
        console.log('set en');
        break;
      case "both":
        console.log('set both');
        break;
      case "heb":
        console.log("set heb")
    }
  }

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
              updateScaleOrigin();
            }}
          />
          <div className="block h-10 w-18 lg:w-22 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          {/* <div
            className={`dot absolute left-1 top-1 flex h-8 w-8 lg:w-10 items-center justify-center rounded-full bg-white transition font-semibold ${
              ctxIsHebrew && "!right-1 !translate-x-full"
            }`}
          >
          </div> */}
          <div className='flex flex-row gap-[16px] absolute top-0 w-full h-full place-content-around items-center'>
            <span onClick={ () => { handleSwitcherClick('en') } } className={` ${!ctxIsHebrew && "font-bold"}`}>
              En
            </span>
            <span onClick={ () => { handleSwitcherClick('both') }} className={` ${ctxIsHebrew && "font-bold"}`}>
              A/עִ
            </span>
            <span onClick={ () => { handleSwitcherClick('heb') } } className={` ${ctxIsHebrew && "font-bold"}`}>
              עִב
            </span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default LanguageSwitcher;
