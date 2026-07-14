import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { FormatContext } from ".."
import { StropheNote, StudyNotes } from "@/lib/types";
import { RichDoc, combineNoteDoc, firstLineText, toRichDoc } from "@/lib/richText";
import { LanguageContext } from "./PassageBlock";
import RichTextEditor from "../InfoPane/RichTextEditor";

// Read a strophe note for the active layer: prefer layerStrophes[layerId], and
// for layer 0 fall back to the root strophes array (legacy / pre-layer data).
function readLayerStrophe(
  parsed: Partial<StudyNotes>,
  activeLayerId: number,
  stropheId: number,
): StropheNote | undefined {
  // A missing/nullish active layer means the base layer (0).
  const layerId = activeLayerId ?? 0;
  const layerKey = String(layerId);
  const s = parsed?.layerStrophes?.[layerKey]?.[stropheId];
  if (s) return s;
  // Layer 0 falls back to the root strophes array (legacy / pre-layer data).
  if (layerId === 0 && Array.isArray(parsed?.strophes)) {
    return parsed.strophes[stropheId];
  }
  return undefined;
}

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
    ctxInViewMode
  } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext);
  const viewId = useMemo<"heb" | "eng">(() => (ctxIsHebrew ? "heb" : "eng"), [ctxIsHebrew]);
  const editable = !ctxInViewMode;
  // Normalise the active layer once: a nullish id means the base layer (0). Used
  // for BOTH reading and writing so the layerStrophes key never drifts.
  const activeLayerId = ctxActiveLayerId ?? 0;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);
  // True only when the current noteValue reflects an unsaved USER edit. This
  // gates the save effect so that merely switching layers/strophes (which also
  // changes buildPayload) can't write the previous note into the new bucket —
  // otherwise notes would leak across layers.
  const dirtyRef = useRef(false);

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
        const s = readLayerStrophe(parsed, activeLayerId, stropheId);
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
  const lastLayerIdRef = useRef<number>(activeLayerId);
  // Bump version on any notes or active-layer change so hydration re-runs.
  if (lastNotesStrRef.current !== ctxStudyNotes || lastLayerIdRef.current !== activeLayerId) {
    notesVersionRef.current += 1;
    lastNotesStrRef.current = ctxStudyNotes ?? null;
    lastLayerIdRef.current = activeLayerId;
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
      // Hydrated value is not a user edit — don't let the save effect persist it.
      dirtyRef.current = false;
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

  const layerKey = String(activeLayerId);
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
  // Title is the note's first line, derived so the strophe can show it when the
  // note pane is closed.
  currentLayerStrophes[stropheId] = { title: firstLineText(noteDoc), text: noteDoc, firstWordId, lastWordId };

  const next = {
    ...parsed,
    layerStrophes: { ...existingLayerStrophes, [layerKey]: currentLayerStrophes },
  };
  return JSON.stringify(next);
}, [ctxStudyNotes, stropheId, noteDoc, firstWordId, lastWordId, activeLayerId]);

  // Re-hydration effect: placed BEFORE the save effect so that when both fire
  // in the same render (e.g. viewId or ctxActiveNotesPane changes), noteDoc is
  // already up to date when the save effect reads it from its closure.
  useEffect(() => {
    if (!ctxStudyNotes) return;

    const key = `${stropheId}@${activeLayerId}@${notesVersionRef.current}`;
    if (hydratedKeyRef.current === key && !ctxNoteMerge) return;

    const isLocalPayload = localPayloadRef.current === ctxStudyNotes;
    if (!ctxNoteMerge && ctxActiveNotesPane === viewId && isLocalPayload) {
      hydratedKeyRef.current = key;
      return;
    }

    try {
      const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes>;
      const s = readLayerStrophe(parsed, activeLayerId, stropheId);
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
  }, [ctxStudyNotes, stropheId, viewId, ctxActiveNotesPane, ctxNoteMerge, ctxSetNoteMerge, activeLayerId]);

  // Sync context + debounced autosave. Runs AFTER re-hydration so noteDoc is
  // current when buildPayload captures it.
  useEffect(() => {
  if (!editable) return;
  if (!ctxStudyNotes) return;
  if (ctxActiveNotesPane !== viewId) return;
  // Only persist real user edits; ignore layer/strophe context changes.
  if (!dirtyRef.current) return;

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  const payload = buildPayload();
  pendingPayloadRef.current = payload;
  dirtyRef.current = false;

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
