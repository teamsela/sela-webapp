import { HebWord, PassageData, StropheData, LineData, StanzaData } from "@/lib/data";
import { StructureUpdateType } from "@/lib/types";
import { updateLineBreak, updateStanzaDiv, updateStropheDiv } from "@/lib/actions";
import Structure from "../InfoPane/Structure";

export const handleStructureUpdate = (content: PassageData, selectedWord: HebWord | undefined = undefined, selectedStrophe: StropheData[] | undefined = undefined, actionType: StructureUpdateType) : PassageData => {

  let newPassageData = { studyId: content.studyId, stanzas: [] } as PassageData;

  let flattenedContent : HebWord[] = [];

  const stropheStylingMap = new Map();
  const stanzaStylingMap = new Map();
  let stanzaIdxUpdate : number = 0;
  let stropheIdxUpdate : number = 0;
  let runningStropheCount : number = -1;
  let previousLineBreak : HebWord | null = null;
  let previousDivision : HebWord | null = null;
  let previousStanza: HebWord | null = null;
  let nextLineBreak : boolean = false;
  let nextDivision : boolean = false;
  let nextStanzaDiv: boolean = false;
  let removeNextLineBreak : boolean = false;
  let removeNextDivision : boolean = false;
  let removeNextStanzaDiv: boolean = false;
  let insertLineBreakList : number[] = [];
  let removeLineBreakList : number[] = [];
  let insertDivList : number[] = [];
  let removeDivList: number [] = [];
  let insertStanzaList: number [] = [];
  let removeStanzaList: number [] = [];
  let strophesToUpdate : StropheData[] = [];
  let stanzasToUpdate: StanzaData[] = [];

  content.stanzas.map((stanza, stanzaId) => {
    stanzaStylingMap.set(stanzaId + stanzaIdxUpdate, { expanded: stanza.expanded });
    stanza.strophes.map((strophe) => {
      stropheStylingMap.set(++runningStropheCount + stropheIdxUpdate, { colorFill: strophe.colorFill, borderColor: strophe.borderColor, expanded: strophe.expanded });
      strophe.lines.map((line) => {
        line.words.map((word, wordIdx) => {
          if (word.lineBreak === true) {
            previousLineBreak = word;
            if (removeNextLineBreak) {
              word.lineBreak = false;
              removeLineBreakList.push(word.id);
            }
            removeNextLineBreak = false;
          }
          if (nextLineBreak) {
            word.lineBreak = true;
            insertLineBreakList.push(word.id);
            nextLineBreak = false;
          }

          if (word.stropheDiv === true) {
            previousDivision = word;
            if (removeNextDivision) {
              word.stropheDiv = false;
              removeDivList.push(word.id);
            }
            removeNextDivision =false;
          }
          if (nextDivision) {
            word.stropheDiv = true;
            insertDivList.push(word.id);
            nextDivision = false;
          }
          if (word.stanzaDiv === true) {
            previousStanza = word;
            if (removeNextStanzaDiv) {
              word.stanzaDiv = false;
              removeStanzaList.push(word.id);
              removeNextStanzaDiv = false;
            }
          }
          if ((nextStanzaDiv === true) && word.firstWordInStrophe ) {
            word.stanzaDiv = true;
            insertStanzaList.push(word.id);
            nextStanzaDiv = false;
          }
          
          // update by selected strophe
          if ((selectedStrophe !== undefined) && (selectedStrophe.length === 1)) {

            const firstHebWord = selectedStrophe[0].lines[0].words[0];

            // for strophe updates
            if (selectedStrophe[0].id === word.stropheId) {
              const lastLineIdx = selectedStrophe[0].lines.length-1;
              const lastWordIdx = selectedStrophe[0].lines[lastLineIdx].words.length-1;
              const lastHebWord = selectedStrophe[0].lines[lastLineIdx].words[lastWordIdx];
              if ((actionType == StructureUpdateType.mergeWithPrevStrophe) && word.id === lastHebWord.id) {
                selectedWord = lastHebWord;
              }
              else if ((actionType == StructureUpdateType.mergeWithNextStrophe) && word.id === firstHebWord.id) {
                selectedWord = firstHebWord;
              }  
            }

            // for stanza updates
            if (firstHebWord.id === word.id) {
              if ((actionType == StructureUpdateType.newStanza) && word.stropheId !== 0) {
                word.stanzaDiv = true;
                insertStanzaList.push(word.id);
                stanzaIdxUpdate = 1;
              }
              else if ((actionType == StructureUpdateType.mergeWithPrevStanza) && (content.stanzas.length > 1)) {
                word.stanzaDiv = false;
                if (previousStanza !== null) {
                  previousStanza.stanzaDiv = false;
                  removeStanzaList.push(previousStanza.id);
                }
                removeStanzaList.push(word.id);
                nextStanzaDiv = true; 
                if (word.lastLineInStrophe && (wordIdx == line.words.length-1)){
                  stanzaIdxUpdate = -1;
                }
              }
              else if ((actionType == StructureUpdateType.mergeWithNextStanza) && (content.stanzas.length > 1) && (word.stanzaId !== content.stanzas.length -1)) {
                if (word.firstWordInStrophe) {
                  word.stanzaDiv = true;
                  insertStanzaList.push(word.id);
                  removeNextStanzaDiv = true;
                }
                if (word.lastLineInStrophe && (wordIdx == line.words.length-1)){
                  stanzaIdxUpdate = -1;
                }
              }
            }
          }

          if ((selectedWord !== undefined) && (selectedWord.id == word.id)) {
            if (actionType == StructureUpdateType.newLine) {
              selectedWord.lineBreak = true;
              insertLineBreakList.push(selectedWord.id);
            }
            else if (actionType == StructureUpdateType.mergeWithPrevLine) {
              word.lineBreak =false;
              if (previousLineBreak !== null) {
                previousLineBreak.lineBreak = false;
                removeLineBreakList.push(previousLineBreak.id);
              }
              nextLineBreak = true;
            }
            else if (actionType == StructureUpdateType.mergeWithNextLine) {
              word.lineBreak = true;
              insertLineBreakList.push(word.id);
              removeNextLineBreak = true;
            }
            else if (actionType == StructureUpdateType.newStrophe) {
              selectedWord.stropheDiv = true;
              insertDivList.push(selectedWord.id);
              stropheIdxUpdate = 1;
            }
            else if (actionType == StructureUpdateType.mergeWithPrevStrophe) {
              word.stropheDiv = false;
              if (previousDivision !== null) {
                previousDivision.stropheDiv = false;
                removeDivList.push(previousDivision.id);
              }
              nextDivision = true;
              if (wordIdx == line.words.length-1) { stropheIdxUpdate = -1; }
            }
            else if (actionType == StructureUpdateType.mergeWithNextStrophe) {
              word.stropheDiv = true;
              insertDivList.push(word.id);
              removeNextDivision = true;
              if (wordIdx == 0) { stropheIdxUpdate = -1}
            }
          }
          flattenedContent.push(word);
        });
      });
    });
  });

  let currentStanzaIdx = -1;
  let currentStropheIdx = -1;
  let runningStropheIdx = -1;
  let currentLineIdx = -1;

  flattenedContent.forEach(word => {
    word.lastLineInStrophe = false;
    word.firstWordInStrophe = false;

    let currentStanzaData = newPassageData.stanzas[currentStanzaIdx];
    if (currentStanzaData === undefined || (word.stanzaDiv === true)) {
      newPassageData.stanzas.push({id: ++currentStanzaIdx, strophes: []});
      currentStanzaData = newPassageData.stanzas[currentStanzaIdx];
      const currentStanzaStyling = stanzaStylingMap.get(currentStanzaIdx);
      if (currentStanzaStyling !== undefined) {
        (currentStanzaStyling.expanded !== null) && (currentStanzaData.expanded = currentStanzaStyling.expanded);
        stanzasToUpdate.push(currentStanzaData);
      }
      currentStropheIdx = -1;
    }

    let currentStropheData = newPassageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx];
    if (currentStropheData === undefined || (word.stropheDiv === true)) {
      if (currentStropheIdx !== -1) {
        let lastLineIdxInLastStrophe = currentStropheData.lines.length-1;
        currentStropheData.lines[lastLineIdxInLastStrophe].words.forEach(word => {
            word.lastLineInStrophe = true;
        })
      }
      
      newPassageData.stanzas[currentStanzaIdx].strophes.push({id: ++runningStropheIdx, lines: []});
      ++currentStropheIdx; 
      currentStropheData = newPassageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx];
      const currentStropheStyling = stropheStylingMap.get(runningStropheIdx);
      if (currentStropheStyling !== undefined) {
        (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
        (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
        (currentStropheStyling.expanded !== null) && (currentStropheData.expanded = currentStropheStyling.expanded);
        strophesToUpdate.push(currentStropheData);
      }
      currentStropheData.firstStropheInStanza = (currentStropheIdx === 0);
      currentLineIdx = -1;
      word.firstWordInStrophe = true;
    }

    let currentLineData = currentStropheData.lines[currentLineIdx];
    if(currentLineData === undefined || word.lineBreak) {
      currentStropheData.lines.push({id: ++currentLineIdx, words: []});
      currentLineData = currentStropheData.lines[currentLineIdx];
    }

    word.stropheId = runningStropheIdx;
    word.stanzaId = currentStanzaIdx;
    currentLineData.words.push(word);
  });
  let lastLineIdxInLastStrophe = newPassageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines.length-1;
  newPassageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
      word.lastLineInStrophe = true;
  })
  newPassageData.stanzas.map((stanza) => {
    stanza.strophes.map((strophe, stropheId) => {
      strophe.lastStropheInStanza = (stropheId === stanza.strophes.length-1);
    })
  })

  if (insertDivList.length > 0 || removeDivList.length > 0) {
    updateStropheDiv(content.studyId, insertDivList, removeDivList, strophesToUpdate);
  }
  if (insertLineBreakList.length > 0 || removeLineBreakList.length > 0) {
    updateLineBreak(content.studyId, insertLineBreakList, removeLineBreakList);
  }
  if (insertStanzaList.length > 0 || removeStanzaList.length > 0) {
    updateStanzaDiv(content.studyId, insertStanzaList, removeStanzaList, stanzasToUpdate);
  }
  return newPassageData;
}