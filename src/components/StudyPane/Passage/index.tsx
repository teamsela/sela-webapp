import React, { useEffect, useContext } from 'react';

import { FormatContext } from '../index';
import { PassageBlock } from './PassageBlock';

import { WordProps } from '@/lib/data';
import { StropheNote, StructureUpdateType, StudyNotes, LanguageMode } from '@/lib/types';
import { updateMetadataInDb } from '@/lib/actions';
import { eventBus } from "@/lib/eventBus";
import { mergeData, extractIdenticalWordsFromPassage } from '@/lib/utils';
import { useState } from 'react';
import { useDragToSelect } from '@/hooks/useDragToSelect';


const Passage = ({
  bibleData,
}: {
  bibleData: WordProps[];
}) => {

  const { ctxStudyId, ctxPassageProps, ctxSetPassageProps, ctxStudyMetadata,
    ctxSetStudyMetadata, ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords,
    ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType, ctxAddToHistory, 
    ctxStudyNotes, ctxSetStudyNotes, ctxSetNoteMerge, ctxLanguageMode, ctxStropheNoteBtnOn
  } = useContext(FormatContext);

  const { isDragging, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(ctxPassageProps);

  useEffect(() => {
    if (ctxStructureUpdateType !== StructureUpdateType.none &&
      (ctxSelectedWords.length > 0 || ctxSelectedStrophes.length >= 1)) {

      const newMetadata = structuredClone(ctxStudyMetadata);

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
          const hasBreak = w.newLine || newMetadata.words[w.wordId]?.lineBreak;
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
          word.wordId <= selectedWordId &&
          (
            (!newMetadata.words[word.wordId]?.ignoreNewLine && word.newLine) ||
            newMetadata.words[word.wordId]?.lineBreak
          )
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
          const word = bibleData.find(w => w.wordId === i);
          if (word?.newLine || newMetadata.words[i]?.lineBreak) {
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
        const isLineStart = (firstSelectedWord.newLine && !newMetadata.words[selectedWordId]?.ignoreNewLine)
          || newMetadata.words[selectedWordId]?.lineBreak;
        if (!isLineStart) {
          newMetadata.words[selectedWordId] = {
            ...(newMetadata.words[selectedWordId] || {}),
            lineBreak: true,
            ignoreNewLine: undefined,
          };
        }

        rangeWords.forEach(w => {
          if (w.newLine || newMetadata.words[w.wordId]?.lineBreak) {
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
          word.wordId > lastSelectedWordId &&
          (
            (!newMetadata.words[word.wordId]?.ignoreNewLine && word.newLine) ||
            newMetadata.words[word.wordId]?.lineBreak
          )
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
      const updatedPassageProps = mergeData(bibleData, newMetadata);

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
          let updatedText = "";
          let updatedTitle = "";
          oldNotes.strophes.forEach((oldStrophe) => {
            if (oldStrophe.firstWordId >= firstWord && oldStrophe.firstWordId <= lastWord) {
              if (updatedTitle === "") {
                updatedTitle += oldStrophe.title;
                updatedText += oldStrophe.text;
              }
              else {
                updatedTitle += " | " + oldStrophe.title;
                updatedText += "\n" + oldStrophe.text;
              }
            };
          });
          updatedStropheNotes[newIndex].title = updatedTitle;
          updatedStropheNotes[newIndex].text = updatedText;
        });
      });
      const updatedStudyNotes: StudyNotes = { ...oldNotes, strophes: updatedStropheNotes };
      ctxSetStudyNotes(JSON.stringify(updatedStudyNotes));
      ctxSetNoteMerge(true);

      // create a new array of notes, then migrate the old notes over:

      
      ctxSetPassageProps(updatedPassageProps);

      updateMetadataInDb(ctxStudyId, newMetadata);

      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
      
      // Reset the structure update type
      ctxSetStructureUpdateType(StructureUpdateType.none);
    }
  }, [ctxStructureUpdateType, ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxSetStructureUpdateType]);

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
        className={`${ctxLanguageMode == LanguageMode.Parallel ? "Parallel" : "singleLang"} flex flex-row ${(ctxStropheNoteBtnOn || ctxLanguageMode == LanguageMode.Parallel) ? 'w-fit max-w-full' : 'w-[100%]'}`}
        id='selaPassage'
      >
        { ctxLanguageMode == LanguageMode.English && 
          <div className={`flex flex-row mx-auto ${ctxStropheNoteBtnOn ? 'w-fit min-w-full' : 'w-[100%]'}`}>
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
          <div className={`flex flex-row mx-auto ${ctxStropheNoteBtnOn ? 'w-fit min-w-full' : 'w-[100%]'}`}>
          <PassageBlock isHebrew={true}/> 
          </div>
        }
      </div>
      
      {isDragging && <div style={getSelectionBoxStyle()} />}
    </div>
    
  );
};

export default Passage;
