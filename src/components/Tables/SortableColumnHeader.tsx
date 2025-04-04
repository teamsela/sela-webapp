"use client";

import { useState } from 'react';

import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SortableColumnHeader({displayHeader, sortKey} : {displayHeader:string, sortKey:string}) { 
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSortBy = searchParams.get('sortBy');
    const currentSortAsc = Boolean(searchParams.get('sortAsc'));  
  
    const createSortUrl = ():string => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        params.set('sortBy', sortKey);
        if (currentSortBy == sortKey && !currentSortAsc) {
          params.set('sortAsc', 'true');
        } else {
          params.delete('sortAsc');
        }
        return `${pathname}?${params.toString()}`;  
    };
    return (<Link className="flex hover:bg-meta-2 hover:text-primary items-center" href={createSortUrl()}>
        <span> {displayHeader} </span>
        <div className="ml-2 inline-flex flex-col space-y-[2px]">
          <span className="inline-block">
            <svg
              className="fill-current"
              width="10"
              height="5"
              viewBox="0 0 10 5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 0L0 5H10L5 0Z" fill="lightgrey" />
            </svg>
          </span>
          <span className="inline-block">
            <svg
              className="fill-current"
              width="10"
              height="5"
              viewBox="0 0 10 5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 5L10 0L-4.37114e-07 8.74228e-07L5 5Z"
                fill="lightgrey"
              />
            </svg>
          </span>
        </div>
      </Link>);
}