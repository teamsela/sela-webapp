import { HebWord, PassageData, StropheData, LineData } from "@/lib/data";
import { StropheActionType } from "@/lib/types";
import { updateStropheDiv } from "@/lib/actions";

export const handleStropheAction = (content: PassageData, selectedWord: HebWord, actionType: StropheActionType) : PassageData => {

  let newPassageData = { studyId: content.studyId, strophes: [] } as PassageData;

  let flattenedContent : HebWord[] = [];

  const stropheStylingMap = new Map();
  let stropheIdxUpdate : number = 0;
  let previousDivision : HebWord | null = null;
  let nextDivision : boolean = false;
  let removeNextDivision : boolean = false;
  let addDivList : number[] = [];
  let removeDivList : number[] = [];
  let strophesToUpdate : StropheData[] = [];

  // flatten the passage data into an array of HebWord
  content.strophes.map((strophe, stropheId) => {

    stropheStylingMap.set(stropheId + stropheIdxUpdate, { colorFill: strophe.colorFill, borderColor: strophe.borderColor, expanded: strophe.expanded });
    
    strophe.lines.map((line) => {
      line.words.map((word, wordIdx) => {
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
          addDivList.push(word.id);
          nextDivision = false;
        }
        if (selectedWord.id == word.id) {
          if (actionType == StropheActionType.new) {
            selectedWord.stropheDiv = true;
            addDivList.push(selectedWord.id);
            stropheIdxUpdate = 1;
          }
          else if (actionType == StropheActionType.mergeUp) {
            word.stropheDiv = false;
            if (previousDivision !== null) {
              previousDivision.stropheDiv = false;
              removeDivList.push(previousDivision.id);
            }
            nextDivision = true;
            if (wordIdx == line.words.length-1) { stropheIdxUpdate = -1; }
          }
          else if (actionType == StropheActionType.mergeDown) {
            word.stropheDiv = true;
            addDivList.push(word.id);
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

    word.firstWordInStrophe = false;

    let currentStropheData = newPassageData.strophes[currentStropheIdx];
    if (currentStropheData === undefined || (word.stropheDiv === true)) {
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

  updateStropheDiv(content.studyId, addDivList, removeDivList, strophesToUpdate);

  return newPassageData;
}