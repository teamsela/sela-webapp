'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import SearchBar from "@/components/Tables/Search";
import PublicSwitcher from '@/components/Tables/Recent/PublicSwitcher';
import StarToggler from '@/components/Tables/Recent/StarToggler';
import DeleteStudyModal from '@/components/Modals/DeleteStudy';
import EditStudyModal from '@/components/Modals/EditStudy';
import Pagination from "@/components/Paginations/Pagination";
import { FetchStudiesResult } from '@/lib/data';
import { fetchRecentStudies } from '@/lib/actions';
import Loader from "@/components/common/Loader";

export default function RecentTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {

  const [studiesResult, setStudiesResult] = useState<FetchStudiesResult>({ records: [], totalPages: 1});
  const [triggerFetch, setTriggerFetch] = useState<boolean>(false);

  async function fetchStudies() {
    const [result] = await Promise.all([fetchRecentStudies(query, currentPage)]);
    setStudiesResult(result);
  }

  useEffect(() => {
    fetchStudies();
  }, []);

  useEffect(() => {
    if (triggerFetch) {
      setTimeout(() => fetchStudies(), 3000);
      setTriggerFetch(false);
    }
  }, [triggerFetch]);

  if (studiesResult.records.length == 0) {
    return (
      <Loader />
    )
  }
  
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
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Last Modified
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Shared to Public
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
                    Psalm {studyItem.passage}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {studyItem.lastUpdated}
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
