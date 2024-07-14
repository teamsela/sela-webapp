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


const Header = ({
  study,
  setLangToHebrew,
  setStructureOpen,
  setMotifOpen,
  setSyntaxOpen,
  setSoundsOpen,
  setInfoPaneOpen,
  setAllInfoPaneClose,
  structureOpen,
  motifOpen,
  syntaxOpen,
  soundsOpen,
  infoPaneOpen,
}: {
  study: StudyData;
  setLangToHebrew: (arg: boolean) => void;
  setStructureOpen: (arg: boolean) => void;
  setMotifOpen: (arg: boolean) => void;
  setSyntaxOpen: (arg: boolean) => void;
  setSoundsOpen: (arg: boolean) => void;
  setInfoPaneOpen: (arg: boolean) => void;
  setAllInfoPaneClose: () => void;
  structureOpen: boolean;
  motifOpen: boolean;
  syntaxOpen: boolean;
  soundsOpen: boolean;
  infoPaneOpen: boolean;
}) => {
  useEffect(() => {
    setInfoPaneOpen(structureOpen || motifOpen || syntaxOpen || soundsOpen);
  }, [structureOpen, motifOpen, syntaxOpen, soundsOpen]);
  return (
    <header className="sticky left-0 top-0 z-9999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-8">
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
            <h4 className="text-black text-title-sm dark:text-white">Psalm {study.passage}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2 2xsm:gap-6 2xl:w-2/5 w-1/3 justify-end">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/*<div className="hidden sm:block mr-2">*/}
            {/* <Tabs /> */}  
            {/*</div>*/}
            <StructureBtn setStructureOpen={setStructureOpen}  structureOpen={structureOpen} setAllInfoPaneClose={setAllInfoPaneClose}/>
            <MotifBtn setMotifOpen={setMotifOpen} motifOpen={motifOpen} setAllInfoPaneClose={setAllInfoPaneClose}/>
            <SyntaxBtn setSyntaxOpen={setSyntaxOpen}  syntaxOpen={syntaxOpen} setAllInfoPaneClose={setAllInfoPaneClose}/>
            <SoundsBtn setSoundsOpen={setSoundsOpen} soundsOpen={soundsOpen}setAllInfoPaneClose={setAllInfoPaneClose} />
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
