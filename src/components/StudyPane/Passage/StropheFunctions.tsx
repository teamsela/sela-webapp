import { HebWord, PassageData, StropheData, LineData } from "@/lib/data";
import { StropheActionType } from "@/lib/types";
import { updateStropheDiv } from "@/lib/actions";

// export const addNewStrophe = (content: PassageData, selectedWord: HebWord) : PassageData => {

//   let newPassageData = { strophes: [] } as PassageData;

//   let flattenedContent : HebWord[] = [];

//   const stropheStylingMap = new Map();
//   let indexToInsert : number = 0;

//   // flatten the passage data into an array of HebWord
//   content.strophes.map((strophe, stropheId) => {
    
//     stropheStylingMap.set(stropheId + indexToInsert, { colorFill: strophe.colorFill, borderColor: strophe.borderColor });
//     strophe.lines.map((line) => {
//       line.words.map((word) => {
//         if (selectedWord.id == word.id) {
//           selectedWord.stropheDiv = true;
//           indexToInsert++;
//         }
//         flattenedContent.push(word);
//       })
//     });
//   });  

//   let currentStropheIdx = -1;
//   let currentLineIdx = -1;

//   flattenedContent.forEach(word => {

//     let currentStropheData = newPassageData.strophes[currentStropheIdx];
//     if (currentStropheData === undefined || (word.stropheDiv !== undefined && word.stropheDiv)) {
//       newPassageData.strophes.push({id: ++currentStropheIdx, lines: []});
//       currentStropheData = newPassageData.strophes[currentStropheIdx];
//       const currentStropheStyling = stropheStylingMap.get(currentStropheIdx);
//       if (currentStropheStyling !== undefined) {
//           (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
//           (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
//       }        
//       currentLineIdx = -1;
//     }

//     let currentLineData = currentStropheData.lines[currentLineIdx];
//     if (currentLineData === undefined || word.lineBreak) {
//       currentStropheData.lines.push({id: ++currentLineIdx, words: []})
//       currentLineData = currentStropheData.lines[currentLineIdx];
//     }

//     currentLineData.words.push(word);
//   });

//   return newPassageData;
// }

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
  /*
  var stropheId = 0;
  var lineId = 0;

  for (; stropheId < content.strophes.length; stropheId++) {
    for (; lineId < content.strophes[stropheId].lines.length; lineId++) {

      let index = content.strophes[stropheId].lines[lineId].words.indexOf(selectedWord);
      if (index != -1) {
        if (actionType == StropheActionType.new) {
          if (lineId != 0 && index != 0) {
            content.strophes[stropheId].lines[lineId].words[index].stropheDiv = true;
            const newLine = content.strophes[stropheId].lines[lineId].words.splice(index);
          }
        }
        else if (actionType == StropheActionType.mergeUp) {
        }
        else if (actionType == StropheActionType.mergeDown) {

        }
        break;
      }
    }
  }

  if (actionType == StropheActionType.new) {
    if (content.strophes[stropheId].lines[lineId].words.length == 0)
    content.strophes.
  }

  return content;
  */
}

export const newStropheAction = (wordArray:HebWord[], wordIdNumber:number):HebWord[] => {
    for (let i = 0; i<wordArray.length; i++) {
      let word = wordArray[i];
      if (wordIdNumber == word.id) {
        word.stropheDiv = true
        break;
      }
    }
    return wordArray;
  }

export const mergeStropheAction = (wordArray:HebWord[], wordIdNumber:number, direction:string):HebWord[] => {
  let previousDivision:HebWord | null = null;

  if (direction == 'up') {
    for (let i = 0; i<wordArray.length; i++) {
      let word = wordArray[i];
      if (word.stropheDiv === true ) {
        previousDivision = word;
      }
      if (wordIdNumber == word.id) {
        word.stropheDiv = false;
        if (previousDivision !== null) {
          previousDivision.stropheDiv = false;
        }
        wordArray[i+1].stropheDiv = true
        break;
      }
    }
  }
  else if (direction == 'down') {
    for (let i = 0; i<wordArray.length; i++) {
      let word = wordArray[i];
      if (word.stropheDiv === true ) {
        previousDivision = word;
      }
      if (wordIdNumber == word.id) {
        word.stropheDiv = true;
        for (let j = i+1; wordArray.length - i+1; j++) {
          let nextWord = wordArray[j];
          if (nextWord.stropheDiv === true) {
              nextWord.stropheDiv = false;
              break;
          }
        }
        break;
      }
    }
  }
  return wordArray;
    
}

/*
export const createWordArray = ({content}: {content:PassageData}):HebWord[] => {
    let wordsArray:HebWord[] = [];
    content.strophes.map((chapter) => {
      chapter.verses.map((verse) => {
        verse.paragraphs.map((paragraph, p_index) => {
          paragraph.words.map((word, w_index) => {
            word.p_index=p_index;
            word.w_index=w_index;
            wordsArray.push(word);
          })
        })
      })
    })
    return wordsArray;
  }
*/


// export const createStropheData = (wordsArray:HebWord[]):HebWord[][][] => {
//     let stropheArray:HebWord[][][]=[];
//     let lineCollectionArray:HebWord[][]=[];
//     let lineDivisionArray:HebWord[]=[];
//     for (let i = 0; i<wordsArray.length; i++) {
//       let word = wordsArray[i];
//       if (i === 0) {
//         word.stropheDiv=true;
//       }
//       else if (word.stropheDiv===true) {
//         lineCollectionArray.push(lineDivisionArray);
//         stropheArray.push(lineCollectionArray);
//         lineCollectionArray = [];
//         lineDivisionArray = [];
//       }
//       else if (word.stropheDiv===false || word.stropheDiv==undefined) {
//         if (word.w_index===0) {
//           lineCollectionArray.push(lineDivisionArray);
//           lineDivisionArray = [];
//         }
//       } 
//       lineDivisionArray.push(word);
//     }
//     lineCollectionArray.push(lineDivisionArray);
//     stropheArray.push(lineCollectionArray);
//     return stropheArray;
//   }

  // export const stropheBlock = (wordsArray:HebWord[]):HebWord[][][]=> {
  //   let stropheArray:HebWord[][][] = [];
  //   stropheArray = createStropheData(wordsArray);
  //   return stropheArray;
  // }

  // export const findStropheNumberWithWordId = (wordArray:HebWord[], wordIdNumber:number): number => {
  //   let stropheCount: number = 0;
  //   for (let i = 0; i<wordArray.length; i++) {
  //     let word = wordArray[i];
  //     if (word.stropheDiv) {
  //         stropheCount++;
  //     }
  //     if (wordIdNumber === word.id) {
  //         return stropheCount;
  //     }
  //   }
  //   return 0;
  // }