import React, { useEffect, useContext } from 'react';

import { FormatContext } from '../index';
import { StanzaBlock } from './StanzaBlock';

import { PassageData, PassageProps, WordProps, StanzaMetadata, StropheMetadata, WordMetadata } from '@/lib/data';
import { StructureUpdateType } from '@/lib/types';
import { updateMetadata } from '@/lib/actions';
import { mergeData } from '@/lib/utils';

import { useDragToSelect } from '@/hooks/useDragToSelect';

const Passage = ({
  bibleData,
}: {
  bibleData: WordProps[];
}) => {
  const { ctxStudyId, ctxPassageProps, ctxSetPassageProps, ctxStudyMetadata, ctxSetStudyMetadata, 
    ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, 
    ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxStructureUpdateType, ctxSetStructureUpdateType
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
        if (selectedWordId !== 0) {
          ctxStudyMetadata.words[selectedWordId] = {
            ...(ctxStudyMetadata.words[selectedWordId] || {}),
            stanzaDiv: undefined,
            stanzaMd: undefined
          };
        }
        // find the index to the first word of the next strophe
        const foundIndex = bibleData.findIndex(word =>
           word.wordId > selectedWordId && ctxStudyMetadata.words[word.wordId]?.stropheDiv
        );
        if (foundIndex !== -1) {
          console.log("Merge with previous stanza. Remove stanzaDiv to ", bibleData[foundIndex].wordId)
          ctxStudyMetadata.words[bibleData[foundIndex].wordId] = {
            ...ctxStudyMetadata.words[bibleData[foundIndex].wordId],
            stanzaDiv: true
          };
        }
      }
      else if (ctxStructureUpdateType == StructureUpdateType.mergeWithNextStanza) {
        if (ctxSelectedStrophes.length === 1) {
          console.log(ctxSelectedStrophes[0])
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
      
      const updatedPassageProps = mergeData(bibleData, ctxStudyMetadata);
      ctxSetPassageProps(updatedPassageProps);
      console.log("Updated", updatedPassageProps)

      ctxSetStudyMetadata(ctxStudyMetadata);
      updateMetadata(ctxStudyId, ctxStudyMetadata);

      ctxSetSelectedStrophes([]);
      ctxSetNumSelectedStrophes(0);
    }
   
    // Reset the structure update type
    ctxSetStructureUpdateType(StructureUpdateType.none);

  }, [ctxStructureUpdateType, ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxSetStructureUpdateType]);
  

  const passageContentStyle = {
    className: `flex-1 relative w-full h-full overflow-hidden transition-all duration-300 mx-auto max-w-screen-3xl p-2 md:p-4 2xl:p-6 pt-6 mt-10`
  }

  //console.log(passageProps);

  return (
    <main className="relative min-h-full w-full">
    
      <div
        key={`passage`}
        onMouseDown={handleMouseDown}
        ref={containerRef}
        style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
        {...passageContentStyle}
        className="h-0"
      >
        <div id="selaPassage" className='flex relative m-2 py-5 top-30 pb-2 z-10'>
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

    </main>
  );
};

export default Passage;