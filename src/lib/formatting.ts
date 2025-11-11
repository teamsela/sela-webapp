import { ColorData, StudyMetadata } from "@/lib/data";

const hasEntries = (record: object) => Object.keys(record).length > 0;

export const clearAllFormattingState = (
  metadata: StudyMetadata,
  colorMap: Map<number, ColorData>,
): boolean => {
  let changed = false;
  const words = metadata.words ?? {};

  Object.entries(words).forEach(([wordId, wordMetadata]) => {
    if (!wordMetadata) {
      return;
    }

    if (wordMetadata.color) {
      delete wordMetadata.color;
      changed = true;
    }

    if (wordMetadata.stropheMd?.color) {
      delete wordMetadata.stropheMd.color;
      if (!hasEntries(wordMetadata.stropheMd)) {
        delete wordMetadata.stropheMd;
      }
      changed = true;
    }

  });

  if (colorMap.size > 0) {
    colorMap.clear();
    changed = true;
  }

  metadata.words = words;

  return changed;
};
