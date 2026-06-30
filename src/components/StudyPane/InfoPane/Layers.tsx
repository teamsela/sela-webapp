'use client'
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { LuTextSelect } from "react-icons/lu";
import { PiNotePencil } from "react-icons/pi";
import { IconTrash } from "@tabler/icons-react";
import { FormatContext } from "..";
import { ColorActionType } from "@/lib/types";

const ACTION_ICON_SIZE = 22;

// Selection outline colors.
const SELECT_OUTLINE = "#FFC300";
const CLICK_OUTLINE = "#3C50E0";

// Per-layer color defaults.
const DEFAULT_FILL = "#6fa2c1";
const DEFAULT_BORDER = "transparent";
const DEFAULT_TEXT = "#000000";

// Pastel palette cycled through when new layers are created.
const LAYER_COLORS = [DEFAULT_FILL, "#FEF3C7", "#DBEAFE", "#DCFCE7", "#F3E8FF", "#FEE2E2"];

// 'color' = selected through the select button (color customization enabled)
// 'plain' = selected by clicking the box (color customization disabled)
type SelectMode = "plain" | "color";

const Layers = () => {
  const {
    ctxColorAction,
    ctxSelectedColor,
    ctxSetColorAction,
    ctxSetSelectedColor,
    ctxSetColorFill,
    ctxSetBorderColor,
    ctxSetTextColor,
    ctxSetNumSelectedLayers,
    ctxSetSelectedWords,
    ctxSetNumSelectedWords,
    ctxSetSelectedStrophes,
    ctxSetNumSelectedStrophes,
    ctxStudyId,
    ctxStudyNotes,
    ctxSetStudyNotes,
    ctxLayers,
    ctxSetLayers,
    ctxActiveLayerId,
    ctxSwitchLayer,
  } = useContext(FormatContext);

  const [selectMode, setSelectMode] = useState<SelectMode>("plain");

  // Id of the layer whose name is being inline-edited.
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  // Draft value while the rename input is open.
  const [editNameValue, setEditNameValue] = useState("");

  // Id of the layer whose notes panel is currently open.
  const [openNotesLayerId, setOpenNotesLayerId] = useState<number | null>(null);

  // Per-layer notes keyed by layer id, initialised from ctxStudyNotes.
  const [layerNotes, setLayerNotes] = useState<Record<string, string>>(() => {
    if (!ctxStudyNotes) return {};
    try {
      const parsed = JSON.parse(ctxStudyNotes);
      return (parsed?.layerNotes as Record<string, string>) ?? {};
    } catch {
      return {};
    }
  });

  // Save infrastructure for layer notes — mirrors the Notes / StropheNotes pattern.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);

  const saveNow = useCallback(async (payload: string, { keepalive = false } = {}) => {
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
  }, [ctxStudyId]);

  // Flush pending note on unmount / tab hide.
  useEffect(() => {
    const flush = () => {
      const payload = pendingPayloadRef.current;
      if (payload) void saveNow(payload, { keepalive: true });
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pagehide", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pagehide", flush);
    };
  }, [saveNow]);

  // Close the notes panel when the active layer changes.
  useEffect(() => {
    if (openNotesLayerId !== null && openNotesLayerId !== ctxActiveLayerId) {
      setOpenNotesLayerId(null);
    }
  }, [ctxActiveLayerId, openNotesLayerId]);

  // State for the "create new layer" box.
  const [creating, setCreating] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");

  // Drag-and-drop reordering state.
  const dragLayerId = useRef<number | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<number | null>(null);

  // Next available layer id (initialised from the current max id).
  const nextIdRef = useRef(
    ctxLayers.length > 0 ? Math.max(...ctxLayers.map((l) => l.id)) + 1 : 1
  );

  // Colour changes from the toolbar are applied to the layer that was selected
  // via the select button. Plain-click selection disables colour customisation.
  // The guards below keep this effect idempotent: because ctxSetLayers produces a
  // new ctxLayers reference (which re-triggers this effect), we must bail out once
  // the active layer already reflects the requested colour, otherwise we loop.
  useEffect(() => {
    if (selectMode !== "color" || ctxActiveLayerId === null) return;

    const activeLayer = ctxLayers.find((l) => l.id === ctxActiveLayerId);
    if (!activeLayer) return;

    if (
      ctxColorAction === ColorActionType.resetColor ||
      ctxColorAction === ColorActionType.resetAllColor
    ) {
      const alreadyReset =
        activeLayer.fill === DEFAULT_FILL &&
        activeLayer.border === DEFAULT_BORDER &&
        activeLayer.text === DEFAULT_TEXT;
      if (alreadyReset) return;
      ctxSetLayers(
        ctxLayers.map((layer) =>
          layer.id === ctxActiveLayerId
            ? { ...layer, fill: DEFAULT_FILL, border: DEFAULT_BORDER, text: DEFAULT_TEXT }
            : layer
        )
      );
      return;
    }

    if (ctxSelectedColor === "") return;

    // Skip if the active layer already has the requested colour (prevents loop).
    if (ctxColorAction === ColorActionType.colorFill && activeLayer.fill === ctxSelectedColor) return;
    if (ctxColorAction === ColorActionType.borderColor && activeLayer.border === ctxSelectedColor) return;
    if (ctxColorAction === ColorActionType.textColor && activeLayer.text === ctxSelectedColor) return;

    ctxSetLayers(
      ctxLayers.map((layer) => {
        if (layer.id !== ctxActiveLayerId) return layer;
        if (ctxColorAction === ColorActionType.colorFill) return { ...layer, fill: ctxSelectedColor };
        if (ctxColorAction === ColorActionType.borderColor) return { ...layer, border: ctxSelectedColor };
        if (ctxColorAction === ColorActionType.textColor) return { ...layer, text: ctxSelectedColor };
        return layer;
      })
    );
  }, [ctxColorAction, ctxSelectedColor, selectMode, ctxActiveLayerId, ctxLayers, ctxSetLayers]);

  // Turn off toolbar customisation when leaving the pane.
  useEffect(() => {
    return () => { ctxSetNumSelectedLayers(0); };
  }, [ctxSetNumSelectedLayers]);

  // Selecting through the select button enables colour customisation via the toolbar.
  const handleSelect = (layerId: number) => {
    const layer = ctxLayers.find((l) => l.id === layerId);
    if (!layer) return;
    if (selectMode === "color" && ctxActiveLayerId === layerId) {
      handleBoxClick(layerId);
      return;
    }
    ctxSwitchLayer(layerId);
    setSelectMode("color");
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
    ctxSetSelectedStrophes([]);
    ctxSetNumSelectedStrophes(0);
    ctxSetNumSelectedLayers(1);
    ctxSetColorFill(layer.fill);
    ctxSetBorderColor(layer.border);
    ctxSetTextColor(layer.text);
    ctxSetColorAction(ColorActionType.none);
    ctxSetSelectedColor("");
  };

  // Plain click: load this layer's metadata without enabling colour customisation.
  const handleBoxClick = (id: number) => {
    ctxSwitchLayer(id);
    setSelectMode("plain");
    ctxSetNumSelectedLayers(0);
    ctxSetColorAction(ColorActionType.none);
    ctxSetSelectedColor("");
  };

  const handleToggleNotes = (id: number) => {
    setOpenNotesLayerId((prev) => (prev === id ? null : id));
  };

  const handleNoteChange = useCallback((layerId: number, value: string) => {
    const updated = { ...layerNotes, [String(layerId)]: value };
    setLayerNotes(updated);

    let parsed: Record<string, unknown> = {};
    try { if (ctxStudyNotes) parsed = JSON.parse(ctxStudyNotes); } catch { /* ignore */ }
    const payload = JSON.stringify({ ...parsed, layerNotes: updated });
    ctxSetStudyNotes(payload);
    pendingPayloadRef.current = payload;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveNow(payload, { keepalive: false });
    }, 2000);
  }, [layerNotes, ctxStudyNotes, ctxSetStudyNotes, saveNow]);

  const handleDelete = (id: number) => {
    if (ctxLayers.length <= 1) return; // always keep at least one layer
    const newLayers = ctxLayers.filter((l) => l.id !== id);
    ctxSetLayers(newLayers);
    if (ctxActiveLayerId === id) ctxSwitchLayer(newLayers[0].id);
    if (editingLayerId === id) setEditingLayerId(null);
    if (openNotesLayerId === id) setOpenNotesLayerId(null);
  };

  const startEditing = (id: number, currentName: string) => {
    setEditingLayerId(id);
    setEditNameValue(currentName);
  };

  const commitRename = (id: number) => {
    const trimmed = editNameValue.trim();
    if (trimmed) {
      ctxSetLayers(ctxLayers.map((l) => (l.id === id ? { ...l, name: trimmed } : l)));
    }
    setEditingLayerId(null);
  };

  const commitNewLayer = () => {
    const name = newLayerName.trim();
    if (name) {
      const id = nextIdRef.current++;
      const fill = LAYER_COLORS[id % LAYER_COLORS.length];
      const newLayer = { id, name, fill, border: DEFAULT_BORDER, text: DEFAULT_TEXT };
      ctxSetLayers([...ctxLayers, newLayer]);
      ctxSwitchLayer(id);
      setSelectMode("plain");
    }
    setNewLayerName("");
    setCreating(false);
  };

  // ----- Drag and drop reordering -----
  const handleDragStart = (id: number) => { dragLayerId.current = id; };

  const handleDragOver = (event: React.DragEvent, overId: number) => {
    event.preventDefault();
    if (dragOverLayerId !== overId) setDragOverLayerId(overId);
  };

  const handleDrop = (event: React.DragEvent, dropId: number) => {
    event.preventDefault();
    const fromId = dragLayerId.current;
    dragLayerId.current = null;
    setDragOverLayerId(null);
    if (fromId === null || fromId === dropId) return;

    const fromIdx = ctxLayers.findIndex((l) => l.id === fromId);
    const toIdx = ctxLayers.findIndex((l) => l.id === dropId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...ctxLayers];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    ctxSetLayers(reordered);
  };

  const handleDragEnd = () => {
    dragLayerId.current = null;
    setDragOverLayerId(null);
  };

  return (
    <div className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

      <div className="flex flex-col gap-4 mt-8 p-6.5">
        {ctxLayers.map((layer) => {
          const isSelected = layer.id === ctxActiveLayerId;
          const isDragOver = layer.id === dragOverLayerId;

          let outline: string | undefined;
          if (isDragOver) {
            outline = `3px dashed ${SELECT_OUTLINE}`;
          } else if (isSelected) {
            outline = `3px solid ${selectMode === "color" ? SELECT_OUTLINE : CLICK_OUTLINE}`;
          }

          const notesOpen = openNotesLayerId === layer.id;

          return (
            <div key={layer.id} className="flex flex-col gap-2">
              {/* Layer row */}
              <div
                draggable={editingLayerId !== layer.id}
                onDragStart={() => handleDragStart(layer.id)}
                onDragOver={(e) => handleDragOver(e, layer.id)}
                onDrop={(e) => handleDrop(e, layer.id)}
                onDragEnd={handleDragEnd}
                className="flex min-h-[7rem] cursor-grab items-stretch overflow-hidden rounded-xl border transition active:cursor-grabbing"
                style={{
                  borderColor: layer.border !== DEFAULT_BORDER ? layer.border : "transparent",
                  outline,
                  outlineOffset: "2px",
                }}
              >
                {/* Layer name / inline edit */}
                <div
                  className="flex flex-1 items-center justify-center px-5 py-8"
                  style={{ backgroundColor: layer.fill }}
                  onClick={() => handleBoxClick(layer.id)}
                >
                  {editingLayerId === layer.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={() => commitRename(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(layer.id);
                        if (e.key === "Escape") setEditingLayerId(null);
                      }}
                      className="w-full bg-transparent text-center text-lg outline-none"
                      style={{ color: layer.text }}
                    />
                  ) : (
                    <span
                      className="cursor-text text-lg"
                      style={{ color: layer.text }}
                      onDoubleClick={() => startEditing(layer.id, layer.name)}
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Action buttons — only rendered when this layer is active */}
                {isSelected && (
                  <div className="flex flex-col justify-center gap-2 bg-primary px-2 py-3 text-white">
                    <button
                      title="Customize layer"
                      className="hover:opacity-70"
                      onClick={() => handleSelect(layer.id)}
                    >
                      <LuTextSelect size={ACTION_ICON_SIZE} style={{ pointerEvents: "none" }} />
                    </button>
                    <button
                      title={notesOpen ? "Close notes" : "Open notes"}
                      className={`hover:opacity-70 ${notesOpen ? "opacity-70" : ""}`}
                      onClick={() => handleToggleNotes(layer.id)}
                    >
                      <PiNotePencil size={ACTION_ICON_SIZE} style={{ pointerEvents: "none" }} />
                    </button>
                    <button
                      title="Delete layer"
                      className="hover:opacity-70"
                      onClick={() => handleDelete(layer.id)}
                    >
                      <IconTrash size={ACTION_ICON_SIZE} style={{ pointerEvents: "none" }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes textarea — visible when pencil is toggled on */}
              {notesOpen && (
                <textarea
                  autoFocus
                  value={layerNotes[String(layer.id)] ?? ""}
                  onChange={(e) => handleNoteChange(layer.id, e.target.value)}
                  placeholder="Write your notes for this layer…"
                  rows={12}
                  className="resize-none w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              )}
            </div>
          );
        })}

        {/* Create new layer */}
        <div
          className="flex min-h-[80px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-stroke px-5 py-8 text-gray-400 transition hover:border-primary hover:text-primary dark:border-strokedark"
          onClick={() => !creating && setCreating(true)}
        >
          {creating ? (
            <input
              autoFocus
              type="text"
              value={newLayerName}
              placeholder="Layer name"
              onChange={(e) => setNewLayerName(e.target.value)}
              onBlur={commitNewLayer}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewLayer();
                if (e.key === "Escape") {
                  setNewLayerName("");
                  setCreating(false);
                }
              }}
              className="w-full bg-transparent text-center text-lg text-black outline-none"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-current text-2xl leading-none">
              +
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layers;
