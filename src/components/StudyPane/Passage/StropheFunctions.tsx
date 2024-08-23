import { HebWord, PassageData} from "@/lib/data";

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

export const createWordArray = ({content}: {content:PassageData}):HebWord[] => {
    let wordsArray:HebWord[] = [];
    content.chapters.map((chapter) => {
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

export const createStropheData = (wordsArray:HebWord[]):HebWord[][][] => {
    let stropheArray:HebWord[][][]=[];
    let lineCollectionArray:HebWord[][]=[];
    let lineDivisionArray:HebWord[]=[];
    for (let i = 0; i<wordsArray.length; i++) {
      let word = wordsArray[i];
      if (i === 0) {
        word.stropheDiv=true;
      }
      else if (word.stropheDiv===true) {
        lineCollectionArray.push(lineDivisionArray);
        stropheArray.push(lineCollectionArray);
        lineCollectionArray = [];
        lineDivisionArray = [];
      }
      else if (word.stropheDiv===false || word.stropheDiv==undefined) {
        if (word.w_index===0) {
          lineCollectionArray.push(lineDivisionArray);
          lineDivisionArray = [];
        }
      } 
      lineDivisionArray.push(word);
    }
    lineCollectionArray.push(lineDivisionArray);
    stropheArray.push(lineCollectionArray);
    return stropheArray;
  }

  export const stropheBlock = (wordsArray:HebWord[]):HebWord[][][]=> {
    let stropheArray:HebWord[][][] = [];
    stropheArray = createStropheData(wordsArray);
    return stropheArray;
  }

  export const findStropheNumberWithWordId = (wordArray:HebWord[], wordIdNumber:number): number => {
    let stropheCount: number = 0;
    for (let i = 0; i<wordArray.length; i++) {
      let word = wordArray[i];
      if (word.stropheDiv) {
          stropheCount++;
      }
      if (wordIdNumber === word.id) {
          return stropheCount;
      }
    }
    return 0;
  }