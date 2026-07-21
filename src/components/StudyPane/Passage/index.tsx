import React, { useEffect, useContext, useMemo, useCallback, useLayoutEffect } from 'react';

import { FormatContext } from '../index';
import { PassageBlock } from './PassageBlock';
import { StropheAlignContext } from './stropheAlign';

import { WordProps } from '@/lib/data';
import { StropheNote, StructureUpdateType, StudyNotes, LanguageMode, NonEnglishDisplayMode } from '@/lib/types';
import { RichDoc, mergeRichDocs } from '@/lib/richText';
import { updateMetadataInDb } from '@/lib/actions';
import { eventBus } from "@/lib/eventBus";
import { mergeData, extractIdenticalWordsFromPassage } from '@/lib/utils';
import { useState } from 'react';
import { useDragToSelect } from '@/hooks/useDragToSelect';


// Line-break helpers shared by the structure-edit logic. In reader mode the
// "source" break is the Bible's own (BSBnewLine / BSBstanzaBreak); otherwise
// it's the folded `newLine`.
const hasReaderSourceBreak = (word: WordProps) =>
  Boolean(word.BSBnewLine || word.BSBstanzaBreak);

const hasSourceLineBreak = (word: WordProps, useReadmeParagraphMode: boolean) =>
  useReadmeParagraphMode ? hasReaderSourceBreak(word) : Boolean(word.newLine);

const hasLineBreakCandidate = (
  word: WordProps,
  metadata: WordProps["metadata"] | undefined,
  useReadmeParagraphMode: boolean,
) =>
  hasSourceLineBreak(word, useReadmeParagraphMode) || Boolean(metadata?.lineBreak);

const hasActiveLineBreak = (
  word: WordProps,
  metadata: WordProps["metadata"] | undefined,
  useReadmeParagraphMode: boolean,
) =>
  Boolean(metadata?.lineBreak) ||
  (!metadata?.ignoreNewLine && hasSourceLineBreak(word, useReadmeParagraphMode));

