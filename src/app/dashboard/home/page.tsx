import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import RecentTable from "@/components/Tables/Recent";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "My Studies | Sela Bible Poetry"
  // other metadata
};

const HomePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    sortBy?: string;
    sortAsc?: string;
  }>;
}) => {
  const sp = (await searchParams) ?? {};
  const query = sp.query || '';
  const currentPage = Number(sp.page) || 1;
  const sortBy = sp.sortBy || '';
  const sortAsc = Boolean(sp.sortAsc);
    
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
