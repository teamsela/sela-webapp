import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { HiPlus, HiOutlineClock, HiUserGroup, HiFolder, HiFolderOpen, HiChevronDown, HiOutlineAcademicCap } from "react-icons/hi2";
import { FaBookReader } from "react-icons/fa";
import { PiBookBookmarkFill } from "react-icons/pi";

import { UserButton } from '@clerk/nextjs';

import { fetchTutorialStudies, type TutorialStudySummary } from "@/lib/actions";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  createStudyOpen: boolean;
  setCreateStudyOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, setCreateStudyOpen}: SidebarProps) => {
  const pathname = usePathname();

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  // Tutorials folder: open by default, filled from studies flagged tutorial = true.
  const [tutorialsOpen, setTutorialsOpen] = useState(true);
  const [tutorials, setTutorials] = useState<TutorialStudySummary[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchTutorialStudies()
      .then((rows) => { if (active) setTutorials(rows); })
      .catch(() => { if (active) setTutorials([]); });
    return () => { active = false; };
  }, []);


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

  return (
    <aside
      ref={sidebar}
      className={`relative left-0 top-0 z-9999 flex h-full w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full hidden"
        }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-center gap-2 mr-4 mb-8 lg:py-2.5">
        <Link href="/">
          <Image
            width={168}
            height={20}
            src={"/images/logo/logo.svg"}
            alt="Logo"
          />
        </Link>

      </div>
      {/* <!-- SIDEBAR HEADER --> */}



      <button onClick={() => setCreateStudyOpen(true)} className="inline-flex justify-left gap-3 rounded-full mx-8 bg-primary py-4 px-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
        <span><HiPlus size="24px" strokeWidth="1" /></span>
        New Study
      </button>


      <div className="flex flex-col justify-between h-full">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>


            <ul className="mb-6 flex flex-col gap-1.5">

              {/* <!-- Menu Item Recent --> */}
              <li>
                <Link
                  href="/dashboard/home"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("home") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  <FaBookReader size="18px" />
                  My Studies
                </Link>
              </li>
              {/* <!-- Menu Item Recent --> */}

              {/* <!-- Menu Item Public --> */}
              <li>
                <Link
                  href="/dashboard/public"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("public") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  <HiUserGroup size="20px" />
                  Public Studies
                </Link>
              </li>
              {/* <!-- Menu Item Public --> */}

              {/* <!-- Menu Item Premarked --> */}
              <li>
                <Link
                  href="/dashboard/premarked"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("model") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  <PiBookBookmarkFill size="20px" />
                  Pre-Marked Studies
                </Link>
              </li>
              {/* <!-- Menu Item Premarked --> */}

              {/* <!-- Menu Item Scriptura --> */}
              <li>
                <Link
                  href="/dashboard/scriptura"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("scriptura") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  {/* Masked so the icon takes the link's text color, like the react-icons above */}
                  <span
                    aria-hidden="true"
                    className="inline-block h-5 w-5 shrink-0 bg-current"
                    style={{
                      mask: "url(/images/icon/icon-scriptura.svg) center / contain no-repeat",
                      WebkitMask: "url(/images/icon/icon-scriptura.svg) center / contain no-repeat",
                    }}
                  />
                  Scriptura Studies
                </Link>
              </li>
              {/* <!-- Menu Item Scriptura --> */}

              {/* <!-- Menu Folder Tutorials --> */}
              <li>
                <button
                  type="button"
                  onClick={() => setTutorialsOpen((open) => !open)}
                  aria-expanded={tutorialsOpen}
                  aria-controls="sidebar-tutorials"
                  className="group relative flex w-full items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4"
                >
                  {tutorialsOpen ? <HiFolderOpen size="20px" /> : <HiFolder size="20px" />}
                  Tutorials
                  <HiChevronDown
                    size="16px"
                    className={`ml-auto transition-transform duration-200 ${tutorialsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {tutorialsOpen && (
                  <ul id="sidebar-tutorials" className="mt-1 flex flex-col gap-1 pl-6">
                    {tutorials === null && (
                      <li className="py-1.5 px-4 text-sm text-bodydark2">Loading…</li>
                    )}
                    {tutorials !== null && tutorials.length === 0 && (
                      <li className="py-1.5 px-4 text-sm text-bodydark2">No tutorials yet</li>
                    )}
                    {tutorials?.map((tutorial) => (
                      <li key={tutorial.id}>
                        <Link
                          href={`/study/${tutorial.id.replace(/^rec_/, "")}/view`}
                          className="group relative flex items-center gap-2.5 rounded-sm py-1.5 px-4 text-sm font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4"
                        >
                          <HiOutlineAcademicCap size="18px" className="shrink-0" />
                          {tutorial.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              {/* <!-- Menu Folder Tutorials --> */}

            </ul>
          </div>

        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
      
      <div>
        {/* <!-- Clerk User Box --> */}
        <div className="mt-auto mx-auto w-full max-w-60 rounded-sm border border-strokedark bg-boxdark px-4 py-4 shadow-default bg-opacity-60 hover:bg-opacity-100 mb-8">
          <UserButton afterSignOutUrl="/" 
            appearance={{
              elements: {
                rootBox: "relative flex w-full",
                userButtonBox: "gap-3.5",
                userButtonOuterIdentifier: "font-semibold text-white !antialiased order-1 text-base font-book pr-2",
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
