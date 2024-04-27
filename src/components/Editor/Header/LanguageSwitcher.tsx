
const LanguageSwitcher = ({ 
  isHebrew,
  setLangToHebrew
} : {
  isHebrew: boolean;
  setLangToHebrew: (arg: boolean) => void;
}) => {

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
              setLangToHebrew(!isHebrew);
            }}
          />
          <div className="block h-10 w-26 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          <div
            className={`dot absolute left-1 top-1 flex h-8 w-12 items-center justify-center rounded-full bg-white transition font-semibold ${
              isHebrew && "!right-1 !translate-x-full"
            }`}
          >
            <span className={`hidden ${isHebrew && "!block"}`}>
            עִב
            </span>
            <span className={`${isHebrew && "hidden"}`}>
            En
            </span>
          </div>
        </div>
      </label>
    </div>
  );
};

export default LanguageSwitcher;
