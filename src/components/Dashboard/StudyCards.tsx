"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LuArrowUpDown, LuBookOpen, LuEllipsis, LuEye, LuGlobe, LuLock, LuPencil, LuTrash2, LuX } from "react-icons/lu";

import DeleteStudyModal from "@/components/Modals/DeleteStudy";
import EditStudyModal from "@/components/Modals/EditStudy";
import StarToggler from "@/components/Tables/Recent/StarToggler";
import { updatePublic } from "@/lib/actions";
import type { StudyData } from "@/lib/data";
import { formatBookAndPassage } from "@/lib/utils";
import { editedLabel } from "@/lib/editedLabel";

/*
  Studies as cards, for phones and tablets (under 1024px), where the
  dashboard's tables would need sideways scrolling. Desktop keeps the tables.
*/

const studyPath = (study: StudyData, mode: "edit" | "view") => `/study/${study.id.replace("rec_", "")}/${mode}`;


const VisibilityBadge = ({ isPublic }: { isPublic: boolean }) =>
  isPublic ? (
    <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
      <LuGlobe size={13} />
      Public
    </span>
  ) : (
    <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-whiten px-2 text-xs font-semibold text-body">
      <LuLock size={13} />
      Private
    </span>
  );

const Switch = ({ on, label, onChange }: { on: boolean; label: string; onChange: (on: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors ${on ? "justify-end bg-primary" : "justify-start bg-bodydark"}`}
  >
    <span className="h-[26px] w-[26px] rounded-full bg-white shadow" />
  </button>
);

/** A study's actions: a sheet from the bottom on phones, a dialog on tablets. */
const StudyActions = ({
  study,
  isPublic,
  setPublic,
  onClose,
  onRename,
  onDelete,
}: {
  study: StudyData;
  isPublic: boolean;
  setPublic: (on: boolean) => void;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) => {
  const row = "flex min-h-[56px] w-full items-center gap-3.5 px-5 text-left text-base font-semibold";
  return (
    <>
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 z-[70] cursor-default bg-black/40" />
      <section
        role="dialog"
        aria-label={`${study.name}: actions`}
        className="fixed inset-x-0 bottom-0 z-[71] rounded-t-[22px] bg-white pt-2 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        <div className="flex justify-center pb-1.5 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-bodydark" />
        </div>
        <div className="flex items-start gap-2 border-b border-stroke pb-3 pl-5 pr-3">
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-lg font-bold leading-6 text-black">{study.name}</h2>
            <p className="text-sm text-body">
              {formatBookAndPassage(study.book, study.passage)}
              {study.createdAt ? ` · created ${new Date(study.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}` : ""}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whiten text-black">
            <LuX size={20} />
          </button>
        </div>
        <div className="flex flex-col py-1.5">
          <Link href={studyPath(study, "edit")} className={`${row} text-black`}>
            <LuBookOpen size={22} />
            Open study
          </Link>
          <Link href={studyPath(study, "view")} className={`${row} text-black`}>
            <LuEye size={22} />
            Open read-only
          </Link>
          <button type="button" onClick={onRename} className={`${row} text-black`}>
            <LuPencil size={22} />
            Rename
          </button>
          <div className="flex min-h-[64px] items-center gap-3.5 px-5">
            <LuGlobe size={22} className="shrink-0 text-black" />
            <span className="flex flex-1 flex-col">
              <span className="text-base font-semibold text-black">Shared to public</span>
              <span className="text-[13px] text-body">Anyone can find it in Public Studies</span>
            </span>
            <Switch on={isPublic} label="Shared to public" onChange={setPublic} />
          </div>
          <div className="mx-5 my-1.5 h-px bg-stroke" />
          <button type="button" onClick={onDelete} className={`${row} text-danger`}>
            <LuTrash2 size={22} />
            Delete study…
          </button>
        </div>
      </section>
    </>
  );
};

/** One of your own studies: open it, star it, and ⋯ for the rest. */
export const MyStudyCard = ({ study, setTriggerFetch }: { study: StudyData; setTriggerFetch: (v: boolean) => void }) => {
  const [isPublic, setIsPublic] = useState(Boolean(study.public));
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setPublic = (on: boolean) => {
    setIsPublic(on);
    updatePublic(study.id, on);
  };

  return (
    <li className="flex items-start gap-1 rounded-2xl border border-stroke bg-white py-3 pl-4 pr-1.5">
      <Link href={studyPath(study, "edit")} className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <span className="text-base font-bold leading-snug text-black">{study.name}</span>
        <span className="text-sm text-body">{formatBookAndPassage(study.book, study.passage)}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-body">
          <VisibilityBadge isPublic={isPublic} />
          <span>{editedLabel(study.lastUpdated)}</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center">
        <StarToggler studyId={study.id} isStarred={Boolean(study.starred)} label={study.name} className="flex h-11 w-11 items-center justify-center rounded-xl" />
        <button
          type="button"
          aria-label={`More actions for ${study.name}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-black"
        >
          <LuEllipsis size={22} />
        </button>
      </div>
      {menuOpen && (
        <StudyActions
          study={study}
          isPublic={isPublic}
          setPublic={setPublic}
          onClose={() => setMenuOpen(false)}
          onRename={() => {
            setMenuOpen(false);
            setRenameOpen(true);
          }}
          onDelete={() => {
            setMenuOpen(false);
            setDeleteOpen(true);
          }}
        />
      )}
      <EditStudyModal studyId={study.id} studyName={study.name} setTriggerFetch={setTriggerFetch} open={renameOpen} onOpenChange={setRenameOpen} hideTrigger />
      <DeleteStudyModal studyItem={study} setTriggerFetch={setTriggerFetch} open={deleteOpen} onOpenChange={setDeleteOpen} hideTrigger />
    </li>
  );
};

/** A study you can read: public, pre-marked or Scriptura. */
export const BrowseCard = ({ study, showOwner = false }: { study: StudyData; showOwner?: boolean }) => (
  <li>
    <Link href={studyPath(study, "view")} className="flex flex-col gap-1 rounded-2xl border border-stroke bg-white px-4 py-3.5">
      <span className="text-base font-bold leading-snug text-black">{study.name}</span>
      <span className="text-sm text-body">{formatBookAndPassage(study.book, study.passage)}</span>
      {(showOwner || study.lastUpdated) && (
        <span className="mt-1 flex items-center gap-2 text-xs text-body">
          {showOwner && study.ownerAvatarUrl && (
            <Image src={study.ownerAvatarUrl} width={20} height={20} alt="" className="h-5 w-5 rounded-full" />
          )}
          {showOwner && study.ownerDisplayName && <span>by {study.ownerDisplayName}</span>}
          {showOwner && study.ownerDisplayName && study.lastUpdated && <span aria-hidden="true">·</span>}
          {study.lastUpdated && <span>{editedLabel(study.lastUpdated)}</span>}
        </span>
      )}
    </Link>
  </li>
);

export type SortOption = { label: string; sortBy: string; asc?: boolean };

/** The tables' column sorting, as one menu for the card layouts. */
export const SortSelect = ({ options, className = "" }: { options: SortOption[]; className?: string }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentBy = searchParams.get("sortBy") ?? "";
  const currentAsc = Boolean(searchParams.get("sortAsc"));
  const index = Math.max(0, options.findIndex((o) => o.sortBy === currentBy && Boolean(o.asc) === currentAsc));

  const choose = (i: number) => {
    const o = options[i];
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (o.sortBy) params.set("sortBy", o.sortBy);
    else params.delete("sortBy");
    if (o.asc) params.set("sortAsc", "true");
    else params.delete("sortAsc");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <label className={`relative flex h-11 shrink-0 items-center gap-2 rounded-full border border-stroke bg-white pl-3.5 pr-4 text-sm font-semibold text-black ${className}`}>
      <LuArrowUpDown size={16} aria-hidden="true" />
      <span className="sr-only">Sort by</span>
      <span aria-hidden="true">{options[index].label}</span>
      <select
        value={index}
        onChange={(e) => choose(Number(e.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Sort by"
      >
        {options.map((o, i) => (
          <option key={i} value={i}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export const MY_SORTS: SortOption[] = [
  { label: "Last edited", sortBy: "" },
  { label: "Name", sortBy: "name", asc: true },
  { label: "Passage", sortBy: "passage", asc: true },
  { label: "Newest", sortBy: "created_at" },
];
export const PUBLIC_SORTS: SortOption[] = MY_SORTS;
export const NAME_SORTS: SortOption[] = [
  { label: "Name", sortBy: "name", asc: true },
  { label: "Passage", sortBy: "passage", asc: true },
];
