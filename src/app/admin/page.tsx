import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

import AdminClassrooms from "@/components/Admin/AdminClassrooms";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "System Admin | Sela Bible Poetry"
};

const AdminPage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ classroom?: string }>;
}) => {
  // Only system admins may see this page. Every action it calls re-checks the
  // role server-side, so this is about not advertising the page, not security.
  const user = await currentUser();
  if ((user?.publicMetadata as { role?: string } | undefined)?.role !== 'sys_admin') {
    notFound();
  }
  const sp = (await searchParams) ?? {};

  return <AdminClassrooms selectedId={sp.classroom ?? null} />;
};

export default AdminPage;