const Passage = ({
  bibleData,
}: {
  bibleData: WordProps[];
}) => {

  const { ctxStudyId, ctxPassageProps, ctxSetPassageProps, ctxStudyMetadata,
    ctxSetStudyMetadata, ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords,
    ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType, ctxAddToHistory, 
    ctxStudyNotes, ctxSetStudyNotes, ctxSetNoteMerge, ctxLanguageMode, ctxStropheNoteBtnOn, ctxReadmeBtnOn,
    ctxNonEnglishDisplayMode, ctxActiveLayerId,
  } = useContext(FormatContext);

  const nonEnglishDisplayMode =
    ctxNonEnglishDisplayMode === NonEnglishDisplayMode.Transliteration ||
    ctxNonEnglishDisplayMode === NonEnglishDisplayMode.HebrewTransliteration
      ? "transliteration"
      : "hebrew";

  const { isDragging, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(ctxPassageProps);

  const isParallel = ctxLanguageMode === LanguageMode.Parallel;

  // --- Parallel-mode title alignment ---------------------------------------
  // The two language columns are independent DOM subtrees sized to their own
  // content (w-fit), so a long strophe-note title wraps to a different number of
  // lines in each, giving the columns different heights and knocking their rows
  // out of alignment. Fix: measure each column's natural width and apply the max
  // as a min-width to both, so the title wraps identically in each. Font, size
  // and padding already match across columns, so equal width => equal wrapping.
  //
  // Skip it entirely (parallel layout untouched) when no strophe has a title, so
  // views without titles don't get the trailing whitespace equalization adds.
  const hasAnyStropheTitle = useMemo(() => {
    if (!ctxStudyNotes) return false;
    let parsed: Partial<StudyNotes> | null;
    try {
      parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes> | null;
    } catch {
      return false;
    }
    if (!parsed) return false;
    const layerStrophes = parsed.layerStrophes?.[String(ctxActiveLayerId)];
    const rootStrophes = ctxActiveLayerId === 0 && Array.isArray(parsed.strophes) ? parsed.strophes : undefined;
    const hasTitle = (note: StropheNote | undefined) =>
      Boolean(note && typeof note.title === "string" && note.title.trim().length > 0);
    return ctxPassageProps.stanzaProps.some((stanza) =>
      stanza.strophes.some((strophe) =>
        hasTitle(layerStrophes?.[strophe.stropheId] ?? rootStrophes?.[strophe.stropheId])
      )
    );
  }, [ctxStudyNotes, ctxActiveLayerId, ctxPassageProps]);

  const [hebColNode, setHebColNode] = useState<HTMLDivElement | null>(null);
  const [glossColNode, setGlossColNode] = useState<HTMLDivElement | null>(null);
  const [sharedColWidth, setSharedColWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!isParallel || !hasAnyStropheTitle || !hebColNode || !glossColNode) {
      setSharedColWidth(null);
      return;
    }
    // Reset to natural widths first so measurement reflects real content (a stale
    // min-width would otherwise pin both columns and never shrink).
    setSharedColWidth(null);
    let frame = 0;
    const measure = () => {
      const next = Math.max(hebColNode.offsetWidth, glossColNode.offsetWidth);
      // Once the min-width is applied both columns report `next`, so this settles
      // after one extra observer callback instead of oscillating.
      setSharedColWidth((prev) => (prev !== null && Math.abs(prev - next) < 1 ? prev : next));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(hebColNode);
    observer.observe(glossColNode);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // Recompute from scratch when anything that changes natural width changes.
  }, [isParallel, hasAnyStropheTitle, hebColNode, glossColNode, ctxPassageProps, ctxStropheNoteBtnOn, ctxReadmeBtnOn, nonEnglishDisplayMode]);

  // Per-strophe measured title height, reported by the language StropheBlock and
  // consumed by the counter column so it reserves matching vertical space instead
  // of a single placeholder line (a long title can wrap to several lines).
  const [titleHeights, setTitleHeights] = useState<Record<number, number>>({});
  const reportTitleHeight = useCallback((stropheId: number, height: number) => {
    setTitleHeights((prev) => {
      const cur = prev[stropheId];
      // The two language columns share a width, so they report the same height;
      // last-writer-wins is fine and lets the value shrink on zoom-out.
      if (cur !== undefined && Math.abs(cur - height) < 0.5) return prev;
      return { ...prev, [stropheId]: height };
    });
  }, []);
  const alignContextValue = useMemo(
    () => ({ titleHeights, reportTitleHeight }),
    [titleHeights, reportTitleHeight]
  );

  // Build a map from wordId to stanza index for title merging
  const getWordToStanzaMap = useMemo(() => {
    const map = new Map<number, number>();
    ctxPassageProps.stanzaProps.forEach((stanza, stanzaIdx) => {
      stanza.strophes.forEach((strophe) => {
        strophe.lines.forEach((line) => {
          line.words.forEach((word) => {
            map.set(word.wordId, stanzaIdx);
          });
        });
      });
    });
    return map;
  }, [ctxPassageProps]);

  useEffect(() => {
    if (ctxStructureUpdateType !== StructureUpdateType.none &&
      (ctxSelectedWords.length > 0 || ctxSelectedStrophes.length >= 1)) {

      const newMetadata = structuredClone(ctxStudyMetadata);
      const wordById = new Map(bibleData.map((word) => [word.wordId, word]));
      const getWordMetadata = (wordId: number) => newMetadata.words[wordId];
      const hasBreakCandidate = (word: WordProps) =>
        hasLineBreakCandidate(word, getWordMetadata(word.wordId), ctxReadmeBtnOn);
      const hasVisibleLineBreak = (word: WordProps) =>
        hasActiveLineBreak(word, getWordMetadata(word.wordId), ctxReadmeBtnOn);

      const sortedWords = [...ctxSelectedWords].sort((a, b) => a.wordId - b.wordId);
      const firstSelectedWord = sortedWords[0];
      let selectedWordId = (sortedWords.length > 0) ? sortedWords[0].wordId : 0;
      let lastSelectedWordId = (sortedWords.length > 0) ? sortedWords[sortedWords.length - 1].wordId : selectedWordId;

      if (sortedWords.length === 1) {
        if (ctxStructureUpdateType === StructureUpdateType.newLine ||
            ctxStructureUpdateType === StructureUpdateType.mergeWithNextLine) {
          const line = ctxPassageProps.stanzaProps[firstSelectedWord.stanzaId]
            .strophes[firstSelectedWord.stropheId].lines[firstSelectedWord.lineId];
          lastSelectedWordId = line.words[line.words.length - 1].wordId;
        } else if (ctxStructureUpdateType === StructureUpdateType.newStrophe ||
                   ctxStructureUpdateType === StructureUpdateType.mergeWithPrevStrophe ||
                   ctxStructureUpdateType === StructureUpdateType.mergeWithNextStrophe) {
          const lines = ctxPassageProps.stanzaProps[firstSelectedWord.stanzaId]
            .strophes[firstSelectedWord.stropheId].lines;
          lastSelectedWordId = lines.at(-1)?.words.at(-1)?.wordId ?? lastSelectedWordId;
        }
      }

      const rangeWords = bibleData.filter(w => w.wordId > selectedWordId && w.wordId <= lastSelectedWordId);

      if (ctxStructureUpdateType == StructureUpdateType.newLine) {
        // Insert a new line before the selection and keep the remainder of the
        // line after the selection on a new line as well.
        newMetadata.words[selectedWordId] = {
          ...(newMetadata.words[selectedWordId] || {}),
          lineBreak: true,
          ignoreNewLine: undefined
        };

        rangeWords.forEach(w => {
          const hasBreak = hasBreakCandidate(w);
          if (hasBreak) {
            newMetadata.words[w.wordId] = {
              ...(newMetadata.words[w.wordId] || {}),
              lineBreak: undefined,
              ignoreNewLine: true,
            };
          } else if (newMetadata.words[w.wordId]) {
            delete newMetadata.words[w.wordId].lineBreak;
            delete newMetadata.words[w.wordId].ignoreNewLine;
          }
        });

        const nextWordId = lastSelectedWordId + 1;
        if (bibleData.some(word => word.wordId === nextWordId)) {
          newMetadata.words[nextWordId] = {
            ...(newMetadata.words[nextWordId] || {}),
            lineBreak: true,
            ignoreNewLine: undefined
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevLine) {
        // Merge the selected words with the previous line by removing the break
        // before the selection. A break is inserted after the selection so the
        // following text stays on the next line.
        // Find the break before the selection. Ignore words whose default break
        // has already been suppressed via the ignoreNewLine flag.
        const foundIndex = bibleData.findLastIndex(word =>
          word.wordId <= selectedWordId && hasVisibleLineBreak(word)
        );
        if (foundIndex !== -1) {
          const id = bibleData[foundIndex].wordId;
          newMetadata.words[id] = {
            ...(newMetadata.words[id] || {}),
            lineBreak: undefined,
            ignoreNewLine: true,
          };
        }

        for (let i = selectedWordId; i <= lastSelectedWordId; i++) {
          const word = wordById.get(i);
          if (word && hasBreakCandidate(word)) {
            newMetadata.words[i] = {
              ...(newMetadata.words[i] || {}),
              lineBreak: undefined,
              ignoreNewLine: true,
            };
          }
        }

        const nextWordId = lastSelectedWordId + 1;
        if (bibleData.some(word => word.wordId === nextWordId)) {
          newMetadata.words[nextWordId] = {
            ...(newMetadata.words[nextWordId] || {}),
            lineBreak: true,
            ignoreNewLine: undefined
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextLine) {
        // Merge the selected line with the one below. If the selection does not
        // start at the beginning of a line, create a break before it so that any
        // words preceding the selection stay on the original line. When the
        // selection already begins a line we leave the break intact.
        const isLineStart = hasVisibleLineBreak(firstSelectedWord);
        if (!isLineStart) {
          newMetadata.words[selectedWordId] = {
            ...(newMetadata.words[selectedWordId] || {}),
            lineBreak: true,
            ignoreNewLine: undefined,
          };
        }

        rangeWords.forEach(w => {
          if (hasBreakCandidate(w)) {
            newMetadata.words[w.wordId] = {
              ...(newMetadata.words[w.wordId] || {}),
              lineBreak: undefined,
              ignoreNewLine: true,
            };
          }
        });

        // Locate the first real break after the selection. We treat a word as a
        // break only if its default line break isn't already ignored.
        const foundIndex = bibleData.findIndex(word =>
          word.wordId > lastSelectedWordId && hasVisibleLineBreak(word)
        );
        if (foundIndex !== -1) {
          const id = bibleData[foundIndex].wordId;
          newMetadata.words[id] = {
            ...(newMetadata.words[id] || {}),
            lineBreak: undefined,
            ignoreNewLine: true,
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.newStrophe) {
        // Start a new strophe at the selection. A break is also inserted after
        // the strophe so it is visually separated from the following line.
        newMetadata.words[selectedWordId] = {
          ...newMetadata.words[selectedWordId],
          stropheDiv: true,
        };

        rangeWords.forEach(w => {
          if (newMetadata.words[w.wordId]) {
            delete newMetadata.words[w.wordId].stropheDiv;
            delete newMetadata.words[w.wordId].stropheMd;
          }
        });

        const nextWordId = lastSelectedWordId + 1;
        if (bibleData.some(word => word.wordId === nextWordId)) {
          newMetadata.words[nextWordId] = {
            ...(newMetadata.words[nextWordId] || {}),
            stropheDiv: true,
            lineBreak: true,
            ignoreNewLine: undefined
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevStrophe) {
        if (ctxSelectedStrophes.length >= 1) {
          const sortedStrophes = [...ctxSelectedStrophes].sort((a, b) => a.stropheId - b.stropheId);
          sortedStrophes.forEach(s => {
            const firstWordId = s.lines[0].words[0].wordId;
            delete newMetadata.words[firstWordId]?.stropheDiv;
            delete newMetadata.words[firstWordId]?.stropheMd;
          });
          const lastWordId = sortedStrophes.at(-1)!.lines.at(-1)!.words.at(-1)!.wordId;
          const nextWordId = lastWordId + 1;
          newMetadata.words[nextWordId] = {
            ...(newMetadata.words[nextWordId] || {}),
            stropheDiv: true
          };
        } else {
          const foundIndex = bibleData.findLastIndex(word =>
            word.wordId <= selectedWordId && newMetadata.words[word.wordId]?.stropheDiv
          );
          if (foundIndex !== -1) {
            delete newMetadata.words[bibleData[foundIndex].wordId].stropheDiv;
            delete newMetadata.words[bibleData[foundIndex].wordId].stropheMd;
          }

          for (let i = selectedWordId; i <= lastSelectedWordId; i++) {
            if (newMetadata.words[i]) {
              delete newMetadata.words[i].stropheDiv;
              delete newMetadata.words[i].stropheMd;
            }
          }

          const nextWordId = lastSelectedWordId + 1;
          newMetadata.words[nextWordId] = {
            ...(newMetadata.words[nextWordId] || {}),
            stropheDiv: true
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStrophe) {
        if (ctxSelectedStrophes.length >= 1) {
          const sortedStrophes = [...ctxSelectedStrophes].sort((a, b) => a.stropheId - b.stropheId);
          const firstWordId = sortedStrophes[0].lines[0].words[0].wordId;
          newMetadata.words[firstWordId] = {
            ...(newMetadata.words[firstWordId] || {}),
            stropheDiv: true
          };
          const foundIndex = bibleData.findIndex(word =>
            word.wordId > sortedStrophes.at(-1)!.lines.at(-1)!.words.at(-1)!.wordId && newMetadata.words[word.wordId]?.stropheDiv
          );
          if (foundIndex !== -1) {
            newMetadata.words[bibleData[foundIndex].wordId] = {
              ...newMetadata.words[bibleData[foundIndex].wordId],
              stropheDiv: false,
              stropheMd: undefined
            };
          }
        } else {
          newMetadata.words[selectedWordId] = {
            ...(newMetadata.words[selectedWordId] || {}),
            stropheDiv: true
          };

          for (let i = selectedWordId + 1; i <= lastSelectedWordId; i++) {
            if (newMetadata.words[i]) {
              delete newMetadata.words[i].stropheDiv;
              delete newMetadata.words[i].stropheMd;
            }
          }

          const foundIndex = bibleData.findIndex(word =>
            word.wordId > lastSelectedWordId && newMetadata.words[word.wordId]?.stropheDiv
          );
          if (foundIndex !== -1) {
            newMetadata.words[bibleData[foundIndex].wordId] = {
              ...newMetadata.words[bibleData[foundIndex].wordId],
              stropheDiv: false,
              stropheMd: undefined
            };
          }
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.newStanza) {
        const sortedStrophes = [...ctxSelectedStrophes].sort((a, b) =>
          a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);
        if (sortedStrophes.length === 0) {
          return;
        }

        const firstWordId = sortedStrophes[0].lines[0].words[0].wordId;
        const lastStrophe = sortedStrophes[sortedStrophes.length - 1];
        const lastWordIdInStrophes = lastStrophe.lines.at(-1)?.words.at(-1)?.wordId || firstWordId;

        // remove existing stanza breaks within the selection
        sortedStrophes.forEach(s => {
          const wordId = s.lines[0].words[0].wordId;
          if (newMetadata.words[wordId]) {
            delete newMetadata.words[wordId].stanzaDiv;
            delete newMetadata.words[wordId].stanzaMd;
          }
        });

        newMetadata.words[firstWordId] = {
          ...newMetadata.words[firstWordId],
          stanzaDiv: true,
        };

        const nextWordId = lastWordIdInStrophes + 1;
        if (bibleData.some(word => word.wordId === nextWordId)) {
          newMetadata.words[nextWordId] = {
            ...(newMetadata.words[nextWordId] || {}),
            stanzaDiv: true,
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevStanza) {
        const sortedStrophes = [...ctxSelectedStrophes].sort((a, b) =>
          a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);
        if (sortedStrophes.length === 0) {
          return;
        }

        const firstWordId = sortedStrophes[0].lines[0].words[0].wordId;
        const lastStrophe = sortedStrophes[sortedStrophes.length - 1];
        const lastWordId = lastStrophe.lines.at(-1)?.words.at(-1)?.wordId || firstWordId;

        // Merge title from previous stanza — place it on the previous stanza's
        // first word, because that's where the combined stanza begins.
        const prevStanzaIdx = getWordToStanzaMap.get(firstWordId);
        if (prevStanzaIdx !== undefined && prevStanzaIdx > 0) {
          const prevStanzaIdxMinus1 = prevStanzaIdx - 1;
          const prevStanza = ctxPassageProps.stanzaProps[prevStanzaIdxMinus1];
          const currentStanza = ctxPassageProps.stanzaProps[prevStanzaIdx];
          const prevTitle = prevStanza?.metadata?.title ?? "";
          const currentTitle = currentStanza?.metadata?.title ?? "";
          const mergedTitle = [prevTitle, currentTitle].filter(Boolean).join(" | ");
          if (mergedTitle) {
            const survivingFirstWordId = prevStanza.strophes[0].lines[0].words[0].wordId;
            newMetadata.words[survivingFirstWordId] = {
              ...(newMetadata.words[survivingFirstWordId] || {}),
              stanzaMd: {
                ...(newMetadata.words[survivingFirstWordId]?.stanzaMd),
                title: mergedTitle
              }
            };
          }
        }

        const lastStanzaDiv = bibleData.findLastIndex(word =>
          word.wordId <= firstWordId && newMetadata.words[word.wordId]?.stanzaDiv
        );
        if (lastStanzaDiv >= 0) {
          delete newMetadata.words[bibleData[lastStanzaDiv].wordId].stanzaDiv;
          delete newMetadata.words[bibleData[lastStanzaDiv].wordId].stanzaMd;
        }

        const foundIndex = bibleData.findIndex(word =>
           word.wordId > lastWordId && newMetadata.words[word.wordId]?.stropheDiv
        );
        if (foundIndex !== -1) {
          newMetadata.words[bibleData[foundIndex].wordId] = {
            ...newMetadata.words[bibleData[foundIndex].wordId],
            stanzaDiv: true
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStanza) {
        const sortedStrophes = [...ctxSelectedStrophes].sort((a, b) =>
          a.lines[0].words[0].wordId - b.lines[0].words[0].wordId);
        if (sortedStrophes.length === 0) {
          return;
        }

        const firstWordId = sortedStrophes[0].lines[0].words[0].wordId;
        const lastStrophe = sortedStrophes[sortedStrophes.length - 1];
        const lastWordId = lastStrophe.lines.at(-1)?.words.at(-1)?.wordId || firstWordId;

        // Merge title from next stanza — the combined stanza survives at
        // firstWordId (current stanza's first word), so placement is correct.
        const nextStanzaIdx = getWordToStanzaMap.get(lastWordId);
        if (nextStanzaIdx !== undefined && nextStanzaIdx < ctxPassageProps.stanzaProps.length - 1) {
          const nextStanzaIdxPlus1 = nextStanzaIdx + 1;
          const nextStanza = ctxPassageProps.stanzaProps[nextStanzaIdxPlus1];
          const currentStanza = ctxPassageProps.stanzaProps[nextStanzaIdx];
          const currentTitle = currentStanza?.metadata?.title ?? "";
          const nextTitle = nextStanza?.metadata?.title ?? "";
          const mergedTitle = [currentTitle, nextTitle].filter(Boolean).join(" | ");
          if (mergedTitle) {
            newMetadata.words[firstWordId] = {
              ...(newMetadata.words[firstWordId] || {}),
              stanzaMd: {
                ...(newMetadata.words[firstWordId]?.stanzaMd),
                title: mergedTitle
              }
            };
          }
        }

        newMetadata.words[firstWordId] = {
          ...(newMetadata.words[firstWordId] || {}),
          stanzaDiv: true,
        };
        const foundIndex = bibleData.findIndex(word =>
          word.wordId > lastWordId && (newMetadata.words[word.wordId]?.stanzaDiv && newMetadata.words[word.wordId]?.stropheDiv)
        );
        if (foundIndex !== -1) {
          newMetadata.words[bibleData[foundIndex].wordId] = {
            ...newMetadata.words[bibleData[foundIndex].wordId],
            stanzaDiv: false,
            stanzaMd: undefined
          };
        }
      }

      const firstWordIdInPassage = bibleData[0]?.wordId;
      if (firstWordIdInPassage !== undefined) {
        const preservedStanzaMd =
          newMetadata.words[firstWordIdInPassage]?.stanzaMd ??
          ctxStudyMetadata.words[firstWordIdInPassage]?.stanzaMd;
        newMetadata.words[firstWordIdInPassage] = {
          ...(newMetadata.words[firstWordIdInPassage] || {}),
          stanzaDiv: true,
          stanzaMd: preservedStanzaMd
        };
      }

      ctxSetStudyMetadata(newMetadata);
      ctxAddToHistory(newMetadata);
      const updatedPassageProps = mergeData(bibleData, newMetadata, {
        useSourceStanzaBreaks: ctxReadmeBtnOn,
      });

      // Build a table mapping new strophe index → word range for matching old
      // notes. Shared by the root `strophes` migration and per-layer migration.
      const stropheRanges: Array<{ firstWordId: number; lastWordId: number }> = [];
      updatedPassageProps.stanzaProps.forEach((stanza) => {
        stanza.strophes.forEach((strophe) => {
          stropheRanges.push({
            firstWordId: strophe.lines[0].words[0].wordId,
            lastWordId: strophe.lines.at(-1)?.words.at(-1)?.wordId ?? 0,
          });
        });
      });

      // Migrate a single StropheNote[] (root `strophes` or any `layerStrophes`
      // entry) by matching old notes to new strophes via word ranges.
      const migrateStropheArray = (oldArr: StropheNote[]): StropheNote[] => {
        const updated: StropheNote[] = [];
        stropheRanges.forEach((range) => {
          const bodyParts: Array<RichDoc | string> = [];
          let title = "";
          (oldArr ?? []).forEach((old) => {
            if (old.firstWordId >= range.firstWordId && old.firstWordId <= range.lastWordId) {
              const oldTitle = typeof old.title === "string" ? old.title : "";
              if (title === "") {
                title = oldTitle;
              } else if (oldTitle) {
                title += " | " + oldTitle;
              }
              bodyParts.push(old.text ?? "");
            }
          });
          updated.push({
            title,
            text: mergeRichDocs(bodyParts),
            firstWordId: range.firstWordId,
            lastWordId: range.lastWordId,
          });
        });
        return updated;
      };

      let oldNotes: StudyNotes = { main: "", strophes: [] };
      try {
        if (ctxStudyNotes) {
          oldNotes = JSON.parse(ctxStudyNotes);
        }
      } catch (err) {
        console.warn("Failed to parse study notes; resetting to defaults", err);
      }

      const updatedStudyNotes: StudyNotes = {
        ...oldNotes,
        strophes: migrateStropheArray(oldNotes.strophes ?? []),
      };

      // Also migrate every layer's strophe notes — otherwise the stale
      // layerStrophes entries continue to win over the migrated root array
      // (readLayerStrophe prefers layerStrophes[layerId] over strophes).
      if (oldNotes.layerStrophes) {
        const migratedLayers: Record<string, StropheNote[]> = {};
        for (const [layerKey, layerArr] of Object.entries(oldNotes.layerStrophes)) {
          if (Array.isArray(layerArr)) {
            migratedLayers[layerKey] = migrateStropheArray(layerArr);
          }
        }
        updatedStudyNotes.layerStrophes = migratedLayers;
      }
      ctxSetStudyNotes(JSON.stringify(updatedStudyNotes));
      ctxSetNoteMerge(true);

      // create a new array of notes, then migrate the old notes over:

      
      ctxSetPassageProps(updatedPassageProps);
      ctxSetSelectedWords([]);
      ctxSetNumSelectedWords(0);

      updateMetadataInDb(ctxStudyId, newMetadata);

      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
      
      // Reset the structure update type
      ctxSetStructureUpdateType(StructureUpdateType.none);
    }
  }, [ctxStructureUpdateType, ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxSetStructureUpdateType, ctxReadmeBtnOn]);

  const strongNumWordMap = extractIdenticalWordsFromPassage(ctxPassageProps);
  useEffect(() => { // handler select/deselect identical words
    const handler = (word: WordProps) => {
      const identicalWords = strongNumWordMap.get(word.strongNumber);
      if (!identicalWords) {
        return;
      }
      const newSelectedHebWords = [...ctxSelectedWords];

      const toSelect = identicalWords.filter(word => newSelectedHebWords.indexOf(word) < 0);
      if (toSelect.length > 0) { // select all if some are not selected
        toSelect.forEach(word => newSelectedHebWords.push(word));
      } else { // deselect if all are selected
        identicalWords.forEach(word => newSelectedHebWords.splice(newSelectedHebWords.indexOf(word), 1))
      }
      ctxSetSelectedWords(newSelectedHebWords);
      ctxSetNumSelectedWords(newSelectedHebWords.length);
    };

    eventBus.on("selectAllIdenticalWords", handler);
    return () => eventBus.off("selectAllIdenticalWords", handler);
  }, [ctxSelectedWords]);

  return (
    <StropheAlignContext.Provider value={alignContextValue}>
    <div
      key={`passage`}
      onMouseDown={handleMouseDown}
      ref={containerRef}
      style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
      className='h-0 w-[100%]'
    >
      <div className="h-4 w-full" />
      {/* displayMode: this new class is here in case we need to redefine how 'fit' in zoom in/out feature works for parallel display mode */}
      {/* selaPassage is causing selection box shifting bug */}
      <div
        className={`${ctxLanguageMode == LanguageMode.Parallel ? "Parallel" : "singleLang"} flex flex-row ${ctxReadmeBtnOn ? 'w-full min-w-0' : (ctxStropheNoteBtnOn || ctxLanguageMode == LanguageMode.Parallel) ? 'w-fit max-w-full' : 'w-[100%]'}`}
        id='selaPassage'
      >
        { ctxLanguageMode == LanguageMode.English && 
          <div className={`flex flex-row mx-auto ${ctxReadmeBtnOn ? 'w-full min-w-0' : ctxStropheNoteBtnOn ? 'w-fit min-w-full' : 'w-[100%]'}`}>
            <PassageBlock displayMode="gloss"/>
          </div>
        }
        { ctxLanguageMode == LanguageMode.Parallel &&
          // px-1 pairs with the columns' px-1 so the outer edges keep the same 8px
          // as the (now un-doubled) 8px gaps between columns.
          <div className={`flex flex-row mx-auto px-1 ${(ctxStropheNoteBtnOn || ctxLanguageMode == LanguageMode.Parallel) ? 'w-fit max-w-full' : 'w-[100%]'}`}>
            <PassageBlock displayMode={nonEnglishDisplayMode} columnRef={setHebColNode} sharedMinWidth={sharedColWidth}/>
            <PassageBlock displayMode="counter"/>
            <PassageBlock displayMode="gloss" columnRef={setGlossColNode} sharedMinWidth={sharedColWidth}/>
          </div>
        }
        { ctxLanguageMode == LanguageMode.Hebrew && 
          <div className={`flex flex-row mx-auto ${ctxReadmeBtnOn ? 'w-full min-w-0' : ctxStropheNoteBtnOn ? 'w-fit min-w-full' : 'w-[100%]'}`}>
          <PassageBlock displayMode={nonEnglishDisplayMode}/>
          </div>
        }
      </div>
      
      {isDragging && <div style={getSelectionBoxStyle()} />}
    </div>
    </StropheAlignContext.Provider>
  );
};

export default Passage;
