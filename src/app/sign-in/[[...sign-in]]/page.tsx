'use client';

import { SignIn } from '@clerk/nextjs';
import React, {useState, useEffect} from "react";
import Image from 'next/image'
import Link from 'next/link'

export default function SignInPage() {
  const [isMobile, setIsMobile] = useState(false)

  //choose the screen size
  const handleResize = () => {
    if (window.innerWidth < 640) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }

    // create an event listener
    useEffect(() => {
      window.addEventListener("resize", handleResize)
    })
    return (
      <main>
        <div className={`min-h-screen justify-center items-center ${isMobile? "flex-row" : "flex"} `}>
          <div style={{marginRight: 100}} className={`flex flex-col items-center w-2/5 ${isMobile ? "ml-30 my-10" : ""}`}>
            <Image src="/images/digging-for-gems.png" width={0} height={0} sizes="100vw" alt="Bible Poetry Logo" className="w-full" />
            <Link
              href="/playground"
              className="mt-16 rounded-lg bg-primary py-4 px-12 text-center text-lg font-semibold text-white hover:bg-opacity-90"
            >
              Try Now
            </Link>
          </div>
          <div className="flex w-full flex-1 justify-center gap-2 px-8 sm:max-w-md">
            <SignIn />
          </div>
        </div>
      </main>
    );
}