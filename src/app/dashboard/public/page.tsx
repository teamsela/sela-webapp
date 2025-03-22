import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PublicTable from "@/components/Tables/Public";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Public Studies | Sela Bible Poetry"
  // other metadata
};

const PublicPage = ({
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
      <Breadcrumb pageName="Public Studies" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <PublicTable query={query} currentPage={currentPage} sortBy={sortBy} sortAsc={sortAsc}/>
        </Suspense>        
      </div>
    </>
  );
};

export default PublicPage;
