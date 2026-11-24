import ClassroomView from "@/components/Classroom/ClassroomView";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Classroom | Sela Bible Poetry"
};

const ClassroomPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    query?: string;
    page?: string;
    sortBy?: string;
    sortAsc?: string;
  }>;
}) => {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  return (
    <ClassroomView
      classroomId={id}
      query={sp.query || ''}
      currentPage={Number(sp.page) || 1}
      sortBy={sp.sortBy || ''}
      sortAsc={Boolean(sp.sortAsc)}
    />
  );
};

export default ClassroomPage;
