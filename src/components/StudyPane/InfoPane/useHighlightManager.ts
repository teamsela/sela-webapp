import { useContext, useEffect } from "react";

import { updateMetadataInDb } from "@/lib/actions";
import { ColorData, ColorSource, StudyMetadata, WordProps } from "@/lib/data";
import { ColorActionType } from "@/lib/types";
import { clearAllFormattingState } from "@/lib/formatting";
import { PRESERVE_CUSTOM_COLORS_ON_SMART_HIGHLIGHT } from "@/lib/featureFlags";

import { FormatContext } from "..";

type HighlightPalette = Omit<ColorData, "source">;

export type HighlightGroup = {
  label: string;
  words: WordProps[];
  palette?: HighlightPalette;
};

const cloneMetadata = (metadata: StudyMetadata): StudyMetadata =>
  structuredClone(metadata);

const getHighlightCacheKey = (highlightSource: ColorSource, highlightId: string) =>
  `${highlightSource}::${highlightId}`;

const stripSource = (color?: ColorData): ColorData | undefined => {
  if (!color) {
    return undefined;
  }
  const { source: _source, ...rest } = color;
  return Object.keys(rest).length > 0 ? rest : undefined;
};

const colorsMatch = (a?: ColorData, b?: ColorData) => {
  const normalize = (color?: ColorData) =>
    color
      ? {
          fill: color.fill ?? null,
          border: color.border ?? null,
          text: color.text ?? null,
        }
      : { fill: null, border: null, text: null };

  const left = normalize(a);
  const right = normalize(b);

  return left.fill === right.fill && left.border === right.border && left.text === right.text;
};

const snapshotAndClearWordColors = (
  metadata: StudyMetadata,
  colorMap: Map<number, ColorData>,
): Map<number, ColorData | undefined> => {
  const snapshot = new Map<number, ColorData | undefined>();
  const entries = Object.entries(metadata.words ?? {});

  entries.forEach(([wordId, wordMetadata]) => {
    if (wordMetadata?.color) {
      snapshot.set(Number(wordId), stripSource(wordMetadata.color));
      delete wordMetadata.color;
    }
  });

  colorMap.forEach((color, wordId) => {
    if (!snapshot.has(wordId)) {
      snapshot.set(wordId, stripSource(color));
    }
  });

  colorMap.clear();
  return snapshot;
};

type HighlightManagerOptions = {
  preserveCustomColors?: boolean;
};

