"use client";

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import Pagination from "@/components/Paginations/Pagination";
import SearchBar from "@/components/Tables/Search";
import { BrowseCard, SortSelect, PUBLIC_SORTS } from "@/components/Dashboard/StudyCards";
import SortableColumnHeader from "@/components/Tables/SortableColumnHeader";
import { fetchPublicStudies } from '@/lib/actions';
import { FetchStudiesResult } from '@/lib/data';
import { formatBookAndPassage } from "@/lib/utils";

export default function PublicTable({
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
  
  const sortDict: Record<string, any> = {
    name: "name",
    passage: "passage",
    created_at: "createdTime",
    last_modified: "updatedTime",
  };
  const [studiesResult, setStudiesResult] = useState<FetchStudiesResult>({ records: [], totalPages: 1});

  const sortKey = sortBy !== "" ? sortDict[sortBy] ?? "updatedTime" : "updatedTime";

  async function fetchStudies() {
    const [result] = await Promise.all([fetchPublicStudies(query, currentPage, sortKey, sortAsc)]);
    setStudiesResult(result);
  }

  useEffect(() => {
    fetchStudies();
  }, [currentPage, sortBy, sortAsc]);


  return (
    <>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="min-w-0 flex-1"><SearchBar placeholder="Search study by name or passage..." /></div>
      <SortSelect options={PUBLIC_SORTS} className="lg:hidden" />
    </div>
    <div className="lg:rounded-sm lg:border lg:border-stroke lg:bg-white lg:px-7.5 lg:pt-6 lg:pb-2.5 lg:shadow-default dark:border-strokedark lg:dark:bg-boxdark xl:pb-1">
      {/* Desktop: the table. Under 1024px: the cards below. */}
      <div className="hidden max-w-full overflow-x-auto lg:block">
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
                    {studyItem.createdAt?.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {studyItem.lastUpdated?.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark flex items-center">
                  <div className="mr-3 h-8 w-full max-w-8 overflow-hidden rounded-full">
                    <Image src={studyItem.ownerAvatarUrl ? studyItem.ownerAvatarUrl : ""} width="40" height="40" alt="Avatar" />
                  </div>
                    <p className="text-black dark:text-white">
                      {studyItem.ownerDisplayName}
                    </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3.5 lg:hidden">
        {studiesResult.records.map((studyItem) => (
          <BrowseCard key={studyItem.id} study={studyItem} showOwner />
        ))}
      </ul>
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
