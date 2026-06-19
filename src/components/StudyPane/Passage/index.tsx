import React, { useEffect, useContext, useMemo } from 'react';

import { FormatContext } from '../index';
import { PassageBlock } from './PassageBlock';

import { WordProps } from '@/lib/data';
import { StropheNote, StructureUpdateType, StudyNotes, LanguageMode } from '@/lib/types';
import { updateMetadataInDb } from '@/lib/actions';
import { eventBus } from "@/lib/eventBus";
import { mergeData, extractIdenticalWordsFromPassage } from '@/lib/utils';
import { useState } from 'react';
import { useDragToSelect } from '@/hooks/useDragToSelect';

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
    ctxStudyNotes, ctxSetStudyNotes, ctxSetNoteMerge, ctxLanguageMode, ctxStropheNoteBtnOn,
    ctxReadmeBtnOn
  } = useContext(FormatContext);

  const { isDragging, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(ctxPassageProps);
  const singleLanguageWrapperWidthClass = ctxReadmeBtnOn
    ? 'w-full min-w-0'
    : ctxStropheNoteBtnOn
      ? 'w-fit min-w-full'
      : 'w-[100%]';
  const singleLanguageWrapperPositionClass = ctxReadmeBtnOn ? '' : 'mx-auto';
  const passageShellWidthClass = ctxReadmeBtnOn
    ? 'w-full min-w-0'
    : (ctxStropheNoteBtnOn || ctxLanguageMode == LanguageMode.Parallel)
      ? 'w-fit max-w-full'
      : 'w-[100%]';

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
        // Find the active visible break before the selection in the currently
        // displayed layout, including reader-mode source paragraph breaks.
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

        // Locate the next active visible break after the selection in the
        // current display mode.
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

        // Merge title from previous stanza
        const prevStanzaIdx = getWordToStanzaMap.get(firstWordId);
        if (prevStanzaIdx !== undefined && prevStanzaIdx > 0) {
          const prevStanzaIdxMinus1 = prevStanzaIdx - 1;
          const prevStanza = ctxPassageProps.stanzaProps[prevStanzaIdxMinus1];
          const currentStanza = ctxPassageProps.stanzaProps[prevStanzaIdx];
          const prevTitle = prevStanza?.metadata?.title ?? "";
          const currentTitle = currentStanza?.metadata?.title ?? "";
          const mergedTitle = [prevTitle, currentTitle].filter(Boolean).join(" | ");
          if (mergedTitle) {
            // The combined stanza begins at the previous stanza's first word,
            // so the merged title must live there to be displayed.
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

        // Merge title from next stanza
        const nextStanzaIdx = getWordToStanzaMap.get(lastWordId);
        if (nextStanzaIdx !== undefined && nextStanzaIdx < ctxPassageProps.stanzaProps.length - 1) {
          const nextStanzaIdxPlus1 = nextStanzaIdx + 1;
          const nextStanza = ctxPassageProps.stanzaProps[nextStanzaIdxPlus1];
          const currentStanza = ctxPassageProps.stanzaProps[nextStanzaIdx];
          const currentTitle = currentStanza?.metadata?.title ?? "";
          const nextTitle = nextStanza?.metadata?.title ?? "";
          const mergedTitle = [currentTitle, nextTitle].filter(Boolean).join(" | ");
          if (mergedTitle) {
            // The combined stanza begins at firstWordId, so the merged title
            // must live there to be displayed.
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

      const updatedStropheNotes: StropheNote[] = [];
      let oldNotes: StudyNotes = { main: "", strophes: [] };
      try {
        if (ctxStudyNotes) {
          oldNotes = JSON.parse(ctxStudyNotes);
        }
      } catch (err) {
        console.warn("Failed to parse study notes; resetting to defaults", err);
      }
      updatedPassageProps.stanzaProps.forEach((stanza) => {
        stanza.strophes.forEach((strophe) => {
          const firstWord = strophe.lines[0].words[0].wordId;
          const lastWord = strophe.lines.at(-1)?.words.at(-1)?.wordId ?? 0;
          const newIndex = updatedStropheNotes.push({title: "", text: "", firstWordId: firstWord, lastWordId: lastWord}) - 1;
          const titleParts: string[] = [];
          const textParts: string[] = [];
          oldNotes.strophes.forEach((oldStrophe) => {
            if (oldStrophe.firstWordId >= firstWord && oldStrophe.firstWordId <= lastWord) {
              if (oldStrophe.title) {
                titleParts.push(oldStrophe.title);
              }
              if (oldStrophe.text) {
                textParts.push(oldStrophe.text);
              }
            };
          });
          updatedStropheNotes[newIndex].title = titleParts.join(" | ");
          updatedStropheNotes[newIndex].text = textParts.join("\n");
        });
      });
      const updatedStudyNotes: StudyNotes = { ...oldNotes, strophes: updatedStropheNotes };
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
        className={`${ctxLanguageMode == LanguageMode.Parallel ? "Parallel" : "singleLang"} flex flex-row ${passageShellWidthClass}`}
        id='selaPassage'
      >
        { ctxLanguageMode == LanguageMode.English && 
          <div className={`flex flex-row ${singleLanguageWrapperPositionClass} ${singleLanguageWrapperWidthClass}`}>
            <PassageBlock isHebrew={false}/> 
          </div>
        }
        { ctxLanguageMode == LanguageMode.Parallel && 
          <div className={`flex flex-row mx-auto ${(ctxStropheNoteBtnOn || ctxLanguageMode == LanguageMode.Parallel) ? 'w-fit max-w-full' : 'w-[100%]'}`}>
            <PassageBlock isHebrew={true}/>
            <PassageBlock isHebrew={false}/>
          </div>
        }
        { ctxLanguageMode == LanguageMode.Hebrew && 
          <div className={`flex flex-row ${singleLanguageWrapperPositionClass} ${singleLanguageWrapperWidthClass}`}>
          <PassageBlock isHebrew={true}/> 
          </div>
        }
      </div>
      
      {isDragging && <div style={getSelectionBoxStyle()} />}
    </div>
    
  );
};

export default Passage;
