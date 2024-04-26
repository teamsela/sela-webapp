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


const Header = ({
  study,
  isHebrew,
  setLangToHebrew
}: {
  study: StudyData;
  isHebrew: boolean;
  setLangToHebrew: (arg: boolean) => void;
}) => {
  return (
    <header className="sticky left-0 top-0 z-9999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center w-1/2">
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
        <div className="flex items-center w-1/4">
          <div className="flex items-center gap-2 sm:gap-4 px-4">
            <FaBible fontSize="1.5em" />
            <h4 className="text-black text-title-sm dark:text-white">Psalm {study.passage}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7 w-1/2 justify-end">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <div className="hidden sm:block mr-5">
              <Tabs />
            </div>
            <LanguageSwitcher isHebrew={isHebrew} setLangToHebrew={setLangToHebrew} />
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
