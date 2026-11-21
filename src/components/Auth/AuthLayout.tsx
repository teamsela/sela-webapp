"use client";

import Image from "next/image";
import Link from "next/link";
import { LuChevronRight, LuPlay } from "react-icons/lu";

import CopyrightLinks from "@/components/Footer/CopyrightLinks";
import { useStudyLayout } from "@/components/StudyPane/Responsive/layout";

/*
  Sign-in and sign-up pages at every width:

    desktop (1024 and up)   banner on the left, form on the right (as before)
    phones and tablets      banner, form and demo stacked and centred
    foldable opened flat    banner on one half, form on the other, so
                            nothing sits on the fold

  The copyright notices are at the bottom on all of them.
*/

const Banner = ({ className }: { className: string }) => (
  <Image src="/images/digging-for-gems.png" width={1000} height={292} priority alt="Bible Poetry: digging for gems" className={className} />
);

const DemoLink = () => (
  <Link
    href="/demo"
    className="flex w-full max-w-[400px] items-center gap-3.5 rounded-2xl border border-stroke bg-whiten px-4 py-3 text-black"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
      <LuPlay size={18} fill="currentColor" />
    </span>
    <span className="flex flex-1 flex-col">
      <span className="text-base font-semibold">Demo Study of Psalm 1</span>
      <span className="text-[13px] text-body">No account needed</span>
    </span>
    <LuChevronRight size={20} className="text-body" />
  </Link>
);

const Copyright = () => <CopyrightLinks className="max-w-[400px] justify-center text-center text-xs leading-5 text-body" />;

export default function AuthLayout({ children, demo = false }: { children: React.ReactNode; demo?: boolean }) {
  const { mode, fold } = useStudyLayout();

  if (fold === "book") {
    return (
      <main className="flex min-h-dvh">
        <section aria-label="Bible Poetry" className="flex flex-1 items-center justify-center bg-white px-10">
          <Banner className="h-auto w-full max-w-[340px]" />
        </section>
        <section aria-label="Sign in" className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#F7F9FC] px-6 py-10">
          {children}
          {demo && <DemoLink />}
          <Copyright />
        </section>
      </main>
    );
  }

  if (mode === "desktop" || mode === "tabletWide") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex w-full flex-1 items-center justify-center">
          <Banner className="mr-[100px] h-auto w-2/5" />
          <div className="flex w-full max-w-md flex-col items-center gap-2 px-8">
            {children}
            {demo && (
              <Link href="/demo" className="mt-12 rounded border border-stroke bg-white px-3 py-1 text-xl text-meta-1 shadow-default hover:bg-gray">
                Demo Study of Psalm 1
              </Link>
            )}
          </div>
        </div>
        <div className="py-4">
          <Copyright />
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-dvh flex-col items-center gap-6 bg-white px-5 sm:justify-center sm:gap-8 sm:bg-[#F7F9FC]"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
    >
      <Banner className="h-auto w-60 sm:w-[360px]" />
      {children}
      {demo && <DemoLink />}
      <div className="mt-auto sm:mt-0">
        <Copyright />
      </div>
    </main>
  );
}
