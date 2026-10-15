// Shared read/write helpers for per-strophe notes stored in the study notes JSON.
// Used by both the strophe note panel (StropheNotes) and the inline strophe-title
// editor (StropheBlock) so they write to the same layer bucket the same way.

import { StropheNote, StudyNotes } from "@/lib/types";
import { RichDoc, firstLineText } from "@/lib/richText";

// Read a strophe note for the active layer: prefer layerStrophes[layerId], and
// for layer 0 fall back to the root strophes array (legacy / pre-layer data).
export function readLayerStrophe(
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

/**
 * Return the study-notes JSON with strophe `stropheId` on layer `activeLayerId`
 * set to `noteDoc`. The strophe's title is derived from the note's first line.
 */
export function buildStropheNotesPayload(
  studyNotes: string | undefined,
  activeLayerId: number,
  stropheId: number,
  noteDoc: RichDoc,
  firstWordId: number,
  lastWordId: number,
): string {
  let parsed: Record<string, unknown> = { main: "", strophes: [] };
  try {
    if (studyNotes) parsed = JSON.parse(studyNotes);
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
}

/**
 * POST the full study-notes payload. With `keepalive` (page hide/unload) it
 * falls back to sendBeacon. Resolves true once the payload is persisted.
 */
export async function saveStudyNotes(
  studyId: string,
  payload: string,
  { keepalive = false } = {},
): Promise<boolean> {
  const body = JSON.stringify({ studyId, text: payload });
  try {
    const res = await fetch("/api/noteSync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive,
    });
    if (!res.ok) throw new Error("Save failed");
    return true;
  } catch (err) {
    if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const ok = navigator.sendBeacon("/api/noteSync", new Blob([body], { type: "application/json" }));
      if (!ok) console.error("Beacon failed");
      return ok;
    }
    console.error("Save error:", err);
    return false;
  }
}