export const useHighlightManager = (
  source: ColorSource,
  options?: HighlightManagerOptions,
) => {
  const {
    ctxStudyMetadata,
    ctxSetStudyMetadata,
    ctxStudyId,
    ctxWordsColorMap,
    ctxSetWordsColorMap,
    ctxAddToHistory,
    ctxActiveHighlightIds,
    ctxSetActiveHighlightId,
    ctxHighlightCacheRef,
    ctxSetColorAction,
  } = useContext(FormatContext);
  const activeHighlightId = ctxActiveHighlightIds[source] ?? null;
  const preserveCustomColors =
    source === "syntax"
      ? options?.preserveCustomColors ?? PRESERVE_CUSTOM_COLORS_ON_SMART_HIGHLIGHT
      : false;

  const restoreHighlight = (
    highlightSource: ColorSource,
    highlightId: string,
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
  ) => {
    const cacheKey = getHighlightCacheKey(highlightSource, highlightId);
    const cachedColors = ctxHighlightCacheRef.current.get(cacheKey);
    if (!cachedColors) {
      return;
    }

    cachedColors.forEach((color, wordId) => {
      const existingMetadata = metadata.words[wordId]
        ? { ...metadata.words[wordId] }
        : {};

      if (color && Object.keys(color).length > 0) {
        existingMetadata.color = { ...color };
        metadata.words[wordId] = existingMetadata;
        colorMap.set(wordId, { ...color });
      } else {
        delete existingMetadata.color;
        if (Object.keys(existingMetadata).length === 0) {
          delete metadata.words[wordId];
        } else {
          metadata.words[wordId] = existingMetadata;
        }
        colorMap.delete(wordId);
      }
    });

    ctxHighlightCacheRef.current.delete(cacheKey);
  };

  const applyHighlightToMetadata = (
  groups: HighlightGroup[],
  metadata: StudyMetadata,
  colorMap: Map<number, ColorData>,
  originalColorsSeed?: Map<number, ColorData | undefined>,
  ): { applied: boolean; originalColors: Map<number, ColorData | undefined> } => {
    const originalColors =
      originalColorsSeed ?? new Map<number, ColorData | undefined>();
    let applied = false;

    groups.forEach((group) => {
      const palette = group.palette;
      if (!palette) {
        return;
      }

      group.words.forEach((word) => {
        const wordId = word.wordId;
        const existingMetadata = metadata.words[wordId]
          ? { ...metadata.words[wordId] }
          : {};
        const existingColor = existingMetadata.color
          ? { ...existingMetadata.color }
          : undefined;

        if (!originalColors.has(wordId)) {
          originalColors.set(wordId, stripSource(existingColor));
        }

        const updatedColor: ColorData = { ...(existingColor ?? {}) };

        if (palette.fill !== undefined) {
          updatedColor.fill = palette.fill;
        }
        if (palette.border !== undefined) {
          updatedColor.border = palette.border;
        }
        if (palette.text !== undefined) {
          updatedColor.text = palette.text;
        }

        if (Object.keys(updatedColor).length > 0) {
          existingMetadata.color = updatedColor;
          metadata.words[wordId] = existingMetadata;
          colorMap.set(wordId, { ...updatedColor, source });
          applied = true;
        } else {
          delete existingMetadata.color;
          if (Object.keys(existingMetadata).length === 0) {
            delete metadata.words[wordId];
          } else {
            metadata.words[wordId] = existingMetadata;
          }
          colorMap.delete(wordId);
        }
      });
    });

    return { applied, originalColors };
  };

  const commitHighlightState = (
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
    newActive: string | null,
  ) => {
    const nextActiveHighlightIds = { ...ctxActiveHighlightIds, [source]: newActive };
    ctxSetActiveHighlightId(source, newActive);
    ctxSetWordsColorMap(new Map(colorMap));
    ctxSetStudyMetadata(metadata);
    ctxAddToHistory(metadata, {
      wordsColorMap: colorMap,
      activeHighlightIds: nextActiveHighlightIds,
      highlightCache: ctxHighlightCacheRef.current,
    });
    updateMetadataInDb(ctxStudyId, metadata);
  };

  const toggleHighlight = (highlightId: string, groups: HighlightGroup[]) => {
    const metadataClone: StudyMetadata = cloneMetadata(ctxStudyMetadata);
    metadataClone.words ??= {};
    const colorMapClone = new Map<number, ColorData>(ctxWordsColorMap);
    let issuedGlobalReset = false;

    const requestGlobalReset = () => {
      if (ctxSetColorAction && !issuedGlobalReset) {
        ctxSetColorAction(ColorActionType.resetAllColor);
        issuedGlobalReset = true;
      }
    };

    const finalizeGlobalReset = () => {
      if (ctxSetColorAction && issuedGlobalReset) {
        setTimeout(() => ctxSetColorAction(ColorActionType.none), 0);
        issuedGlobalReset = false;
      }
    };

    (Object.entries(ctxActiveHighlightIds) as [ColorSource, string | null][]).forEach(
      ([highlightSource, activeId]) => {
        if (!activeId || highlightSource === source) {
          return;
        }
        restoreHighlight(highlightSource, activeId, metadataClone, colorMapClone);
        ctxSetActiveHighlightId(highlightSource, null);
      },
    );

    if (activeHighlightId) {
      requestGlobalReset();
      restoreHighlight(source, activeHighlightId, metadataClone, colorMapClone);
    }

    if (activeHighlightId === highlightId) {
      commitHighlightState(metadataClone, colorMapClone, null);
      finalizeGlobalReset();
      return;
    }

    const canApply = groups.some(
      (group) => Boolean(group.palette) && group.words.length > 0,
    );
    if (!canApply) {
      commitHighlightState(metadataClone, colorMapClone, null);
      finalizeGlobalReset();
      return;
    }

    requestGlobalReset();
    let originalColorsSeed: Map<number, ColorData | undefined> | undefined;
    if (preserveCustomColors) {
      originalColorsSeed = snapshotAndClearWordColors(metadataClone, colorMapClone);
    } else {
      clearAllFormattingState(metadataClone, colorMapClone);
    }

    const { applied, originalColors } = applyHighlightToMetadata(
      groups,
      metadataClone,
      colorMapClone,
      originalColorsSeed,
    );

    if (!applied) {
      commitHighlightState(metadataClone, colorMapClone, null);
      finalizeGlobalReset();
      return;
    }

    ctxHighlightCacheRef.current.set(
      getHighlightCacheKey(source, highlightId),
      originalColors,
    );

    commitHighlightState(metadataClone, colorMapClone, highlightId);
    finalizeGlobalReset();
  };

  useEffect(() => {
    if (!activeHighlightId || source !== "motif") {
      return;
    }

    const words = ctxStudyMetadata.words ?? {};
    const hasMismatch = Array.from(ctxWordsColorMap.entries()).some(([wordId, color]) => {
      if (color?.source !== source) {
        return false;
      }
      return !colorsMatch(words[wordId]?.color, color);
    });

    if (!hasMismatch) {
      return;
    }

    const cleanedMap = new Map(
      Array.from(ctxWordsColorMap.entries()).filter(([_, color]) => color?.source !== source),
    );
    ctxHighlightCacheRef.current.delete(getHighlightCacheKey(source, activeHighlightId));
    ctxSetWordsColorMap(cleanedMap);
    ctxSetActiveHighlightId(source, null);
  }, [
    activeHighlightId,
    ctxHighlightCacheRef,
    ctxSetActiveHighlightId,
    ctxSetWordsColorMap,
    ctxStudyMetadata.words,
    ctxWordsColorMap,
    source,
  ]);

  useEffect(() => {
    if (!activeHighlightId) {
      return;
    }

    const hasActiveHighlightForSource = Array.from(ctxWordsColorMap.values()).some(
      (color) => color?.source === source,
    );

    if (!hasActiveHighlightForSource) {
      ctxHighlightCacheRef.current.delete(
        getHighlightCacheKey(source, activeHighlightId),
      );
      ctxSetActiveHighlightId(source, null);
    }
  }, [
    activeHighlightId,
    ctxWordsColorMap,
    ctxHighlightCacheRef,
    ctxSetActiveHighlightId,
    source,
  ]);

  return {
    activeHighlightId,
    toggleHighlight,
  };
};
