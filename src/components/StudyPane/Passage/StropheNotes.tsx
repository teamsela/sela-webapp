import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { FormatContext } from ".."
import { StropheNote, StudyNotes } from "@/lib/types";
import { RichDoc, combineNoteDoc, toRichDoc } from "@/lib/richText";
import { buildStropheNotesPayload, readLayerStrophe, saveStudyNotes } from "@/lib/stropheNotes";
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
  // True only when the current noteDoc reflects an unsaved USER edit. This
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

  const saveNow = useCallback(
    async (payload: string, { keepalive = false } = {}) => {
      if (!ctxStudyId) return;
      if (lastSavedPayloadRef.current === payload) return;
      if (await saveStudyNotes(ctxStudyId, payload, { keepalive })) {
        lastSavedPayloadRef.current = payload;
      }
    },
    [ctxStudyId],
  );

  const buildPayload = useCallback(
    () => buildStropheNotesPayload(ctxStudyNotes, activeLayerId, stropheId, noteDoc, firstWordId, lastWordId),
    [ctxStudyNotes, stropheId, noteDoc, firstWordId, lastWordId, activeLayerId],
  );

  // Latest study notes, read by the unload flush below. If anything else (e.g.
  // the inline strophe-title editor) has written newer notes since this pane's
  // pending payload was built, flushing that payload would revert their change.
  const latestNotesRef = useRef(ctxStudyNotes);
  latestNotesRef.current = ctxStudyNotes;

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
    if (payload !== latestNotesRef.current) return;
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
