  import React from "react";
  import CountDownTimer from "@/components/CountDownTimer";
  import Link from "next/link";
  import Image from "next/image";

  const ComingSoon: React.FC = () => {
    return (
      <div className="relative z-10 overflow-hidden bg-white px-4 dark:bg-boxdark-2 sm:px-8">
        <div className="flex h-screen flex-col items-center justify-center overflow-hidden">
          <div className="no-scrollbar overflow-y-auto py-20">
            <div className="mx-auto w-full max-w-[600px]">
              <div className="text-center">
                <Link href="/" className="mx-auto mb-10 inline-flex">
                  <Image
                    width={50}
                    height={50}
                    src={"/images/logo/logo-icon.svg"}
                    alt="Logo"
                    priority
                    className="dark:hidden"
                  />
                  <h1 className="ml-1 mt-2.5 text-3xl font-black text-black">BiblePoetry</h1>
                </Link>

                <h1 className="mb-2.5 text-3xl font-black text-black dark:text-white lg:text-4xl xl:text-[50px] xl:leading-[60px]">
                  Coming Soon
                </h1>

                <p className="font-medium">
                  Our website is currently under construction, enter your email address
                  to get latest updates and notifications about the website.
                </p>
              </div>
            </div>

            {/* <!-- Countdown timer start --> */}
            <div className="mt-10 flex justify-center">
              <CountDownTimer />
            </div>
            {/* <!-- Countdown timer start --> */}

            {/* <!-- subscription form start --> */}
            {/* TODO: check existing subscription on biblepoetry.org then implement email subscription */}
            <div className="mx-auto mt-12.5 w-full max-w-[580px]">
              <form>
                <div className="flex">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    className="placeholder:text-dark-4 w-full rounded-l-md border-[1.5px] border-r-0 border-stroke px-5.5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-r-md bg-[#eab308] px-4 py-3 font-medium text-white duration-200 ease-out hover:bg-opacity-90 sm:px-7.5"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
            {/* <!-- subscription form end --> */}

            {/* <!-- social link start --> */}
            <div className="mt-10 text-center flex items-center justify-center gap-4">
              <p className="mt-1.5 font-medium text-black dark:text-white">
                Follow Us On
              </p>
              <Link
                href="https://www.youtube.com/@Biblepoetry"
                className="flex size-10 items-center justify-center rounded-full border border-[#DFE4EA] hover:bg-[#FF0000] hover:text-white dark:border-strokedark dark:hover:border-primary"
              >
              <svg
                className="fill-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_1878_14091)">
                  <path
                    d="M15.925 4.27495C15.75 3.59995 15.225 3.07495 14.55 2.89995C13.35 2.57495 8.5 2.57495 8.5 2.57495C8.5 2.57495 3.65 2.57495 2.45 2.89995C1.775 3.07495 1.25 3.59995 1.075 4.27495C0.75 5.49995 0.75 7.99995 0.75 7.99995C0.75 7.99995 0.75 10.525 1.075 11.7249C1.25 12.4 1.775 12.925 2.45 13.0999C3.65 13.425 8.5 13.4249 8.5 13.4249C8.5 13.4249 13.35 13.425 14.55 13.0999C15.225 12.925 15.75 12.4 15.925 11.7249C16.25 10.525 16.25 7.99995 16.25 7.99995C16.25 7.99995 16.25 5.49995 15.925 4.27495ZM6.95 10.325V5.67495L10.975 7.99995L6.95 10.325Z"
                    fill=""
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1878_14091">
                    <rect
                      width="16"
                      height="16"
                      fill="white"
                      transform="translate(0.5)"
                    />
                  </clipPath>
                </defs>
              </svg>
              </Link>
            </div>
            {/* <!-- social link end --> */}
          </div>
        </div>

        <div className="absolute left-0 top-0 -z-10 flex h-screen w-full items-center justify-around">
          <div className="flex h-full gap-20">
            <span className="block h-full w-0.5 animate-line1">
              <span className="block h-55 w-0.5 bg-bodydark1 dark:bg-strokedark"></span>
            </span>
            <span className="block h-full w-0.5 animate-line2">
              <span className="block h-36 w-0.5 bg-bodydark1 dark:bg-strokedark"></span>
            </span>
            <span className="ml-10 block h-full w-0.5 animate-line3">
              <span className="block h-40 w-0.5 bg-bodydark1 dark:bg-strokedark"></span>
            </span>
          </div>

          <div className="flex h-full gap-20">
            <span className="mr-10 block h-full w-0.5 animate-line1">
              <span className="block h-55 w-0.5 bg-bodydark1 dark:bg-strokedark"></span>
            </span>
            <span className="block h-full w-0.5 animate-line2">
              <span className="block h-36 w-0.5 bg-bodydark1 dark:bg-strokedark"></span>
            </span>
            <span className="block h-full w-0.5 animate-line3">
              <span className="block h-40 w-0.5 bg-bodydark1 dark:bg-strokedark"></span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  export default ComingSoon;
