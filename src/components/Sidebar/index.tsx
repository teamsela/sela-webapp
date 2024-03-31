import React, { useEffect, useRef } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { IconHome, IconUsersGroup, IconPlus } from '@tabler/icons-react';
import { UserButton } from '@clerk/nextjs';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  createStudyOpen:boolean;
  setCreateStudyOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, createStudyOpen, setCreateStudyOpen}: SidebarProps) => {
  const pathname = usePathname();

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);


  // close on click outside

  //choose the screen size 
  const handleResize = () => {
    if (window.innerWidth < 640) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }

  // create an event listener
  useEffect(() => {
    window.addEventListener("resize", handleResize)
  })

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== "Escape") return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });


  return (
    <aside
      ref={sidebar}
      className={`relative left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full hidden"
        }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-center gap-2 mr-4 mb-8 lg:py-2.5">
        <Link href="/">
          <Image
            width={148}
            height={20}
            src={"/images/logo/logo.svg"}
            alt="Logo"
          />
        </Link>

      </div>
      {/* <!-- SIDEBAR HEADER --> */}



      <button onClick={() => setCreateStudyOpen(true)} className="inline-flex justify-left gap-3 rounded-full mx-8 bg-primary py-4 px-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
        <span><IconPlus /></span>
        New Study
      </button>


      <div className="no-scrollbar flex flex-col overflow-hidden duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>


            <ul className="mb-6 flex flex-col gap-1.5">

              {/* <!-- Menu Item Home --> */}
              <li>
                <Link
                  href="/dashboard/home"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("home") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  <IconHome />
                  Home
                </Link>
              </li>
              {/* <!-- Menu Item Home --> */}

              {/* <!-- Menu Item Public --> */}
              <li>
                <Link
                  href="/dashboard/public"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("public") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  <IconUsersGroup />
                  Public
                </Link>
              </li>
              {/* <!-- Menu Item Public --> */}


            </ul>
          </div>

        </nav>
        {/* <!-- Sidebar Menu --> */}

        {/* <!-- Clerk User Box --> */}
        <div className="mt-auto min-h-4 mx-auto mb-10 w-full max-w-60 rounded-sm border border-strokedark bg-boxdark px-4 py-4 shadow-default">
          <UserButton afterSignOutUrl="/" 
            appearance={{
              elements: {
                rootBox: "relative flex w-full",
                userButtonBox: "gap-3.5",
                userButtonOuterIdentifier: "text-bodydark1 !antialiased order-1 text-base font-book pr-2",
                userButtonTrigger: "cl-button after:absolute after:inset-0"
              },
            }}
            showName
          />
        </div>
        {/* <!-- Clerk User Box --> */}

        </div>
    </aside>
  );
};

export default Sidebar;
