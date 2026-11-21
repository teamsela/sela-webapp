'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import DeleteStudyModal from '@/components/Modals/DeleteStudy';
import EditStudyModal from '@/components/Modals/EditStudy';
import Pagination from "@/components/Paginations/Pagination";
import PublicSwitcher from '@/components/Tables/Recent/PublicSwitcher';
import StarToggler from '@/components/Tables/Recent/StarToggler';
import SearchBar from "@/components/Tables/Search";
import { MyStudyCard, SortSelect, MY_SORTS } from "@/components/Dashboard/StudyCards";
import SortableColumnHeader from "@/components/Tables/SortableColumnHeader";
import { fetchRecentStudies } from '@/lib/actions';
import { FetchStudiesResult } from '@/lib/data';
import { formatBookAndPassage } from "@/lib/utils";

export default function RecentTable({
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

  const [studiesResult, setStudiesResult] = useState<FetchStudiesResult>({ records: [], totalPages: 1});
  const [triggerFetch, setTriggerFetch] = useState<boolean>(false);

  const sortDict: Record<string, any> = {
    name: "name",
    passage: "passage",
    created_at: "createdTime",
    last_modified: "updatedTime",
    shared_to_public: "public"
  };
  
  const sortKey = sortBy !== "" ? sortDict[sortBy] ?? "xata.updatedAt" : "xata.updatedAt";
  async function fetchStudies() {
    const [result] = await Promise.all([fetchRecentStudies(query, currentPage, sortKey, sortAsc)]);
    setStudiesResult(result);
  }

  useEffect(() => {
    fetchStudies();
  }, [currentPage, sortBy, sortAsc]);

  useEffect(() => {
    if (triggerFetch) {
      setTimeout(() => fetchStudies(), 3000);
      setTriggerFetch(false);
    }
  }, [triggerFetch]);

  return (
    <>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="min-w-0 flex-1"><SearchBar placeholder="Search study by name or passage..." /></div>
      <SortSelect options={MY_SORTS} className="lg:hidden" />
    </div>
    <div className="lg:rounded-sm lg:border lg:border-stroke lg:bg-white lg:px-7.5 lg:pt-6 lg:pb-2.5 lg:shadow-default dark:border-strokedark lg:dark:bg-boxdark xl:pb-1">
      {/* Desktop: the table. Under 1024px: the cards below. */}
      <div className="hidden max-w-full overflow-x-auto lg:block">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                < SortableColumnHeader displayHeader={"Name"} sortKey={"name"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                < SortableColumnHeader displayHeader={"Passage"} sortKey={"passage"}/>
              </th>
              <th className="hidden min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:table-cell xl:pl-11">
                < SortableColumnHeader displayHeader={"Created At"} sortKey={"created_at"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                < SortableColumnHeader displayHeader={"Last Modified"} sortKey={"last_modified"}/>
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
              < SortableColumnHeader displayHeader={"Shared to Public"} sortKey={"shared_to_public"}/>
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {studiesResult.records.map((studyItem) => (
              <tr key={studyItem.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <Link href={"/study/" + studyItem.id.replace("rec_", "") + "/edit"}>
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
                <td className="hidden border-b border-[#eee] py-5 px-4 dark:border-strokedark xl:table-cell">
                  <p className="text-black dark:text-white">
                    {studyItem.createdAt?.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {studyItem.lastUpdated?.toLocaleString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <PublicSwitcher studyId={studyItem.id} publicAccess={studyItem.public ? true : false} />
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center space-x-3.5">
                    <EditStudyModal studyId={studyItem.id} studyName={studyItem.name} setTriggerFetch={setTriggerFetch} />
                    <DeleteStudyModal studyItem={studyItem} setTriggerFetch={setTriggerFetch} />
                    <StarToggler studyId={studyItem.id} isStarred={studyItem.starred ? true : false} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3.5 lg:hidden">
        {studiesResult.records.map((studyItem) => (
          <MyStudyCard key={studyItem.id} study={studyItem} setTriggerFetch={setTriggerFetch} />
        ))}
      </ul>
      {
        studiesResult.totalPages > 0 
          ? <Pagination totalPages={ studiesResult.totalPages } /> 
          : (<div className="text-center py-5">
            <h2 className="text-xl"> No study found </h2>
          </div>)
      }
    </div>
    </>
  );
};
