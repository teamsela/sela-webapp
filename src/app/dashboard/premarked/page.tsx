import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PremarkedTable from "@/components/Tables/Premarked";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Pre-Marked Studies | Sela Bible Poetry"
  // other metadata
};

const PremarkedPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    sortBy?: string;
    sortAsc?: string;
  }>;
}) => {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;
  const sortBy = params?.sortBy || '';
  const sortAsc = Boolean(params?.sortAsc);
    
  return (
    <>
      <Breadcrumb pageName="Pre-Marked Studies" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <PremarkedTable query={query} currentPage={currentPage} sortBy={sortBy} sortAsc={sortAsc}/>
        </Suspense>        
      </div>
    </>
  );
};

export default PremarkedPage;
