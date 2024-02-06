import { getXataClient } from '@/xata';
import { currentUser, clerkClient } from '@clerk/nextjs';

import { IconShare, IconTrash, IconEdit, IconStar, IconStarFilled } from "@tabler/icons-react";

import SearchBar from "@/components/Tables/Search";

const xataClient = getXataClient();

export default async function PublicTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {

  // fetch all studies from xata
  const studies = await xataClient.db.study.filter({ public: true }).getMany();

  // extract the ids from owner column and add them into a set
  const uniqueIds = new Set<string>();
  studies.forEach((study) => {
    uniqueIds.add(study?.owner ? study.owner : "");
  });

  // fetch ids and sessions of owners from clerk
  const users = await clerkClient.users.getUserList( { userId: Array.from( uniqueIds ) } );

  let mp = new Map();
  for (let i = 0; i < users.length; i++) {
    mp.set(users[i].id, users[i]);
  }

  const thisUser = await currentUser();

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
              <th className="min-w-[160px] py-4 px-4 font-medium text-black dark:text-white">
                Owner
              </th>
            </tr>
          </thead>
          <tbody>
            {studies.map((studyItem) => (
              <tr key={studyItem.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <h5 className="font-medium text-black dark:text-white">
                    {studyItem.name}
                  </h5>
                  <p className="text-sm">Psalm {studyItem.passage}</p>
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
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark flex items-center">
                  <div className="mr-3 h-8 w-full max-w-8 overflow-hidden rounded-full">
                    <img src={mp.get(studyItem.owner)?.imageUrl} alt="Avatar" />
                  </div>
                    <p className="text-black dark:text-white">
                      {thisUser?.id === studyItem.owner ? "me" : mp.get(studyItem.owner)?.firstName + " " + mp.get(studyItem.owner)?.lastName}
                    </p>
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
