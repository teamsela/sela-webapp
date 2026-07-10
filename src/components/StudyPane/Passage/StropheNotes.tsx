import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { FormatContext } from ".."
import { StropheNote, StudyNotes } from "@/lib/types";
import { RichDoc, combineNoteDoc, firstLineText, toRichDoc } from "@/lib/richText";
import { LanguageContext } from "./PassageBlock";
import RichTextEditor from "../InfoPane/RichTextEditor";

export const StropheNotes = ({ firstWordId, lastWordId, stropheId }: { firstWordId: number, lastWordId: number, stropheId: number}) => {
  const {
    ctxStudyId,
    ctxStudyNotes,
    ctxSetStudyNotes,
    ctxPassageProps,
    ctxNoteMerge,
    ctxSetNoteMerge,
    ctxActiveNotesPane,
    ctxSetActiveNotesPane,
    ctxInViewMode
  } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext);
  const viewId = useMemo<"heb" | "eng">(() => (ctxIsHebrew ? "heb" : "eng"), [ctxIsHebrew]);
  const editable = !ctxInViewMode;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);
  const dirtyRef = useRef(false); // set once the user actually edits this strophe

  // 1) Ensure ctxStudyNotes exists once on mount
  useEffect(() => {
    if (!ctxStudyNotes) {
      const stropheCount = ctxPassageProps.stropheCount ?? 0;
      const array: StropheNote[] = Array.from({ length: stropheCount }, () => ({ title: "", text: "", firstWordId: -1 , lastWordId: -1}));
      ctxSetStudyNotes(JSON.stringify({ main: "", strophes: array }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // 2) Local UI state: one combined rich-text doc whose first line is the title.
  //    Initialised synchronously from ctxStudyNotes so the editor mounts with the
  //    saved content already in place (no empty first frame), then kept in sync by
  //    the re-hydration effect below.
  const [noteDoc, setNoteDoc] = useState<RichDoc>(() => {
    try {
      if (ctxStudyNotes) {
        const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes>;
        const s = Array.isArray(parsed?.strophes) ? parsed!.strophes![stropheId] : undefined;
        return combineNoteDoc(s?.title, s?.text);
      }
    } catch {
      /* fall through to empty */
    }
    return toRichDoc("");
  });

  const claimActivePane = useCallback(() => {
    if (ctxActiveNotesPane !== viewId) {
      ctxSetActiveNotesPane(viewId);
    }
  }, [ctxActiveNotesPane, ctxSetActiveNotesPane, viewId]);

  const localPayloadRef = useRef<string | null>(null);
  const hydratedKeyRef = useRef<string | null>(null);
  const notesVersionRef = useRef(0);
  const lastNotesStrRef = useRef<string | null>(null);
  if (lastNotesStrRef.current !== ctxStudyNotes) {
    notesVersionRef.current += 1;
    lastNotesStrRef.current = ctxStudyNotes ?? null;
  }

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
  // Title is the note's first line, derived so the strophe can show it when the
  // note pane is closed.
  strophes[stropheId] = { title: firstLineText(noteDoc), text: noteDoc, firstWordId: firstWordId, lastWordId: lastWordId };

  const next: StudyNotes = { ...parsed, strophes };
  return JSON.stringify(next);
}, [ctxStudyNotes, stropheId, noteDoc, firstWordId, lastWordId]);

  // Re-hydration effect: placed BEFORE the save effect so that when both fire
  // in the same render (e.g. viewId or ctxActiveNotesPane changes), noteDoc is
  // already up to date when the save effect reads it from its closure.
  useEffect(() => {
    if (!ctxStudyNotes) return;

    const key = `${stropheId}@${notesVersionRef.current}`;
    if (hydratedKeyRef.current === key && !ctxNoteMerge) return;

    const isLocalPayload = localPayloadRef.current === ctxStudyNotes;
    if (!ctxNoteMerge && ctxActiveNotesPane === viewId && isLocalPayload) {
      hydratedKeyRef.current = key;
      return;
    }

    try {
      const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes>;
      const s = Array.isArray(parsed?.strophes) ? parsed!.strophes![stropheId] : undefined;
      // Fold a (possibly legacy separate) title + body back into one doc.
      setNoteDoc(combineNoteDoc(s?.title, s?.text));
      hydratedKeyRef.current = key;
      // We just synced from external data — clear dirty so a stale save effect
      // doesn't overwrite with a previous closure's noteDoc.
      dirtyRef.current = false;
    } catch {
      // ignore parse errors
    } finally {
      if (ctxNoteMerge) {
        ctxSetNoteMerge(false);
      }
      if (isLocalPayload) {
        localPayloadRef.current = null;
      }
    }
  }, [ctxStudyNotes, stropheId, viewId, ctxActiveNotesPane, ctxNoteMerge, ctxSetNoteMerge]);

  // Sync context + debounced autosave. Runs AFTER re-hydration so noteDoc is
  // current when buildPayload captures it.
  useEffect(() => {
  if (!editable) return;
  if (!ctxStudyNotes) return;
  if (ctxActiveNotesPane !== viewId) return;
  if (!dirtyRef.current) return; // only sync/save after a real edit

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  const payload = buildPayload();
  pendingPayloadRef.current = payload;

  // Guard to avoid useless updates:
  if (payload !== ctxStudyNotes) {
    localPayloadRef.current = payload;
    ctxSetStudyNotes(payload);
  }

  timeoutRef.current = setTimeout(() => {
    saveNow(payload, { keepalive: false });
  }, 2000);

  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, [buildPayload, ctxStudyNotes, ctxSetStudyNotes, saveNow, ctxActiveNotesPane, viewId, editable]);

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
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("pagehide", onPageHide);
  };
  }, [saveNow]);

  const handleChange = useCallback((doc: RichDoc) => {
    dirtyRef.current = true;
    claimActivePane();
    setNoteDoc(doc);
  }, [claimActivePane]);

  return (
    <div className="flex h-full flex-col bg-transparent" onFocus={claimActivePane}>
      <RichTextEditor
        value={noteDoc}
        onChange={handleChange}
        editable={editable}
        placeholder="Title on the first line. Write your notes beneath it."
        dir="auto"
        fill
        className="min-h-0 flex-1 bg-white dark:bg-form-input"
      />
    </div>
  );
};
