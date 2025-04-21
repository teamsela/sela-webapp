import { getXataClient } from '@/xata';
import { currentUser, clerkClient } from '@clerk/nextjs';
import Image from 'next/image'

import SearchBar from "@/components/Tables/Search";
import SortableColumnHeader from "@/components/Tables/SortableColumnHeader";
import Pagination from "@/components/Paginations/Pagination";
import Link from 'next/link';

const xataClient = getXataClient();

export default async function PublicTable({
  query,
  currentPage,
  sortBy,
  sortAsc
}: {
  query: string;
  currentPage: number;
  sortBy: string;
  sortAsc: boolean;
}) {
  
  // may make PAGINATION_SIZE editable by user later
  const PAGINATION_SIZE = 10;
  const sortDict: Record<string, any> = {
    name: "name",
    passage: "passage",
    created_at: "xata.createdAt",
    last_modified: "xata.updatedAt",
  };
  
  const sortKey = sortBy !== "" ? sortDict[sortBy] ?? "xata.updatedAt" : "xata.updatedAt";
  // fetch all studies from xata
  const filter = {
    model: { $is: false }, public: { $is: true },
    $any: [{ name: { $contains: query } }, { name: { $contains: query } }]
  };
  const search = (await xataClient.db.study.filter(filter).sort(sortKey, sortAsc ? "asc" : "desc")
    .getPaginated({
      pagination: { size: PAGINATION_SIZE, offset: (currentPage-1) * PAGINATION_SIZE }
    }));
  const dbQuery = await xataClient.db.study.filter(filter).getAll();
 
  const studies = search.records;
  const totalPages = Math.ceil(dbQuery.length/PAGINATION_SIZE);

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
    <SearchBar placeholder="Search study by name or passage..." />
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] flex py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                < SortableColumnHeader displayHeader={"Name"} sortKey={"name"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                < SortableColumnHeader displayHeader={"Passage"} sortKey={"passage"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                < SortableColumnHeader displayHeader={"Created At"} sortKey={"created_at"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                < SortableColumnHeader displayHeader={"Last Modified"} sortKey={"last_modified"}/>
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
                  <Link href={"/study/" + studyItem.id.replace("rec_", "") + "/view"}>
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
                    {studyItem.xata.createdAt.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {studyItem.xata.updatedAt.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark flex items-center">
                  <div className="mr-3 h-8 w-full max-w-8 overflow-hidden rounded-full">
                    <Image src={mp.get(studyItem.owner)?.imageUrl} width="40" height="40" alt="Avatar" />
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
      {
        totalPages > 0 
          ? <Pagination totalPages={ totalPages } /> 
          : (<div className="text-center py-5">
            <h2 className="text-xl"> Oops, we have nothing like that in our database...</h2>
          </div>)
      }
    </div>
    </>
  );
};
