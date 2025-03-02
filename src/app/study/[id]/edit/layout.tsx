"use client";

import { useState, useEffect } from "react";
import Loader from "@/components/common/Loader";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/StudyPane/Header";
import NewStudyModal from "@/components/Modals/NewStudy";


export default function Layout({ children }: { children: React.ReactNode }) {

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (

    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {loading ? (
        <Loader />
      ) : (
        <div className="h-screen flex flex-col">
          {/* <!-- ===== Study Content Start ===== --> */}
          {children}
          {/* <!-- ===== Study Content End ===== --> */}
        </div>
      )}
    </div>
  );
}
