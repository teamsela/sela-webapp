"use client";

import { useState, useEffect } from "react";
import Loader from "@/components/common/Loader";

import Sidebar from "@/components/Sidebar";
import NewStudyModal from "@/components/Modals/NewStudy";
import FooterComponent from "@/components/Footer";
import { PhoneTabBar, PhoneTopBar, TabletRail } from "@/components/Dashboard/nav";
import { useStudyLayout } from "@/components/StudyPane/Responsive/layout";

/*
  The dashboard's frame at each width (see StudyPane/Responsive/layout):

    phone        logo and account at the top, the floating tab bar at the
                 bottom; the page scrolls as a whole, so the browser can tuck
                 its address bar away while scrolling
    tablet       a rail of labelled icons on the left; the page scrolls as a whole
    tabletWide+  the sidebar, as before

  The copyright notices sit at the end of every page.
*/
export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createStudyOpen, setCreateStudyOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { mode } = useStudyLayout();

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const copyright = <FooterComponent className="pt-8 text-xs leading-5 text-body dark:text-bodydark" />;

  if (loading) {
    return (
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <Loader />
      </div>
    );
  }

  if (mode === "phone") {
    return (
      <div className="min-h-dvh bg-[#F7F9FC] dark:bg-boxdark-2 dark:text-bodydark">
        <PhoneTopBar />
        <main className="px-4 pt-1" style={{ paddingBottom: "calc(max(env(safe-area-inset-bottom), 12px) + 160px)" }}>
          {children}
          {copyright}
        </main>
        <PhoneTabBar onNewStudy={() => setCreateStudyOpen(true)} />
        <NewStudyModal open={createStudyOpen} setOpen={setCreateStudyOpen} />
      </div>
    );
  }

  if (mode === "tablet") {
    return (
      <div className="min-h-dvh bg-[#F7F9FC] pl-[88px] dark:bg-boxdark-2 dark:text-bodydark">
        <TabletRail onNewStudy={() => setCreateStudyOpen(true)} />
        <main className="mx-auto max-w-screen-2xl px-6 pb-8 pt-7">
          {children}
          {copyright}
        </main>
        <NewStudyModal open={createStudyOpen} setOpen={setCreateStudyOpen} />
      </div>
    );
  }

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          createStudyOpen={createStudyOpen}
          setCreateStudyOpen={setCreateStudyOpen}
        />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
              {copyright}
            </div>
          </main>
          <NewStudyModal open={createStudyOpen} setOpen={setCreateStudyOpen} />
        </div>
      </div>
    </div>
  );
}
