import React, { useEffect, useContext } from 'react';

import { FormatContext } from '../index';
import { StanzaBlock } from './StanzaBlock';

import { WordProps } from '@/lib/data';
import { StructureUpdateType } from '@/lib/types';
import { updateMetadataInDb } from '@/lib/actions';
import { eventBus } from "@/lib/eventBus";
import { mergeData, extractIdenticalWordsFromPassage } from '@/lib/utils';

import { useDragToSelect } from '@/hooks/useDragToSelect';

const Passage = ({
  bibleData,
}: {
  bibleData: WordProps[];
}) => {
  const { ctxStudyId, ctxPassageProps, ctxSetPassageProps, ctxStudyMetadata, 
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, 
    ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType, ctxAddToHistory
  } = useContext(FormatContext);

  const { isDragging, handleMouseDown, containerRef, getSelectionBoxStyle } = useDragToSelect(ctxPassageProps);

  useEffect(() => {
    if (ctxStructureUpdateType !== StructureUpdateType.none ) {
      const sortedWords = [...ctxSelectedWords].sort((a, b) => a.wordId - b.wordId);
      let selectedWordId = (ctxSelectedWords.length === 1) ? ctxSelectedWords[0].wordId : 0;
      if (ctxSelectedWords.length === 1 || ctxSelectedStrophes.length == 1) {
        updateStructureMetadata(
          ctxStructureUpdateType,
          selectedWordId,
          ctxStudyMetadata,
          ctxSelectedStrophes,
          bibleData)
      }
      else if (ctxSelectedWords.length > 1 && sortedWords.every((word, idx) => idx === 0 || sortedWords[idx - 1].wordId + 1 === word.wordId)) {
        const firstWordId = sortedWords.length > 0 ? sortedWords[0].wordId : null;
        const lastWordId = sortedWords.length > 0 ? sortedWords[sortedWords.length - 1].wordId : null;
        if (ctxStructureUpdateType == StructureUpdateType.newLine) {
          if (firstWordId) {
            updateStructureMetadata(ctxStructureUpdateType, firstWordId, ctxStudyMetadata, ctxSelectedStrophes, bibleData)
          }
          else if (lastWordId) {
            updateStructureMetadata(ctxStructureUpdateType, lastWordId, ctxStudyMetadata, ctxSelectedStrophes, bibleData)
          }
        }
        else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevLine) {
          // for each word in sortedWords, call updateStructureMetadata with each word
          sortedWords.forEach(word => {
            updateStructureMetadata(ctxStructureUpdateType, word.wordId, ctxStudyMetadata, ctxSelectedStrophes, bibleData)
          });
        }
        else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextLine) {
          // for each word in sortedWords, call updateStructureMetadata with each word in reverse order
          // TODO: after merging with next line, the new line button is greyed out.
          sortedWords.reverse().forEach(word => {
            updateStructureMetadata(
              ctxStructureUpdateType,
              word.wordId,
              ctxStudyMetadata,
              ctxSelectedStrophes,
              bibleData)
          });
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.newStrophe) {
        ctxStudyMetadata.words[selectedWordId] = {
          ...ctxStudyMetadata.words[selectedWordId],
          stropheDiv: true,
        };
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevStrophe) {
        if (ctxSelectedStrophes.length === 1) {
          // there should always be at least one line and one word in a strophe          
          selectedWordId = ctxSelectedStrophes[0].lines.at(-1)?.words.at(-1)?.wordId || 0;
        }

        const foundIndex = bibleData.findLastIndex(word =>
          word.wordId <= selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
        );
        if (foundIndex !== -1) {
          delete ctxStudyMetadata.words[bibleData[foundIndex].wordId].stropheDiv;
          delete ctxStudyMetadata.words[bibleData[foundIndex].wordId].stropheMd;
        }
        const nextWordId = selectedWordId + 1;
        ctxStudyMetadata.words[nextWordId] = {
          ...(ctxStudyMetadata.words[nextWordId] || {}),
          stropheDiv: true
        };
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStrophe) {
        if (ctxSelectedStrophes.length === 1) {
          // there should always be at least one line and one word in a strophe          
          selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
        }
        ctxStudyMetadata.words[selectedWordId] = {
          ...(ctxStudyMetadata.words[selectedWordId] || {}),
          stropheDiv: true
        };
        const foundIndex = bibleData.findIndex(word =>
          word.wordId > selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
        );

        if (foundIndex !== -1) {
          ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
            ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
            stropheDiv: false,
            stropheMd: undefined
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.newStanza) {
        if (ctxSelectedStrophes.length === 1) {
          // there should always be at least one line and one word in a strophe          
          selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
        }        
        ctxStudyMetadata.words[selectedWordId] = {
          ...ctxStudyMetadata.words[selectedWordId],
          stanzaDiv: true,
        };
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevStanza) {
        if (ctxSelectedStrophes.length === 1) {
          // there should always be at least one line and one word in a strophe          
          selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
        }
        // find the word with a stanza div marker for this stanza
        const lastStanzaDiv = bibleData.findLastIndex(word =>
          word.wordId <= selectedWordId && ctxStudyMetadata.words[word.wordId]?.stanzaDiv
        );
        if (lastStanzaDiv >= 0) {
          delete ctxStudyMetadata.words[bibleData[lastStanzaDiv].wordId].stanzaDiv;
          delete ctxStudyMetadata.words[bibleData[lastStanzaDiv].wordId].stanzaMd;
        }

        // find the index to the first word of the next strophe
        const foundIndex = bibleData.findIndex(word =>
           word.wordId > selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
        );
        if (foundIndex !== -1) {
          ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
            ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
            stanzaDiv: true
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStanza) {
        if (ctxSelectedStrophes.length === 1) {
          // there should always be at least one line and one word in a strophe          
          selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
        }
        ctxStudyMetadata.words[selectedWordId] = {
          ...(ctxStudyMetadata.words[selectedWordId] || {}),
          stanzaDiv: true
        };
        const foundIndex = bibleData.findIndex(word =>
          word.wordId > selectedWordId && (ctxStudyMetadata.words[word.wordId]?.stanzaDiv && ctxStudyMetadata.words[word.wordId]?.stropheDiv)
        );
        if (foundIndex !== -1) {
          ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
            ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
            stanzaDiv: false,
            stanzaMd: undefined
          };
        }
      }
      
      ctxAddToHistory(ctxStudyMetadata);
      const updatedPassageProps = mergeData(bibleData, ctxStudyMetadata);
      ctxSetPassageProps(updatedPassageProps);

      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);

      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
    }

    // Reset the structure update type
    ctxSetStructureUpdateType(StructureUpdateType.none);

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

  function updateStructureMetadata(
    ctxStructureUpdateType: StructureUpdateType,
    selectedWordId: number,
    ctxStudyMetadata: any,
    ctxSelectedStrophes: any[],
    bibleData: any[]
  ) {
    if (ctxStructureUpdateType == StructureUpdateType.newLine) {
      ctxStudyMetadata.words[selectedWordId] = {
        ...(ctxStudyMetadata.words[selectedWordId] || {}),
        lineBreak: true,
        ignoreNewLine: undefined
      };
    }
    else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevLine) {
      const foundIndex = bibleData.findLastIndex(word =>
        word.wordId <= selectedWordId &&
        (word.newLine || ctxStudyMetadata.words[word.wordId]?.lineBreak)
      );
      if (foundIndex !== -1) {
        ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
          ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
          lineBreak: undefined,
          ignoreNewLine: true,
        };
      }
      ctxStudyMetadata.words[selectedWordId] = {
        ...ctxStudyMetadata.words[selectedWordId],
        lineBreak: undefined,
        ignoreNewLine: true,
      };
      const nextWordId = selectedWordId + 1;
      ctxStudyMetadata.words[nextWordId] = {
        ...(ctxStudyMetadata.words[nextWordId] || {}),
        lineBreak: true,
        ignoreNewLine: undefined
      };
    }
    else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextLine) {
      ctxStudyMetadata.words[selectedWordId] = {
        ...(ctxStudyMetadata.words[selectedWordId] || {}),
        lineBreak: true,
        ignoreNewLine: undefined
      };
      const foundIndex = bibleData.findIndex(word =>
        word.wordId > selectedWordId &&
        (word.newLine || ctxStudyMetadata.words[word.wordId]?.lineBreak)
      );
      if (foundIndex !== -1) {
        ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
          ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
          lineBreak: undefined,
          ignoreNewLine: true,
        };
      }
    }
    else if (ctxStructureUpdateType == StructureUpdateType.newStrophe) {
      ctxStudyMetadata.words[selectedWordId] = {
        ...ctxStudyMetadata.words[selectedWordId],
        stropheDiv: true,
      };
    }
    else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevStrophe) {
      if (ctxSelectedStrophes.length === 1) {
        selectedWordId = ctxSelectedStrophes[0].lines.at(-1)?.words.at(-1)?.wordId || 0;
      }
      const foundIndex = bibleData.findLastIndex(word =>
        word.wordId <= selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
      );
      if (foundIndex !== -1) {
        delete ctxStudyMetadata.words[bibleData[foundIndex].wordId].stropheDiv;
        delete ctxStudyMetadata.words[bibleData[foundIndex].wordId].stropheMd;
      }
      const nextWordId = selectedWordId + 1;
      ctxStudyMetadata.words[nextWordId] = {
        ...(ctxStudyMetadata.words[nextWordId] || {}),
        stropheDiv: true
      };
    }
    else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStrophe) {
      if (ctxSelectedStrophes.length === 1) {
        selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
      }
      ctxStudyMetadata.words[selectedWordId] = {
        ...(ctxStudyMetadata.words[selectedWordId] || {}),
        stropheDiv: true
      };
      const foundIndex = bibleData.findIndex(word =>
        word.wordId > selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
      );
      if (foundIndex !== -1) {
        ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
          ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
          stropheDiv: false,
          stropheMd: undefined
        };
      }
    }
    else if (ctxStructureUpdateType == StructureUpdateType.newStanza) {
      if (ctxSelectedStrophes.length === 1) {
        selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
      }        
      ctxStudyMetadata.words[selectedWordId] = {
        ...ctxStudyMetadata.words[selectedWordId],
        stanzaDiv: true,
      };
    }
    else if (ctxStructureUpdateType == StructureUpdateType.mergeWithPrevStanza) {
      if (ctxSelectedStrophes.length === 1) {
        selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
      }
      const lastStanzaDiv = bibleData.findLastIndex(word =>
        word.wordId <= selectedWordId && ctxStudyMetadata.words[word.wordId]?.stanzaDiv
      );
      if (lastStanzaDiv >= 0) {
        delete ctxStudyMetadata.words[bibleData[lastStanzaDiv].wordId].stanzaDiv;
        delete ctxStudyMetadata.words[bibleData[lastStanzaDiv].wordId].stanzaMd;
      }
      const foundIndex = bibleData.findIndex(word =>
        word.wordId > selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
      );
      if (foundIndex !== -1) {
        ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
          ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
          stanzaDiv: true
        };
      }
    }
    else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStanza) {
      if (ctxSelectedStrophes.length === 1) {
        selectedWordId = ctxSelectedStrophes[0].lines.at(0)?.words.at(0)?.wordId || 0;
      }
      ctxStudyMetadata.words[selectedWordId] = {
        ...(ctxStudyMetadata.words[selectedWordId] || {}),
        stanzaDiv: true
      };
      const foundIndex = bibleData.findIndex(word =>
        word.wordId > selectedWordId && (ctxStudyMetadata.words[word.wordId]?.stanzaDiv && ctxStudyMetadata.words[word.wordId]?.stropheDiv)
      );
      if (foundIndex !== -1) {
        ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
          ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
          stanzaDiv: false,
          stanzaMd: undefined
        };
      }
    }
  }
  return (  
    <div
      key={`passage`}
      onMouseDown={handleMouseDown}
      ref={containerRef}
      style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
      className="h-0"
    >
      <div id="selaPassage" className='flex relative pl-2 py-4'>
        {
          ctxPassageProps.stanzaProps.map((stanza) => {
            return (
              <StanzaBlock stanzaProps={stanza} key={stanza.stanzaId} />
            )
          })
        }
      </div>
      {isDragging && <div style={getSelectionBoxStyle()} />}
    </div>
  );
};

export default Passage;