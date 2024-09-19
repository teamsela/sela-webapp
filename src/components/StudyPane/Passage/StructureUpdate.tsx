import { HebWord, PassageData, StropheData, LineData } from "@/lib/data";
import { StructureUpdateType } from "@/lib/types";
import { updateLineBreak, updateStropheDiv } from "@/lib/actions";

export const handleStructureUpdate = (content: PassageData, selectedWord: HebWord, actionType: StructureUpdateType) : PassageData => {

  let newPassageData = { studyId: content.studyId, strophes: [] } as PassageData;

  let flattenedContent : HebWord[] = [];

  const stropheStylingMap = new Map();
  let stropheIdxUpdate : number = 0;
  let previousLineBreak : HebWord | null = null;
  let previousDivision : HebWord | null = null;
  let nextLineBreak : boolean = false;
  let nextDivision : boolean = false;
  let removeNextLineBreak : boolean = false;
  let removeNextDivision : boolean = false;
  let insertLineBreakList : number[] = [];
  let removeLineBreakList : number[] = [];
  let insertDivList : number[] = [];
  let removeDivList : number[] = [];
  let strophesToUpdate : StropheData[] = [];

  // flatten the passage data into an array of HebWord
  content.strophes.map((strophe, stropheId) => {

    stropheStylingMap.set(stropheId + stropheIdxUpdate, { colorFill: strophe.colorFill, borderColor: strophe.borderColor, expanded: strophe.expanded });
    
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
          removeNextDivision = false;
        }      
        if (nextDivision) {
          word.stropheDiv = true;
          insertDivList.push(word.id);
          nextDivision = false;
        }

        if (selectedWord.id == word.id) {
          if (actionType == StructureUpdateType.newLine) {
            selectedWord.lineBreak = true;
            insertLineBreakList.push(selectedWord.id);
          }
          else if (actionType == StructureUpdateType.mergeWithPrevLine) {
            word.lineBreak = false;
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
            if (wordIdx == 0) { stropheIdxUpdate = -1; }
          }
        }
        flattenedContent.push(word);
      })
    });
  });  

  let currentStropheIdx = -1;
  let currentLineIdx = -1;

  flattenedContent.forEach(word => {

    word.lastLineInStrophe = false;
    word.firstWordInStrophe = false;

    let currentStropheData = newPassageData.strophes[currentStropheIdx];
    if (currentStropheData === undefined || (word.stropheDiv === true)) {
      if (currentStropheIdx !== -1) {
        let lastLineIdxInLastStrophe = newPassageData.strophes[currentStropheIdx].lines.length-1;
        newPassageData.strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
            word.lastLineInStrophe = true;
        })
      }

      newPassageData.strophes.push({id: ++currentStropheIdx, lines: []});
      currentStropheData = newPassageData.strophes[currentStropheIdx];
      const currentStropheStyling = stropheStylingMap.get(currentStropheIdx);
      if (currentStropheStyling !== undefined) {
        (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
        (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
        (currentStropheStyling.expanded !== null) && (currentStropheData.expanded = currentStropheStyling.expanded);
        strophesToUpdate.push(currentStropheData);
      }        
      currentLineIdx = -1;
      word.firstWordInStrophe = true;
    }

    let currentLineData = currentStropheData.lines[currentLineIdx];
    if (currentLineData === undefined || word.lineBreak) {
      currentStropheData.lines.push({id: ++currentLineIdx, words: []})
      currentLineData = currentStropheData.lines[currentLineIdx];
    }

    word.stropheId = currentStropheIdx;
    currentLineData.words.push(word);
  });
  let lastLineIdxInLastStrophe = newPassageData.strophes[currentStropheIdx].lines.length-1;
  newPassageData.strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
      word.lastLineInStrophe = true;
  })

  if (insertDivList.length > 0 || removeDivList.length > 0) {
    updateStropheDiv(content.studyId, insertDivList, removeDivList, strophesToUpdate);
  }
  if (insertLineBreakList.length > 0 || removeLineBreakList.length > 0) {
    updateLineBreak(content.studyId, insertLineBreakList, removeLineBreakList);
  }

  return newPassageData;
}
