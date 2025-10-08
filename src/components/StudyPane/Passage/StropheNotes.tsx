import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { FormatContext } from ".."
import { StropheNote, StudyNotes } from "@/lib/types";

export const StropheNotes = ({ firstWordId, lastWordId, stropheId }: { firstWordId: number, lastWordId: number, stropheId: number }) => {
  const { ctxStudyId, ctxStudyNotes, ctxSetStudyNotes, ctxPassageProps } = useContext(FormatContext);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);
  // const isEditingRef = useRef(false);

  // 1) Ensure ctxStudyNotes exists once on mount
  useEffect(() => {
    if (!ctxStudyNotes) {
      const stropheCount = ctxPassageProps.stropheCount ?? 0;
      const array: StropheNote[] = Array.from({ length: stropheCount }, () => ({ title: "", text: "", firstWordId: -1 , lastWordId: -1}));
      ctxSetStudyNotes(JSON.stringify({ main: "", strophes: array }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // 2) Local UI state that syncs from ctxStudyNotes when it changes
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  

  const hydratedKeyRef = useRef<string | null>(null);
  const notesVersionRef = useRef(0);
  const lastNotesStrRef = useRef<string | null>(null);
  if (lastNotesStrRef.current !== ctxStudyNotes) {
  notesVersionRef.current += 1;
  lastNotesStrRef.current = ctxStudyNotes ?? null;
}

  useEffect(() => {
  if (!ctxStudyNotes) return;

  const key = `${stropheId}@${notesVersionRef.current}`;
  if (hydratedKeyRef.current === key) return;

  try {
    const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes>;
    const s = Array.isArray(parsed?.strophes) ? parsed!.strophes![stropheId] : undefined;
    setTitle(s?.title ?? "");
    setText(s?.text ?? "");
    hydratedKeyRef.current = key;
  } catch {
    // ignore parse errors
  }
}, [ctxStudyNotes, stropheId]);

const saveNow = useCallback(
async (payload: string, { keepalive = false } = {}) => {
  if (!ctxStudyId) return;
  if (lastSavedPayloadRef.current === payload) return;

  try {
    const res = await fetch("/api/noteSync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyId: ctxStudyId, text: payload }),
      keepalive,
    });
    if (!res.ok) throw new Error("Save failed");
    lastSavedPayloadRef.current = payload;
    // optional: console.log("saved:", JSON.parse(payload).strophes[stropheId]);
  } catch (err) {
    if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([JSON.stringify({ studyId: ctxStudyId, text: payload })], {
        type: "application/json",
      });
      const ok = navigator.sendBeacon("/api/noteSync", blob);
      if (ok) lastSavedPayloadRef.current = payload;
      else console.error("Beacon failed");
    } else {
      console.error("Save error:", err);
    }
  }
  },[ctxStudyId]);

  const buildPayload = useCallback(() => {
  let parsed: StudyNotes = { main: "", strophes: [] };
  try {
    if (ctxStudyNotes) parsed = JSON.parse(ctxStudyNotes);
  } catch {/* fall back */}

  const strophes = Array.isArray(parsed.strophes) ? [...parsed.strophes] : [];
  while (strophes.length <= stropheId) {
    strophes.push({ title: "", text: "" , firstWordId: firstWordId, lastWordId: lastWordId});
  }
  strophes[stropheId] = { title, text, firstWordId: firstWordId, lastWordId: lastWordId };

  const next: StudyNotes = { ...parsed, strophes };
  return JSON.stringify(next);
}, [ctxStudyNotes, stropheId, title, text]);

useEffect(() => {
  if (!ctxStudyNotes) return;

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  const payload = buildPayload();
  pendingPayloadRef.current = payload;

  // (Optional) Update context so other components see changes.
  // Guard to avoid useless updates:
  if (payload !== ctxStudyNotes) ctxSetStudyNotes(payload);

  timeoutRef.current = setTimeout(() => {
    saveNow(payload, { keepalive: false });
  }, 2000);

  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, [buildPayload, ctxStudyNotes, ctxSetStudyNotes, saveNow]);

// 5) Flush on hide/unload
useEffect(() => {
  const flush = () => {
    const payload = pendingPayloadRef.current;
    if (!payload) return;
    void saveNow(payload, { keepalive: true });
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  const onPageHide = () => flush();

  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("pagehide", onPageHide);
  return () => {
    flush();
    document.removeEventListener("visibilitychange", onVisibility); // fixed typo
    document.removeEventListener("pagehide", onPageHide);
  };
  }, [saveNow]);

  return (
    <div>
      <textarea
        rows={1}
        value={title}
        // onFocus={() => (isEditingRef.current = true)}
        // onBlur={() => (isEditingRef.current = false)}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Your title here..."
        className="resize-none w-full rounded border border-stroke bg-transparent px-5 py-1 font-bold text-lg text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
      />
      <textarea
        value={text}
        // onFocus={() => (isEditingRef.current = true)}
        // onBlur={() => (isEditingRef.current = false)}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your notes here..."
        className="resize-none w-full rounded border border-stroke bg-transparent px-5 py-4 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
      />
    </div>
  );
};
