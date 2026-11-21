"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LuBookOpen, LuBookmark, LuGraduationCap, LuPlus, LuUsers, LuX } from "react-icons/lu";

import { fetchTutorialStudies, type TutorialStudySummary } from "@/lib/actions";

/*
  How the dashboard's five places are reached below desktop width:

    phone    a floating tab bar at the bottom, the same pill as the study
             screen's; New study is a button above it
    tablet   a dark rail of labelled icons down the left edge

  Tutorials is a folder in the desktop sidebar, not a page, so here it opens
  a list of the tutorials.
*/

const ScripturaIcon = ({ size = 22 }: { size?: number }) => (
  <span
    aria-hidden="true"
    className="inline-block shrink-0 bg-current"
    style={{
      width: size,
      height: size,
      mask: "url(/images/icon/icon-scriptura.svg) center / contain no-repeat",
      WebkitMask: "url(/images/icon/icon-scriptura.svg) center / contain no-repeat",
    }}
  />
);

type Place = { href: string; label: string; short: string; icon: (size: number) => ReactNode; match: string };
export const PLACES: Place[] = [
  { href: "/dashboard/home", label: "My Studies", short: "My Studies", icon: (s) => <LuBookOpen size={s} />, match: "/dashboard/home" },
  { href: "/dashboard/public", label: "Public Studies", short: "Public", icon: (s) => <LuUsers size={s} />, match: "/dashboard/public" },
  { href: "/dashboard/premarked", label: "Pre-Marked Studies", short: "Pre-marked", icon: (s) => <LuBookmark size={s} />, match: "/dashboard/premarked" },
  { href: "/dashboard/scriptura", label: "Scriptura Studies", short: "Scriptura", icon: (s) => <ScripturaIcon size={s} />, match: "/dashboard/scriptura" },
];

const useTutorials = (enabled: boolean) => {
  const [tutorials, setTutorials] = useState<TutorialStudySummary[] | null>(null);
  useEffect(() => {
    if (!enabled || tutorials !== null) return;
    let active = true;
    fetchTutorialStudies()
      .then((rows) => active && setTutorials(rows ?? []))
      .catch(() => active && setTutorials([]));
    return () => {
      active = false;
    };
  }, [enabled, tutorials]);
  return tutorials;
};

