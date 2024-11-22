import { Suspense } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ModelTable from "@/components/Tables/Model";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Pre-Marked Studies | Sela Bible Poetry"
  // other metadata
};

const ModelPage = ({
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
      <Breadcrumb pageName="Pre-Marked Studies" />

      <div className="flex flex-col gap-10">
        <Suspense key={query + currentPage}>
          <ModelTable query={query} currentPage={currentPage} />
        </Suspense>        
      </div>
    </>
  );
};

export default ModelPage;
