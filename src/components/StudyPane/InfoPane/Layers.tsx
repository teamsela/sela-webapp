'use client'
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { LuTextSelect, LuChevronsDownUp } from "react-icons/lu";
import { IconTrash } from "@tabler/icons-react";
import { FormatContext } from "..";
import { ColorActionType } from "@/lib/types";
import { RichDoc, toRichDoc, firstLineText } from "@/lib/richText";
import RichTextEditor from "./RichTextEditor";
import DeleteLayerModal from "@/components/Modals/DeleteLayer";
import { DEFAULT_LAYER_FILL, DEFAULT_LAYER_BORDER, DEFAULT_LAYER_TEXT } from "@/lib/colors";

const ACTION_ICON_SIZE = 22;

// Selection outline colors.
const SELECT_OUTLINE = "#FFC300";
const CLICK_OUTLINE = "#3C50E0";

// Pastel palette cycled through when new layers are created.
const LAYER_COLORS = [DEFAULT_LAYER_FILL, "#FEF3C7", "#DBEAFE", "#DCFCE7", "#F3E8FF", "#FEE2E2"];

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
    ctxCreateLayer,
    ctxDeleteLayer,
    ctxInViewMode,
  } = useContext(FormatContext);

  const [selectMode, setSelectMode] = useState<SelectMode>("plain");

  // Id of the layer whose name is being inline-edited.
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  // Draft value while the rename input is open.
  const [editNameValue, setEditNameValue] = useState("");

  // Whether the active layer's note is expanded into an editable textarea.
  // When collapsed, only a single-line sneak peek is shown.
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Id of the layer pending deletion (drives the confirmation modal).
  const [layerToDeleteId, setLayerToDeleteId] = useState<number | null>(null);

  // Per-layer notes keyed by layer id, initialised from ctxStudyNotes. Stored as
  // rich-text docs; legacy plain-text notes are migrated to docs on read.
  const [layerNotes, setLayerNotes] = useState<Record<string, RichDoc>>(() => {
    if (!ctxStudyNotes) return {};
    try {
      const parsed = JSON.parse(ctxStudyNotes);
      const raw = (parsed?.layerNotes as Record<string, string | RichDoc>) ?? {};
      const migrated: Record<string, RichDoc> = {};
      for (const [key, value] of Object.entries(raw)) migrated[key] = toRichDoc(value);
      return migrated;
    } catch {
      return {};
    }
  });

  const editable = !ctxInViewMode;

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

  // Collapse the note back to its sneak peek when the active layer changes.
  useEffect(() => {
    setNotesExpanded(false);
  }, [ctxActiveLayerId]);

  // Collapse the expanded note when the user clicks anywhere outside it.
  // A document-level listener (instead of textarea onBlur) avoids the event
  // race that made an in-note collapse button unreliable.
  const expandedNoteRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!notesExpanded) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (expandedNoteRef.current?.contains(target)) return;
      // The rich-text formatting menu is portaled to document.body, so clicks on
      // it land outside the note wrapper — don't treat those as an outside click.
      if (target instanceof Element && target.closest('[role="menu"]')) return;
      setNotesExpanded(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [notesExpanded]);

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
        activeLayer.fill === DEFAULT_LAYER_FILL &&
        activeLayer.border === DEFAULT_LAYER_BORDER &&
        activeLayer.text === DEFAULT_LAYER_TEXT;
      if (alreadyReset) return;
      ctxSetLayers(
        ctxLayers.map((layer) =>
          layer.id === ctxActiveLayerId
            ? { ...layer, fill: DEFAULT_LAYER_FILL, border: DEFAULT_LAYER_BORDER, text: DEFAULT_LAYER_TEXT }
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

  const handleNoteChange = useCallback((layerId: number, doc: RichDoc) => {
    const updated = { ...layerNotes, [String(layerId)]: doc };
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

  // Open the confirmation modal for the given layer.
  const requestDelete = (id: number) => {
    if (ctxLayers.length <= 1) return; // always keep at least one layer
    setLayerToDeleteId(id);
  };

  // Perform the deletion once confirmed. Undoable via the toolbar's undo button.
  const confirmDelete = () => {
    const id = layerToDeleteId;
    if (id === null) return;
    ctxDeleteLayer(id);
    if (editingLayerId === id) setEditingLayerId(null);
    setLayerToDeleteId(null);
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
      const newLayer = { id, name, fill, border: DEFAULT_LAYER_BORDER, text: DEFAULT_LAYER_TEXT };
      // Copies the current layer's structural metadata (minus colour/notes) and
      // makes the new layer active (see ctxCreateLayer).
      ctxCreateLayer(newLayer);
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
    <div className="flex h-full flex-col">

      <div className="flex min-h-0 flex-1 flex-col gap-4 mt-8 p-6.5">
        {ctxLayers.map((layer) => {
          const isSelected = layer.id === ctxActiveLayerId;
          const isDragOver = layer.id === dragOverLayerId;

          // While a note is expanded, only render the active layer so its
          // editor can fill the entire sidebar.
          if (notesExpanded && !isSelected) return null;

          let outline: string | undefined;
          if (isDragOver) {
            outline = `3px dashed ${SELECT_OUTLINE}`;
          } else if (isSelected && selectMode === "color") {
            outline = `3px solid ${SELECT_OUTLINE}`;
          }

          const noteDoc = layerNotes[String(layer.id)];
          const notePeek = firstLineText(noteDoc).trim();

          return (
            // The whole box (header + note) carries the fill background and the
            // selection outline, so highlighting the layer highlights its note too.
            <div
              key={layer.id}
              draggable={editingLayerId !== layer.id}
              onDragStart={() => handleDragStart(layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
              // flex-shrink-0 (and a concrete min-height while expanded) keeps the
              // layer name + one-line note peek visible however short the window is.
              className={`flex cursor-grab flex-col overflow-hidden rounded-xl border-2 transition active:cursor-grabbing ${
                isSelected && notesExpanded ? "min-h-[7.5rem] flex-1" : "flex-shrink-0"
              }`}
              style={{
                backgroundColor: layer.fill,
                borderColor: layer.border !== DEFAULT_LAYER_BORDER ? layer.border : "transparent",
                outline,
                outlineOffset: "2px",
              }}
            >
              {/* Header row: dot, name, action icons */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                onClick={() => handleBoxClick(layer.id)}
              >
                {/* Active/inactive status dot */}
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: isSelected ? CLICK_OUTLINE : "#9CA3AF" }}
                />

                {/* Layer name / inline edit */}
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
                    className="flex-1 bg-transparent text-left text-lg outline-none"
                    style={{ color: layer.text }}
                  />
                ) : (
                  <span
                    className="flex-1 cursor-text text-lg"
                    style={{ color: layer.text }}
                    onDoubleClick={() => startEditing(layer.id, layer.name)}
                  >
                    {layer.name}
                  </span>
                )}

                {/* Action buttons — horizontal, only for the active layer */}
                {isSelected && (
                  <div className="flex flex-shrink-0 items-center gap-3" style={{ color: "#656565" }}>
                    <button
                      title="Customize layer"
                      className="hover:opacity-70"
                      onClick={(e) => { e.stopPropagation(); handleSelect(layer.id); }}
                    >
                      <LuTextSelect size={ACTION_ICON_SIZE} style={{ pointerEvents: "none" }} />
                    </button>
                    <button
                      title="Delete layer"
                      className="hover:opacity-70"
                      onClick={(e) => { e.stopPropagation(); requestDelete(layer.id); }}
                    >
                      <IconTrash size={ACTION_ICON_SIZE} style={{ pointerEvents: "none" }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Note lives inside the box — only for the active layer. Click the
                  peek to expand into a full-height editor; collapse via the
                  top-right button or by clicking outside the note. */}
              {isSelected && (
                notesExpanded ? (
                  <div
                    ref={expandedNoteRef}
                    className="relative flex min-h-0 flex-1 flex-col px-3 pb-3"
                  >
                    <RichTextEditor
                      value={noteDoc}
                      onChange={(doc) => handleNoteChange(layer.id, doc)}
                      editable={editable}
                      placeholder="Click here to add notes"
                      autoFocus
                      fill
                      className="min-h-0 flex-1 bg-white dark:bg-boxdark"
                    />
                    <button
                      title="Collapse notes"
                      className="absolute right-3 top-2 z-20 rounded bg-white/80 hover:opacity-70 dark:bg-boxdark/80"
                      style={{ color: "#656565" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotesExpanded(false);
                      }}
                    >
                      <LuChevronsDownUp size={18} style={{ pointerEvents: "none" }} />
                    </button>
                  </div>
                ) : (
                  <div className="px-3 pb-3">
                    <div
                      className="w-full cursor-text overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm dark:bg-boxdark"
                      onClick={() => setNotesExpanded(true)}
                    >
                      {notePeek ? (
                        <span className="text-black dark:text-white">{notePeek}</span>
                      ) : (
                        <span className="text-gray-400">Click here to add notes</span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })}

        {/* Create new layer — hidden while a note is expanded so the editor
            can fill the whole sidebar. */}
        {!notesExpanded && (
        <div
          className="flex gap-3 px-5 py-4 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stroke text-gray-400 transition hover:border-primary hover:text-primary dark:border-strokedark"
          onClick={() => !creating && setCreating(true)}
        >
          {creating ? (
            <input
              autoFocus
              type="text"
              value={newLayerName}
              placeholder="New Layer"
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
        )}
      </div>

      <DeleteLayerModal
        open={layerToDeleteId !== null}
        setOpen={(isOpen) => { if (!isOpen) setLayerToDeleteId(null); }}
        layerName={ctxLayers.find((l) => l.id === layerToDeleteId)?.name ?? ""}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Layers;
