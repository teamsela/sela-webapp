'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import Pagination from "@/components/Paginations/Pagination";
import SearchBar from "@/components/Tables/Search";
import SortableColumnHeader from "@/components/Tables/SortableColumnHeader";
import { fetchClassroomStudies } from '@/lib/classroomActions';
import { FetchStudiesResult } from '@/lib/data';
import { formatBookAndPassage } from "@/lib/utils";

export default function ClassroomTable({
  classroomId,
  query,
  currentPage,
  sortBy,
  sortAsc
}: {
  classroomId: string;
  query: string;
  currentPage: number;
  sortBy: string;
  sortAsc: boolean;
}) {
  const [studiesResult, setStudiesResult] = useState<FetchStudiesResult>({ records: [], totalPages: 1 });

  const sortDict: Record<string, string> = {
    name: "name",
    passage: "passage",
    last_modified: "updatedTime",
  };
  const sortKey = sortDict[sortBy] ?? "sharedTime";

  useEffect(() => {
    fetchClassroomStudies(classroomId, query, currentPage, sortKey, sortAsc)
      .then(setStudiesResult)
      .catch((error) => console.error("Failed to fetch classroom studies:", error));
  }, [classroomId, query, currentPage, sortKey, sortAsc]);

  return (
    <>
    <SearchBar placeholder="Search study by name or passage..." />
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                <SortableColumnHeader displayHeader={"Name"} sortKey={"name"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                <SortableColumnHeader displayHeader={"Passage"} sortKey={"passage"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                <SortableColumnHeader displayHeader={"Last Modified"} sortKey={"last_modified"}/>
              </th>
              <th className="min-w-[160px] py-4 px-4 font-medium text-black dark:text-white">
                Shared By
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
                    {formatBookAndPassage(studyItem.book, studyItem.passage)}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {studyItem.lastUpdated?.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center">
                    {studyItem.ownerAvatarUrl && (
                      <div className="mr-3 h-8 w-full max-w-8 overflow-hidden rounded-full">
                        <Image src={studyItem.ownerAvatarUrl} width="40" height="40" alt="Avatar" />
                      </div>
                    )}
                    <p className="text-black dark:text-white">{studyItem.ownerDisplayName}</p>
                  </div>
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
            <h2 className="text-xl">No studies have been shared to this classroom yet.</h2>
            <p className="mt-2 text-sm">Use the share icon in My Studies to share one.</p>
          </div>)
      }
    </div>
    </>
  );
};