/** The tutorials, as a sheet on phones and a panel beside the rail on tablets. */
export const TutorialsPanel = ({ open, onClose, beside = false }: { open: boolean; onClose: () => void; beside?: boolean }) => {
  const tutorials = useTutorials(open);
  if (!open) return null;
  return (
    <>
      <button type="button" aria-label="Close tutorials" onClick={onClose} className="fixed inset-0 z-[70] cursor-default bg-black/40" />
      <section
        role="dialog"
        aria-label="Tutorials"
        className={
          beside
            ? "fixed left-[100px] top-4 z-[71] w-[340px] rounded-2xl bg-white p-2 shadow-2xl"
            : "fixed inset-x-0 bottom-0 z-[71] max-h-[80dvh] overflow-y-auto rounded-t-[22px] bg-white px-2 pt-2 shadow-2xl"
        }
        style={beside ? undefined : { paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {!beside && (
          <div className="flex justify-center pb-1">
            <span className="h-1.5 w-10 rounded-full bg-bodydark" />
          </div>
        )}
        <div className="flex items-center gap-2 pb-1 pl-3">
          <h2 className="flex-1 text-lg font-bold text-black">Tutorials</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-whiten text-black">
            <LuX size={20} />
          </button>
        </div>
        {tutorials === null && <p className="px-3 py-3 text-sm text-body">Loading…</p>}
        {tutorials?.length === 0 && <p className="px-3 py-3 text-sm text-body">No tutorials yet</p>}
        <ul className="flex flex-col">
          {tutorials?.map((t) => (
            <li key={t.id}>
              <Link
                href={`/study/${t.id.replace(/^rec_/, "")}/view`}
                className="flex min-h-[56px] items-center gap-3 rounded-xl px-3 text-black active:bg-whiten"
              >
                <LuGraduationCap size={20} className="shrink-0 text-body" />
                <span className="text-base font-semibold">{t.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

/** Phone: the floating tab bar (same pill as the study screen) and the New study button. */
export const PhoneTabBar = ({ onNewStudy }: { onNewStudy: () => void }) => {
  const pathname = usePathname() ?? "";
  const [tutorialsOpen, setTutorialsOpen] = useState(false);
  const tab = "flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold text-black";
  return (
    <>
      <button
        type="button"
        onClick={onNewStudy}
        className="fixed right-4 z-50 flex h-[52px] items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(60,80,224,0.35)]"
        style={{ bottom: "calc(max(env(safe-area-inset-bottom), 12px) + 84px)" }}
      >
        <LuPlus size={22} />
        New study
      </button>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <nav
          aria-label="Library"
          className="pointer-events-auto grid h-[68px] grid-cols-5 rounded-full border border-white bg-whiten/95 p-1.5 shadow-[0_8px_28px_rgba(28,36,52,0.16)] backdrop-blur"
        >
          {PLACES.map((p) => {
            const on = pathname.startsWith(p.match);
            return (
              <Link key={p.href} href={p.href} aria-current={on ? "page" : undefined} className={`${tab} ${on ? "bg-stroke" : ""}`}>
                {p.icon(21)}
                <span className="max-w-full truncate px-0.5">{p.short}</span>
              </Link>
            );
          })}
          <button type="button" aria-expanded={tutorialsOpen} onClick={() => setTutorialsOpen(true)} className={`${tab} ${tutorialsOpen ? "bg-stroke" : ""}`}>
            <LuGraduationCap size={21} />
            Tutorials
          </button>
        </nav>
      </div>
      <TutorialsPanel open={tutorialsOpen} onClose={() => setTutorialsOpen(false)} />
    </>
  );
};

/** Phone: the top of each dashboard page: logo and account. */
export const PhoneTopBar = () => (
  <div className="flex h-14 items-center justify-between px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
    <Link href="/dashboard/home" aria-label="Sela home">
      <Image width={34} height={32} src="/images/logo/logo-icon.svg" alt="Sela" />
    </Link>
    <UserButton />
  </div>
);

/** Tablet: the rail of labelled icons down the left edge. */
export const TabletRail = ({ onNewStudy }: { onNewStudy: () => void }) => {
  const pathname = usePathname() ?? "";
  const [tutorialsOpen, setTutorialsOpen] = useState(false);
  const item = "flex w-full flex-col items-center gap-1 py-1.5 text-[11px] font-semibold";
  const pill = (on: boolean) => `flex h-8 w-14 items-center justify-center rounded-full ${on ? "bg-graydark" : ""}`;
  return (
    <>
      <nav
        aria-label="Library"
        className="fixed inset-y-0 left-0 z-50 flex w-[88px] flex-col items-center gap-1.5 bg-black py-5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 20px)" }}
      >
        <Link href="/dashboard/home" aria-label="Sela home" className="mb-2">
          <Image width={38} height={36} src="/images/logo/logo-icon.svg" alt="Sela" />
        </Link>
        <button type="button" onClick={onNewStudy} aria-label="New study" className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-white">
          <LuPlus size={26} />
        </button>
        {PLACES.map((p) => {
          const on = pathname.startsWith(p.match);
          return (
            <Link key={p.href} href={p.href} aria-current={on ? "page" : undefined} className={`${item} ${on ? "text-white" : "text-bodydark"}`}>
              <span className={pill(on)}>{p.icon(22)}</span>
              {p.short}
            </Link>
          );
        })}
        <button type="button" aria-expanded={tutorialsOpen} onClick={() => setTutorialsOpen(true)} className={`${item} ${tutorialsOpen ? "text-white" : "text-bodydark"}`}>
          <span className={pill(tutorialsOpen)}>
            <LuGraduationCap size={22} />
          </span>
          Tutorials
        </button>
        <div className="mt-auto">
          <UserButton />
        </div>
      </nav>
      <TutorialsPanel open={tutorialsOpen} onClose={() => setTutorialsOpen(false)} beside />
    </>
  );
};
