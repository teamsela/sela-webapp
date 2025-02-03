import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import RecentTable from "@/components/Tables/Recent";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Personal Studies | Sela Bible Poetry"
  // other metadata
};

const HomePage = ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) => {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
    
  return (
    <>
      <Breadcrumb pageName="Personal Studies" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <RecentTable query={query} currentPage={currentPage} />
        </Suspense>        
      </div>
    </>
  );
};

export default HomePage;
