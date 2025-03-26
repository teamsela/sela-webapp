import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import RecentTable from "@/components/Tables/Recent";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "My Studies | Sela Bible Poetry"
  // other metadata
};

const HomePage = ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    sortBy?: string;
    sortAsc?: string;
  };
}) => {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const sortBy = searchParams?.sortBy || '';
  const sortAsc = Boolean(searchParams?.sortAsc);
    
  return (
    <>
      <Breadcrumb pageName="My Studies" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <RecentTable query={query} currentPage={currentPage} sortBy={sortBy} sortAsc={sortAsc}/>
        </Suspense>        
      </div>
    </>
  );
};

export default HomePage;
