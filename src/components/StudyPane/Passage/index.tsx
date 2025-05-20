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

    if (ctxStructureUpdateType !== StructureUpdateType.none && 
      (ctxSelectedWords.length === 1 || ctxSelectedStrophes.length == 1)) {

      let selectedWordId = (ctxSelectedWords.length === 1) ? ctxSelectedWords[0].wordId : 0;

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