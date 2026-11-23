'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ClassroomManager from "@/components/Classroom/ClassroomManager";
import ClassroomTable from "@/components/Tables/Classroom";
import { fetchClassroomDetails } from '@/lib/classroomActions';
import { ClassroomDetails } from '@/lib/data';

export default function ClassroomView({
  classroomId,
  query,
  currentPage,
  sortBy,
  sortAsc,
}: {
  classroomId: string;
  query: string;
  currentPage: number;
  sortBy: string;
  sortAsc: boolean;
}) {
  // undefined = loading, null = not found / no access
  const [details, setDetails] = useState<ClassroomDetails | null | undefined>(undefined);

  const load = useCallback(() => {
    fetchClassroomDetails(classroomId)
      .then(setDetails)
      .catch((error) => {
        console.error("Failed to fetch classroom:", error);
        setDetails(null);
      });
  }, [classroomId]);

  useEffect(() => { load(); }, [load]);

  if (details === undefined) return null;
  if (details === null) {
    return (
      <>
        <Breadcrumb pageName="Classroom" />
        <div className="text-center py-10">
          <h2 className="text-xl">This classroom does not exist or you are not a member of it.</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={details.name} />
      <div className="flex flex-col gap-10">
        {details.canManage && <ClassroomManager details={details} onChanged={load} />}
        <Suspense key={query + currentPage}>
          <ClassroomTable classroomId={classroomId} query={query} currentPage={currentPage} sortBy={sortBy} sortAsc={sortAsc} />
        </Suspense>
      </div>
    </>
  );
}
