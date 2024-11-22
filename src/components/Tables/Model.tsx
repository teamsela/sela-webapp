import { getXataClient } from '@/xata';
import { clerkClient } from '@clerk/nextjs';

import SearchBar from "@/components/Tables/Search";
import Pagination from "@/components/Paginations/Pagination";
import Link from 'next/link';

const xataClient = getXataClient();

export default async function ModelTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  // may make PAGINATION_SIZE editable by user later
  const PAGINATION_SIZE = 10;
  
  // fetch all studies from xata
  const search = await xataClient.db.study.search("", {
    filter: {
      $all:[
        {model: true},
        {
          $any: [
            { name: {$iContains: query }},
            { passage: {$iContains: query }}
          ]
        },  
      ]
    },
    page: {
      size: PAGINATION_SIZE,
      offset: (currentPage-1) * PAGINATION_SIZE
    }
  });
  const studies = search.records;
  const totalPages = Math.ceil(search.totalCount/PAGINATION_SIZE);

  // extract the ids from owner column and add them into a set
  const uniqueIds = new Set<string>();
  studies.forEach((study) => {
    uniqueIds.add(study?.owner ? study.owner : "");
  });

  // fetch ids and sessions of owners from clerk
  const users = await clerkClient.users.getUserList( { userId: Array.from( uniqueIds ) } );

  return (
    <>
    <SearchBar placeholder="Search study by name or passage..." />
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
