import { getXataClient } from '@/xata';
import { currentUser } from '@clerk/nextjs';
import Link from 'next/link'

import { IconShare, IconTrash, IconEdit, IconStar, IconStarFilled } from "@tabler/icons-react";

import SearchBar from "@/components/Tables/Search";

const xataClient = getXataClient();

export default async function RecentTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const user = await currentUser();

  const studies = await xataClient.db.study.filter({ owner: user?.id }).getMany();

  return (
    <>
    <SearchBar placeholder="Search study..." />
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Name
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Passage
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Last Modified
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Status
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {studies.map((studyItem) => (
              <tr key={studyItem.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <Link href={"/studies/" + studyItem.id + "/edit"}>
                    <h5 className="font-medium text-black dark:text-white">
                      {studyItem.name}
                    </h5>
                  </Link>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <p className="text-black dark:text-white">
                    Psalm {studyItem.passage}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {studyItem.xata.updatedAt.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p
                    className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                      studyItem.public 
                        ? "text-success bg-success"
                        : "text-danger bg-danger"
                    }`}
                  >
                    {studyItem.public ? "Public" : "Private" }
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center space-x-3.5">
                    <button className="hover:text-primary">
                      <IconEdit />
                    </button>
                    <button className="hover:text-primary">
                      <IconTrash />
                    </button>
                    <button className="hover:text-primary">
                      {studyItem.starred ? <IconStarFilled /> : <IconStar /> }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};
