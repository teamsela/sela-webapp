import { useContext, useEffect } from "react";

import { updateMetadataInDb } from "@/lib/actions";
import { ColorData, ColorSource, StudyMetadata, WordProps } from "@/lib/data";

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

export const useHighlightManager = (source: ColorSource) => {
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
  } = useContext(FormatContext);
  const activeHighlightId = ctxActiveHighlightIds[source] ?? null;

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
    highlightId: string,
    groups: HighlightGroup[],
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
  ): boolean => {
    const originalColors = new Map<number, ColorData | undefined>();

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
          originalColors.set(wordId, existingColor);
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

    if (originalColors.size > 0) {
      ctxHighlightCacheRef.current.set(
        getHighlightCacheKey(source, highlightId),
        originalColors,
      );
      return true;
    }

    return false;
  };

  const commitHighlightState = (
    metadata: StudyMetadata,
    colorMap: Map<number, ColorData>,
    newActive: string | null,
  ) => {
    ctxSetActiveHighlightId(source, newActive);
    ctxSetWordsColorMap(new Map(colorMap));
    ctxSetStudyMetadata(metadata);
    ctxAddToHistory(metadata);
    updateMetadataInDb(ctxStudyId, metadata);
  };

  const toggleHighlight = (highlightId: string, groups: HighlightGroup[]) => {
    const metadataClone: StudyMetadata = cloneMetadata(ctxStudyMetadata);
    metadataClone.words ??= {};
    const colorMapClone = new Map<number, ColorData>(ctxWordsColorMap);

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
      restoreHighlight(source, activeHighlightId, metadataClone, colorMapClone);
    }

    if (activeHighlightId === highlightId) {
      commitHighlightState(metadataClone, colorMapClone, null);
      return;
    }

    const applied = applyHighlightToMetadata(
      highlightId,
      groups,
      metadataClone,
      colorMapClone,
    );

    if (!applied) {
      commitHighlightState(metadataClone, colorMapClone, null);
      return;
    }

    commitHighlightState(metadataClone, colorMapClone, highlightId);
  };

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
