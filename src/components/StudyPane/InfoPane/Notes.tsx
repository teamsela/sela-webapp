'use client'
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { FormatContext } from "..";
import { StropheNote, StudyNotes } from "@/lib/types";
import { RichDoc, toRichDoc } from "@/lib/richText";
import RichTextEditor from "./RichTextEditor";

const Notes = () => {
  const { ctxStudyId, ctxStudyNotes, ctxSetStudyNotes, ctxPassageProps, ctxInViewMode } =
    useContext(FormatContext);

  // timers/flags
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);   // what we intend to save next
  const lastSavedPayloadRef = useRef<string | null>(null); // what backend already has
  const dirtyRef = useRef(false);                          // set once the user actually edits

  const buildEmptyStrophes = useCallback(
    () =>
      Array.from({ length: ctxPassageProps.stropheCount }, () => ({
        title: "",
        text: "",
        firstWordId: -1,
        lastWordId: -1,
      })),
    [ctxPassageProps.stropheCount]
  );

  const getSafeNotes = useCallback((): StudyNotes => {
    const fallback: StudyNotes = { main: "", strophes: buildEmptyStrophes() };
    if (!ctxStudyNotes) return fallback;
    try {
      const parsed = JSON.parse(ctxStudyNotes) as StudyNotes;
      return {
        ...parsed,
        // `main` may be legacy plain text or a rich doc — keep whatever shape it is.
        main: parsed?.main ?? "",
        strophes: Array.isArray(parsed?.strophes) ? parsed.strophes : fallback.strophes,
      };
    } catch {
      return fallback;
    }
  }, [ctxStudyNotes, buildEmptyStrophes]);

  // Rich-text doc is the source of truth for the main note. Migrate legacy
  // plain-text notes to a doc on first load.
  const [mainDoc, setMainDoc] = useState<RichDoc>(() => toRichDoc(getSafeNotes().main));

  const editable = !ctxInViewMode;

  // Ensure context has default shape AFTER mount
  useEffect(() => {
    if (!ctxStudyNotes) {
      const array: StropheNote[] = buildEmptyStrophes();
      ctxSetStudyNotes(JSON.stringify({ main: "", strophes: array }));
    }
  }, [ctxStudyNotes, ctxSetStudyNotes, buildEmptyStrophes]);

  // A stable "save now" that supports keepalive and beacon
  const saveNow = useCallback(async (payload: string, { keepalive = false } = {}) => {
    if (!ctxStudyId) return;

    // Avoid redundant writes
    if (lastSavedPayloadRef.current === payload) return;

    try {
      // Prefer fetch keepalive for same-origin POST during unload; fall back to beacon
      const res = await fetch("/api/noteSync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId: ctxStudyId, text: payload }),
        keepalive, // crucial during page/tab close
      });

      if (!res.ok) throw new Error("Save failed");
      lastSavedPayloadRef.current = payload;
    } catch (err) {
      // Try a best-effort beacon when we're in an unload scenario and fetch failed
      if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        try {
          const blob = new Blob(
            [JSON.stringify({ studyId: ctxStudyId, text: payload })],
            { type: "application/json" }
          );
          const ok = navigator.sendBeacon("/api/noteSync", blob);
          if (ok) lastSavedPayloadRef.current = payload;
          else console.error("Beacon failed");
        } catch (e) {
          console.error("Beacon error:", e);
        }
      } else {
        console.error("Save error:", err);
      }
    }
  }, [ctxStudyId]);

  // Build the full StudyNotes payload, preserving strophes / other keys and only
  // swapping in the current main doc.
  const buildPayload = useCallback(() => {
    let parsed: StudyNotes = { main: "", strophes: [] };
    try {
      if (ctxStudyNotes) parsed = JSON.parse(ctxStudyNotes);
    } catch {/* fall back */}
    return JSON.stringify({ ...parsed, main: mainDoc });
  }, [ctxStudyNotes, mainDoc]);

  const handleChange = useCallback((doc: RichDoc) => {
    dirtyRef.current = true;
    setMainDoc(doc);
  }, []);

  // Sync context + debounced autosave whenever the main doc changes. Only runs
  // after a real edit, so simply opening the Notes tab never writes (or migrates
  // legacy plain-text notes) behind the user's back.
  useEffect(() => {
    if (!editable || !dirtyRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const payload = buildPayload();
    pendingPayloadRef.current = payload;

    if (payload !== ctxStudyNotes) {
      ctxSetStudyNotes(payload);
    }

    timeoutRef.current = setTimeout(() => {
      saveNow(payload, { keepalive: false });
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [buildPayload, ctxStudyNotes, ctxSetStudyNotes, saveNow, editable]);

  // Flush on unmount and tab/page visibility changes
  useEffect(() => {
    const flush = () => {
      const payload = pendingPayloadRef.current;
      if (!payload) return;
      // fire-and-forget; we cannot truly await during unload
      void saveNow(payload, { keepalive: true });
    };

    // Flush when the page is being hidden or about to unload
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    // Cleanup: flush and remove listeners
    return () => {
      // component unmount (e.g., route change in-app)
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [saveNow]);

  return (
    <div className="flex h-full flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">Notes</h3>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-6.5">
        <RichTextEditor
          value={mainDoc}
          onChange={handleChange}
          editable={editable}
          placeholder="Your notes here..."
          fill
          className="min-h-0 flex-1"
        />
      </div>
    </div>
  );
};

export default Notes;
