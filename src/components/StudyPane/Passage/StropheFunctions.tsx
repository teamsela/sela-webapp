import { HebWord, PassageData, StropheData, LineData } from "@/lib/data";
import { StropheActionType } from "@/lib/types";
import { updateStropheDiv } from "@/lib/actions";

export const handleStropheAction = (content: PassageData, selectedWord: HebWord, actionType: StropheActionType) : PassageData => {

  let newPassageData = { studyId: content.studyId, strophes: [] } as PassageData;

  let flattenedContent : HebWord[] = [];

  const stropheStylingMap = new Map();
  let indexToInsert : number = 0;
  let previousDivision : HebWord | null = null;
  let nextDivision : boolean = false;
  let removeNextDivision : boolean = false;
  let addDivList : number[] = [];
  let removeDivList : number[] = [];

  // flatten the passage data into an array of HebWord
  content.strophes.map((strophe, stropheId) => {
    
    stropheStylingMap.set(stropheId + indexToInsert, { colorFill: strophe.colorFill, borderColor: strophe.borderColor });
    strophe.lines.map((line) => {
      line.words.map((word) => {
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
            indexToInsert = 1;
          }
          else if (actionType == StropheActionType.mergeUp) {
            word.stropheDiv = false;
            if (previousDivision !== null) {
              previousDivision.stropheDiv = false;
              removeDivList.push(previousDivision.id);
            }
            nextDivision = true;
          }
          else if (actionType == StropheActionType.mergeDown) {
            word.stropheDiv = true;
            addDivList.push(word.id);
            removeNextDivision = true;
          }
        }
        flattenedContent.push(word);
      })
    });
  });  

  let currentStropheIdx = -1;
  let currentLineIdx = -1;

  flattenedContent.forEach(word => {

    let currentStropheData = newPassageData.strophes[currentStropheIdx];
    if (currentStropheData === undefined || (word.stropheDiv === true)) {
      newPassageData.strophes.push({id: ++currentStropheIdx, lines: []});
      currentStropheData = newPassageData.strophes[currentStropheIdx];
      const currentStropheStyling = stropheStylingMap.get(currentStropheIdx);
      if (currentStropheStyling !== undefined) {
        (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
        (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
      }        
      currentLineIdx = -1;
    }

    let currentLineData = currentStropheData.lines[currentLineIdx];
    if (currentLineData === undefined || word.lineBreak) {
      currentStropheData.lines.push({id: ++currentLineIdx, words: []})
      currentLineData = currentStropheData.lines[currentLineIdx];
    }

    currentLineData.words.push(word);
  });

  updateStropheDiv(content.studyId, addDivList, removeDivList);

  return newPassageData;
}

export const findIfFirstWord = (stropheNumber: number, hebWordId: number): boolean => {
  let stropheFirstWord = document.getElementsByClassName('stropheBlock')[stropheNumber]
    ?.getElementsByClassName('line')[0]
    ?.getElementsByClassName('wordBlock')[0]?.id;
  return Number(stropheFirstWord) == hebWordId;
}

export const findIfLastWord = (stropheNumber: number, hebWordId: number): boolean => {
  let stropheLastWord = document.getElementsByClassName('stropheBlock')[stropheNumber]?.getElementsByClassName('line');
  if (stropheLastWord !== null || stropheLastWord !== undefined) {
    stropheLastWord = stropheLastWord[stropheLastWord.length -1].getElementsByClassName('wordBlock');
    return Number(stropheLastWord[stropheLastWord?.length-1]?.id) == hebWordId;
  }
  return false;
}

export const findIfPassageEnd = (stropheNumber: number, hebWordId: number): boolean => {
  let passageEnd = document.getElementsByClassName('stropheBlock');
  if (passageEnd !== null || passageEnd !== undefined) {
    if (passageEnd.length-1 == stropheNumber) {
      return true;
    }
    passageEnd = passageEnd[passageEnd.length-1].getElementsByClassName('line');
    if (passageEnd !== null || passageEnd !== undefined) {
      passageEnd = passageEnd[passageEnd.length-1].getElementsByClassName('wordBlock');
      return Number(passageEnd[passageEnd?.length-1]?.id) == hebWordId;
    }
  }
  return false;
}