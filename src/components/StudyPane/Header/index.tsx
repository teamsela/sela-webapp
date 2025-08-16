'use client';

import Image from "next/image";
import Link from "next/link";
import { FaBible } from "react-icons/fa";

import { StudyData } from '@/lib/data';

import Tabs from "./Tabs";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownUser from "./DropdownUser";
import LanguageSwitcher from "./LanguageSwitcher";
import Title from "./Title";
import Toolbar from "../Toolbar";
import { BoxDisplayStyle, InfoPaneActionType } from "@/lib/types";


const Header = ({
  study,
  setLangToHebrew,
  setInfoPaneAction,
  infoPaneAction,
  setScaleValue,
  //color functions
  setColorAction,
  setSelectedColor,
  setBoxStyle,
  setCloneStudyOpen  
}: {
  study: StudyData;
  setLangToHebrew: (arg: boolean) => void;
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
  setScaleValue: (arg: number) => void;
  //color functions
  setColorAction: (arg: number) => void,
  setSelectedColor: (arg: string) => void;
  setBoxStyle: (arg: BoxDisplayStyle) => void;  
  setCloneStudyOpen: (arg: boolean) => void;  
}) => {

  return (
    <header id="selaHeader" className="fixed top-0 left-0 w-full z-50 bg-white drop-shadow-2 z-9999 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex justify-between items-center px-6 py-4 border-b-2" style={{borderColor: 'rgb(203 213 225)'}}>
        <div className="flex-1 justify-left">        
          <div className="flex items-center">
            <Link className="block flex-shrink-0" href="/">
              <Image
                width={46}
                height={46}
                src={"/images/logo/logo-icon.svg"}
                alt="Logo"
              />
            </Link>
            <div className="text-primary font-bold ml-6 pr-6">
              <Title study={study} />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-center items-center gap-4 sm:gap-4 px-4">
            <FaBible fontSize="1.5em" />
            <div className="text-black text-md md:text-lg dark:text-white">{study.book} {study.passage}</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-end items-center sm:gap-1 md:gap-2 lg:gap-4">
              <Tabs setInfoPaneAction={setInfoPaneAction} infoPaneAction={infoPaneAction} />

              <LanguageSwitcher setLangToHebrew={setLangToHebrew}/>

              {/* <!-- Dark Mode Toggler --> */}
              {/*<DarkModeSwitcher />*/}
              {/* <!-- Dark Mode Toggler --> */}

              {/* <!-- User Area --> */}
              {<DropdownUser />}
              {/* <!-- User Area --> */}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          <Toolbar
            study={study}
            setScaleValue={setScaleValue}
            //color functions
            setColorAction={setColorAction}
            setSelectedColor={setSelectedColor}
            setBoxStyle={setBoxStyle}
            setCloneStudyOpen={setCloneStudyOpen}
          />        
        </div>
      </div>
    </header>
  );
};

export default Header;
