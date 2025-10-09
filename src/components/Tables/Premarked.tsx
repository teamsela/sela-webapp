'use client';

import { useState, useEffect } from 'react';

import SearchBar from "@/components/Tables/Search";
import SortableColumnHeader from "@/components/Tables/SortableColumnHeader";
import Pagination from "@/components/Paginations/Pagination";
import Link from 'next/link';
import { FetchStudiesResult } from '@/lib/data';
import { fetchModelStudies } from '@/lib/actions';

export default async function PremarkedTable({
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

  const [studiesResult, setStudiesResult] = useState<FetchStudiesResult>({
    records: [],
    totalPages: 1,
  });
  
  const sortDict: Record<string, any> = {
    name: "name",
    passage: "passage",
  };

  const sortKey = sortBy !== "" ? sortDict[sortBy] ?? "name" : "name";

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const result = await fetchModelStudies(query, currentPage, sortKey, sortAsc);
        setStudiesResult(result);
      } catch (error) {
        console.error("Failed to fetch studies:", error);
      }
    };

    fetchStudies();
  }, [query, currentPage, sortBy, sortAsc]);

  return (
    <>
    <SearchBar placeholder="Search study by name or passage..." />
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                < SortableColumnHeader displayHeader={"Name"} sortKey={"name"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                < SortableColumnHeader displayHeader={"Passage"} sortKey={"passage"}/>
              </th>
              <th className="min-w-[10px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
              </th>
          </tr>
          </thead>
          <tbody>
            {studiesResult.records.map((studyItem) => (
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
        studiesResult.totalPages > 0 
          ? <Pagination totalPages={ studiesResult.totalPages } /> 
          : (<div className="text-center py-5">
            <h2 className="text-xl"> Oops, we have nothing like that in our database...</h2>
          </div>)
      }
    </div> 
    </>
  );
};
