'use client'
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { FormatContext } from "..";
import { StropheNote, StudyNotes } from "@/lib/types";

const Notes = () => {
  const { ctxStudyId, ctxStudyNotes, ctxSetStudyNotes, ctxPassageProps, ctxStropheNotesActive } = useContext(FormatContext);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // timers/flags
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);   // what we intend to save next
  const lastSavedPayloadRef = useRef<string | null>(null); // what backend already has

  // Initialize local text
  const [text, setText] = useState(() => {
    try {
      return ctxStudyNotes ? (JSON.parse(ctxStudyNotes).main ?? "") : "";
    } catch {
      return "";
    }
  });
  const [rows, setRows] = useState(1);

  // Ensure context has default shape AFTER mount
  useEffect(() => {
    if (!ctxStudyNotes) {
      const array: StropheNote[] = Array.from({ length: ctxPassageProps.stropheCount}, () => ({title: "", text: "", firstWordId: -1, lastWordId: -1}))
      ctxSetStudyNotes(JSON.stringify({ main: "" , strophes: array}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep context in sync with local text
  useEffect(() => {
    const currentJSON = JSON.parse(ctxStudyNotes);
    const updatedJSON = {...currentJSON, main:text};
    const payload = JSON.stringify(updatedJSON);
    ctxSetStudyNotes(payload);
    // keep our pending payload up to date for quick flush
    pendingPayloadRef.current = payload;
  }, [text, ctxSetStudyNotes]);

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
        body: JSON.stringify({
          studyId: ctxStudyId,
          text: payload,
          stropheNotesActive: ctxStropheNotesActive,
        }),
        keepalive, // crucial during page/tab close
      });

      if (!res.ok) throw new Error("Save failed");
      lastSavedPayloadRef.current = payload;
      // Consider: toast or console only
      console.log("Saved:", JSON.parse(payload));
    } catch (err) {
      // Try a best-effort beacon when we're in an unload scenario and fetch failed
      if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        try {
          const blob = new Blob(
            [JSON.stringify({ studyId: ctxStudyId, text: payload, stropheNotesActive: ctxStropheNotesActive })],
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
  }, [ctxStudyId, ctxStropheNotesActive]);

  // Debounced autosave whenever `text` changes
  useEffect(() => {
    // clear previous debounce
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const currentJSON = JSON.parse(ctxStudyNotes);
    const updatedJSON = {...currentJSON, main:text};
    const payload = JSON.stringify(updatedJSON);
    pendingPayloadRef.current = payload;

    timeoutRef.current = setTimeout(() => {
      // standard save (not unloading)
      saveNow(payload, { keepalive: false });
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, saveNow]);

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

  useEffect(() => {
    const container = containerRef.current;
    const textarea = textareaRef.current;
    if (!container || !textarea) return;

    const containerPadding = 16;
    textarea.style.lineHeight = "1.5";

    const computeRows = () => {
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const containerHeight = container.clientHeight - containerPadding * 8;
      if (lineHeight > 0) {
        const calculatedRows = Math.floor(containerHeight / lineHeight);
        setRows(calculatedRows);
      }
    };

    computeRows();
    const resizeObserver = new ResizeObserver(computeRows);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">Notes</h3>
      </div>
      <div className="flex flex-col gap-5.5 p-6.5">
        <div>
          <textarea
            ref={textareaRef}
            rows={rows}
            placeholder="Your notes here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default Notes;
