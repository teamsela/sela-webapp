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
import { MotifBtn, SoundsBtn, StructureBtn, SyntaxBtn } from "../Toolbar/Buttons";
import { useEffect } from "react";
import { InfoPaneActionType } from "@/lib/types";


const Header = ({
  study,
  setLangToHebrew,
  setInfoPaneAction,
  infoPaneAction,
}: {
  study: StudyData;
  setLangToHebrew: (arg: boolean) => void;
  setInfoPaneAction: (arg: InfoPaneActionType) => void;
  infoPaneAction: InfoPaneActionType;
}) => {
  useEffect(() => {
    setInfoPaneAction(infoPaneAction);
  }, [infoPaneAction]);
  return (
    <header id="selaHeader" className="fixed left-0 top-0 z-9999 flex w-full bg-white">
      <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-8 border-b-2" style={{borderColor: 'rgb(203 213 225)'}}>
        <div className="flex items-center 2xl:w-2/5 w-1/3">
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
        <div className="flex items-center justify-center w-1/3 2xl:w-1/5 2xl:justify-center ">
          <div className="flex items-center gap-4 sm:gap-4 px-4">
            <FaBible fontSize="1.5em" />
            <div className="text-black text-md md:text-lg dark:text-white">Psalm {study.passage}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2 md:gap-1 sm:gap-0.5 2xsm:gap-0.25 2xl:w-2/5 w-1/3 justify-end">
          <ul className="flex items-center flex-col md:flex-row gap-1 lg:gap-2 md:gap-1 sm:gap-0.5 2xsm:gap-0.25">
            {/*<div className="hidden sm:block mr-2">*/}
            {/* <Tabs /> */}  
            {/*</div>*/}
            <StructureBtn setInfoPaneAction={setInfoPaneAction} infoPaneAction={infoPaneAction} />
            <MotifBtn setInfoPaneAction={setInfoPaneAction} infoPaneAction={infoPaneAction}/>
            <SyntaxBtn setInfoPaneAction={setInfoPaneAction} infoPaneAction={infoPaneAction} />
            <SoundsBtn setInfoPaneAction={setInfoPaneAction} infoPaneAction={infoPaneAction} />
            <LanguageSwitcher setLangToHebrew={setLangToHebrew}/>
            {/* <!-- Dark Mode Toggler --> */}
            {/*<DarkModeSwitcher />*/}
            {/* <!-- Dark Mode Toggler --> */}
          </ul>

          {/* <!-- User Area --> */}
          {<DropdownUser />}
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
