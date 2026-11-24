import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { HiPlus, HiOutlineClock, HiUserGroup, HiAcademicCap, HiShieldCheck } from "react-icons/hi2";
import { FaBookReader } from "react-icons/fa";
import { PiBookBookmarkFill } from "react-icons/pi";

import { UserButton } from '@clerk/nextjs';

import { fetchMyClassrooms } from "@/lib/classroomActions";
import { MyClassroomsResult } from "@/lib/data";
import { eventBus } from "@/lib/eventBus";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  createStudyOpen: boolean;
  setCreateStudyOpen: (arg: boolean) => void;
  setCreateClassroomOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, setCreateStudyOpen, setCreateClassroomOpen }: SidebarProps) => {
  const pathname = usePathname();

  const [classroomInfo, setClassroomInfo] = useState<MyClassroomsResult>({ isClassAdmin: false, isSysAdmin: false, classrooms: [] });

  useEffect(() => {
    const load = () => {
      fetchMyClassrooms()
        .then(setClassroomInfo)
        .catch((error) => console.error("Failed to fetch classrooms:", error));
    };
    load();
    eventBus.on("classroomsChanged", load);
    return () => eventBus.off("classroomsChanged", load);
  }, []);

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
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6 overflow-y-auto">
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
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.includes("premarked") && "bg-graydark dark:bg-meta-4"
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

            </ul>
          </div>

          {/* <!-- System Admin --> */}
          {classroomInfo.isSysAdmin && (
            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <Link
                  href="/admin"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname.startsWith("/admin") && "bg-graydark dark:bg-meta-4"
                    }`}
                >
                  <HiShieldCheck size="20px" />
                  System Admin
                </Link>
              </li>
            </ul>
          )}
          {/* <!-- System Admin --> */}

          {/* <!-- Classrooms Group --> */}
          {(classroomInfo.isClassAdmin || classroomInfo.classrooms.length > 0) && (
            <div>
              <div className="mb-3 flex items-center justify-between px-4">
                <h3 className="text-sm font-semibold uppercase text-bodydark2">Classrooms</h3>
                {classroomInfo.isClassAdmin && (
                  <button
                    onClick={() => setCreateClassroomOpen(true)}
                    title="New classroom"
                    aria-label="New classroom"
                    className="rounded-sm p-1 text-bodydark1 hover:bg-graydark dark:hover:bg-meta-4"
                  >
                    <HiPlus size="16px" />
                  </button>
                )}
              </div>
              <ul className="mb-6 flex flex-col gap-1.5">
                {classroomInfo.classrooms.map((room) => {
                  const href = "/dashboard/classroom/" + room.id;
                  return (
                    <li key={room.id}>
                      <Link
                        href={href}
                        title={room.name}
                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${pathname === href && "bg-graydark dark:bg-meta-4"
                          }`}
                      >
                        <HiAcademicCap size="20px" className="shrink-0" />
                        <span className="truncate">{room.name}</span>
                      </Link>
                    </li>
                  );
                })}
                {classroomInfo.isClassAdmin && classroomInfo.classrooms.length === 0 && (
                  <li className="px-4 text-sm text-bodydark2">No classrooms yet.</li>
                )}
              </ul>
            </div>
          )}
          {/* <!-- Classrooms Group --> */}

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
