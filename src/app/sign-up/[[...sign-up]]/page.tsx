"use client";

import { SignUp } from '@clerk/nextjs';
import React, {useState, useEffect} from "react";
import Image from 'next/image'



export default function Page() {
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
      <div className={`min-h-screen justify-center items-center ${isMobile? "flex-row" : "flex"}`}>
        <Image src="/images/digging-for-gems.png" width={isMobile? 150:768} alt="Bible Poetry Logo" style={{marginRight: 100}} className={`${isMobile ? "ml-30 my-10" : ""}`} />
        <div className="flex w-full flex-1 justify-center gap-2 px-8 sm:max-w-md">
          <SignUp />
        </div>
      </div>
    );
}