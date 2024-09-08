import React, { ChangeEvent, useState, useRef, useEffect } from "react";

const ScaleDropDown: React.FC = () => {
  const [scaleLevel, setScaleLevel] = useState(1);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fitScreen, setFitScreen] = useState(false);
  const [displayScaleLevel, setDisplayScaleLevel] = useState("100%"); 

  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);

  const PRESET_SCALE_LEVELS:[number,string][] = [[0.5, '50%'], [0.75, '75%'], [0.9, '90%'], 
        [1, '100%'], [1.25, '125%'], [1.5, '150%'], [2, '200%']];

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  // update input scale if the enter key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (keyCode !== 13) return;
      updateInputScaleLevel();
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDisplayScaleLevel(event.target.value);
  };

  const updateInputScaleLevel = () => {
    // update scale level with user input value
    let scale = parseInt(displayScaleLevel) / 100;
    scale = scale < 0.5 ? 0.5 : (scale > 2 ? 2 : scale);
    setScaleLevel(scale);
    
    setDisplayScaleLevel(`${scale * 100}%`);
    document.getElementById("scale-input")?.blur();
    fitScreen && setFitScreen(false);
    setDropdownOpen(false);
  }

  const handleScaleLevelSelect = (presetScale:number, presetScaleDisplay:string) => {
    setScaleLevel(presetScale);
    setDisplayScaleLevel(presetScaleDisplay);
    fitScreen && setFitScreen(false);
    setDropdownOpen(false)
  }

  const ScaleToFitScreen = () => {
    // calculate fit screen scale
    
    setFitScreen(true);
  };

  return (
        <div className="relative inline-block">
          <div
            ref={trigger}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1.5 rounded-md border border-stroke px-3 py-2 font-medium"
          >
            <input id="scale-input" 
              type="text" 
              value={displayScaleLevel}
              onChange={handleInputChange}
              className="w-16 border-r">
            </input>
            <svg
              className={`fill-current duration-200 ease-linear ${
                dropdownOpen && "rotate-180"
              }`}
              width="12"
              height="7"
              viewBox="0 0 12 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.564864 0.879232C0.564864 0.808624 0.600168 0.720364 0.653125 0.667408C0.776689 0.543843 0.970861 0.543844 1.09443 0.649756L5.82517 5.09807C5.91343 5.18633 6.07229 5.18633 6.17821 5.09807L10.9089 0.649756C11.0325 0.526192 11.2267 0.543844 11.3502 0.667408C11.4738 0.790972 11.4562 0.985145 11.3326 1.10871L6.60185 5.55702C6.26647 5.85711 5.73691 5.85711 5.41917 5.55702L0.670776 1.10871C0.600168 1.0381 0.564864 0.967492 0.564864 0.879232Z"
                fill=""
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.4719 0.229332L6.00169 4.48868L10.5171 0.24288C10.9015 -0.133119 11.4504 -0.0312785 11.7497 0.267983C12.1344 0.652758 12.0332 1.2069 11.732 1.50812L11.7197 1.52041L6.97862 5.9781C6.43509 6.46442 5.57339 6.47872 5.03222 5.96853C5.03192 5.96825 5.03252 5.96881 5.03222 5.96853L0.271144 1.50833C0.123314 1.3605 -5.04223e-08 1.15353 -3.84322e-08 0.879226C-2.88721e-08 0.660517 0.0936127 0.428074 0.253705 0.267982C0.593641 -0.0719548 1.12269 -0.0699964 1.46204 0.220873L1.4719 0.229332ZM5.41917 5.55702C5.73691 5.85711 6.26647 5.85711 6.60185 5.55702L11.3326 1.10871C11.4562 0.985145 11.4738 0.790972 11.3502 0.667408C11.2267 0.543844 11.0325 0.526192 10.9089 0.649756L6.17821 5.09807C6.07229 5.18633 5.91343 5.18633 5.82517 5.09807L1.09443 0.649756C0.970861 0.543844 0.776689 0.543843 0.653125 0.667408C0.600168 0.720364 0.564864 0.808624 0.564864 0.879232C0.564864 0.967492 0.600168 1.0381 0.670776 1.10871L5.41917 5.55702Z"
                fill=""
              />
            </svg>
          </div>  
          <div
            ref={dropdown}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setDropdownOpen(false)}
            className={`absolute left-0 top-full z-40 mt-2 w-full rounded-md border border-stroke bg-white py-3 shadow-card ${
              dropdownOpen === true ? "block" : "hidden"
            }`}
          >
            <ul className="flex flex-col">
                <li 
                  className="flex cursor=pointer  px-5 py-2 font-medium hover:bg-whiter hover:text-primary dark:hover:bg-meta-4"
                  onClick={()=>ScaleToFitScreen()}
                > Fit
                </li>
                <hr/>
                {
                    PRESET_SCALE_LEVELS.map( scalePair =>
                        (<li className="flex cursor=pointer px-5 py-2 font-medium hover:bg-whiter hover:text-primary dark:hover:bg-meta-4"
                          onClick={()=> handleScaleLevelSelect(...scalePair)}>
                            {scalePair[1]}
                        </li>)
                    )
                }
            </ul>
          </div>
        </div>
  );
};

export default ScaleDropDown;
