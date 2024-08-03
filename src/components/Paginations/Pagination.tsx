"use client";

import React from "react";
import Link from "next/link";

import { useSearchParams, usePathname } from 'next/navigation';

export default function Pagination({
    totalPages,
} : {
    totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;  
  const pageIndexes = Array.from({length: totalPages}, (_, i) => i + 1);

  const createPageURL = (targetPage:number):string => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set('page', targetPage.toString());
      return `${pathname}?${params.toString()}`;  
    }
    return "#";
  };

  return (
    <div className="p-4 sm:p-6 xl:p-7.5">
        <nav>
          <ul className="flex flex-wrap items-center">
            <li>
              <Link
                className={`flex h-9 w-9 items-center justify-center rounded-l-md border border-stroke ${currentPage == 1 ? "pointer-events-none" : "hover:border-primary hover:bg-gray hover:text-primary"}`}
                href={createPageURL(currentPage-1)}
              >
                <svg
                  className="fill-current"
                  width="8"
                  height="16"
                  viewBox="0 0 8 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.17578 15.1156C7.00703 15.1156 6.83828 15.0593 6.72578 14.9187L0.369531 8.44995C0.116406 8.19683 0.116406 7.80308 0.369531 7.54995L6.72578 1.0812C6.97891 0.828076 7.37266 0.828076 7.62578 1.0812C7.87891 1.33433 7.87891 1.72808 7.62578 1.9812L1.71953 7.99995L7.65391 14.0187C7.90703 14.2718 7.90703 14.6656 7.65391 14.9187C7.48516 15.0312 7.34453 15.1156 7.17578 15.1156Z"
                    fill=""
                  />
                </svg>
              </Link>
            </li>
            { pageIndexes.map((i) => {
                return (<li key={i}>
                <Link
                    className={`flex items-center justify-center border border-stroke border-l-transparent px-4 py-[5px] font-medium 
                        ${ i ==  currentPage? "font-extrabold bg-gray" : "hover:border-primary hover:bg-gray hover:text-primary" }`}
                    href={createPageURL(i)}
                >
                    {i}
                </Link>
                </li>);
            })}
            <li>
              <Link
                className={`flex h-9 w-9 items-center justify-center rounded-r-md border border-stroke border-l-transparent  ${currentPage == totalPages ? "pointer-events-none" : "hover:border-primary hover:bg-gray hover:text-primary"}`}
                href={createPageURL(currentPage+1)}
              >
                <svg
                  className="fill-current"
                  width="8"
                  height="16"
                  viewBox="0 0 8 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.819531 15.1156C0.650781 15.1156 0.510156 15.0593 0.369531 14.9468C0.116406 14.6937 0.116406 14.3 0.369531 14.0468L6.27578 7.99995L0.369531 1.9812C0.116406 1.72808 0.116406 1.33433 0.369531 1.0812C0.622656 0.828076 1.01641 0.828076 1.26953 1.0812L7.62578 7.54995C7.87891 7.80308 7.87891 8.19683 7.62578 8.44995L1.26953 14.9187C1.15703 15.0312 0.988281 15.1156 0.819531 15.1156Z"
                    fill=""
                  />
                </svg>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
  );
};
