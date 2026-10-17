import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ScripturaTable from "@/components/Tables/Scriptura";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Scriptura Studies | Sela Bible Poetry"
  // other metadata
};

const ScripturaPage = async ({
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
      <Breadcrumb pageName="Pre-Marked Studies" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <ScripturaTable query={query} currentPage={currentPage} sortBy={sortBy} sortAsc={sortAsc}/>
        </Suspense>        
      </div>
    </>
  );
};

export default ScripturaPage;
