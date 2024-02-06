import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PublicTable from "@/components/Tables/Public";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Public - Sela Bible Poetry"
  // other metadata
};

const PublicPage = ({
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
      <Breadcrumb pageName="Public" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <PublicTable query={query} currentPage={currentPage} />
        </Suspense>        
      </div>
    </>
  );
};

export default PublicPage;
