"use client";

import { SignIn } from '@clerk/nextjs';
import React, {useState, useEffect} from "react";


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
          <img src="/images/digging-for-gems.png" width="40%" style={{marginRight: 100}} className={`${isMobile ? "ml-30 my-10" : ""}`} />
          <div className="flex w-full flex-1 justify-center gap-2 px-8 sm:max-w-md">
            <SignIn />
          </div>
        </div>
      </main>
    );
}