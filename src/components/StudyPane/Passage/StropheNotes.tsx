import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { FormatContext } from ".."
import { StropheNote, StudyNotes } from "@/lib/types";
import { LanguageContext } from "./PassageBlock";

// export const STROPHE_NOTE_TITLE_MIN_HEIGHT = 44;
// export const STROPHE_NOTE_TEXT_MIN_HEIGHT = 104;
// export const STROPHE_NOTE_VERTICAL_GAP = 22;

const splitNoteValue = (value: string) => {
  const normalized = value.replace(/\r\n/g, "\n");
  const newlineIndex = normalized.indexOf("\n");
  if (newlineIndex === -1) return { title: normalized, text: "" };
  return {
    title: normalized.slice(0, newlineIndex),
    text: normalized.slice(newlineIndex + 1),
  };
};

const combineNoteValue = (title?: string, text?: string) => {
  const safeTitle = title ?? "";
  const safeText = text ?? "";
  if (!safeText) return safeTitle;
  return `${safeTitle}\n${safeText}`;
};

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
    ctxActiveLayerId,
  } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext);
  const viewId = useMemo<"heb" | "eng">(() => (ctxIsHebrew ? "heb" : "eng"), [ctxIsHebrew]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);

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
  const [noteValue, setNoteValue] = useState("");
  
  const claimActivePane = useCallback(() => {
    if (ctxActiveNotesPane !== viewId) {
      ctxSetActiveNotesPane(viewId);
    }
  }, [ctxActiveNotesPane, ctxSetActiveNotesPane, viewId]);

  const localPayloadRef = useRef<string | null>(null);
  const hydratedKeyRef = useRef<string | null>(null);
  const notesVersionRef = useRef(0);
  const lastNotesStrRef = useRef<string | null>(null);
  const lastLayerIdRef = useRef<number>(ctxActiveLayerId);
  // Bump version on any notes or active-layer change so hydration re-runs.
  if (lastNotesStrRef.current !== ctxStudyNotes || lastLayerIdRef.current !== ctxActiveLayerId) {
    notesVersionRef.current += 1;
    lastNotesStrRef.current = ctxStudyNotes ?? null;
    lastLayerIdRef.current = ctxActiveLayerId;
  }

  useEffect(() => {
    if (!ctxStudyNotes) return;

    const key = `${stropheId}@${ctxActiveLayerId}@${notesVersionRef.current}`;
    if (hydratedKeyRef.current === key && !ctxNoteMerge) return;

    const isLocalPayload = localPayloadRef.current === ctxStudyNotes;
    if (!ctxNoteMerge && ctxActiveNotesPane === viewId && isLocalPayload) {
      hydratedKeyRef.current = key;
      return;
    }

    try {
      const parsed = JSON.parse(ctxStudyNotes) as Record<string, unknown>;
      const layerKey = String(ctxActiveLayerId);
      // Read from layerStrophes[layerId]; fall back to root strophes for layer 0 (migration).
      const layerStrophes = parsed?.layerStrophes as Record<string, StropheNote[]> | undefined;
      let s: StropheNote | undefined = layerStrophes?.[layerKey]?.[stropheId];
      if (!s && ctxActiveLayerId === 0) {
        s = Array.isArray(parsed?.strophes) ? (parsed.strophes as StropheNote[])[stropheId] : undefined;
      }
      const combinedValue = combineNoteValue(s?.title ?? "", s?.text ?? "");
      setNoteValue(combinedValue);
      hydratedKeyRef.current = key;
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
  }, [ctxStudyNotes, stropheId, viewId, ctxActiveNotesPane, ctxNoteMerge, ctxSetNoteMerge, ctxActiveLayerId]);

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
  let parsed: Record<string, unknown> = { main: "", strophes: [] };
  try {
    if (ctxStudyNotes) parsed = JSON.parse(ctxStudyNotes);
  } catch {/* fall back */}

  const layerKey = String(ctxActiveLayerId);
  const existingLayerStrophes = (parsed?.layerStrophes as Record<string, StropheNote[]>) ?? {};

  // Migration: seed layer 0 from the root strophes array on first write.
  if (!existingLayerStrophes["0"] && Array.isArray(parsed.strophes)) {
    existingLayerStrophes["0"] = [...(parsed.strophes as StropheNote[])];
  }

  const currentLayerStrophes: StropheNote[] = Array.isArray(existingLayerStrophes[layerKey])
    ? [...existingLayerStrophes[layerKey]]
    : [];
  while (currentLayerStrophes.length <= stropheId) {
    currentLayerStrophes.push({ title: "", text: "", firstWordId, lastWordId });
  }
  const { title, text } = splitNoteValue(noteValue);
  currentLayerStrophes[stropheId] = { title, text, firstWordId, lastWordId };

  const next = {
    ...parsed,
    layerStrophes: { ...existingLayerStrophes, [layerKey]: currentLayerStrophes },
  };
  return JSON.stringify(next);
}, [ctxStudyNotes, stropheId, noteValue, firstWordId, lastWordId, ctxActiveLayerId]);

useEffect(() => {
  if (!ctxStudyNotes) return;
  if (ctxActiveNotesPane !== viewId) return;

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
}, [buildPayload, ctxStudyNotes, ctxSetStudyNotes, saveNow, ctxActiveNotesPane, viewId]);

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

  return (
    <div className="flex h-full bg-transparent flex-col gap-5.5">
      <textarea
        value={noteValue}
        onChange={(e) => {
          claimActivePane();
          setNoteValue(e.target.value);
        }}
        onFocus={claimActivePane}
        placeholder="Title on the first line. Write your notes beneath it."
        className="resize-none w-full flex-1 rounded border border-stroke bg-white px-5 py-4 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        dir="ltr"
        // style={{ minHeight: STROPHE_NOTE_TEXT_MIN_HEIGHT }}
      />
    </div>
  );
};
