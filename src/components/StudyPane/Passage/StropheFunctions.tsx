import { HebWord, PassageData} from "@/lib/data";

export const newStropheAction = (wordArray:HebWord[], wordIdNumber:number):HebWord[] => {
    for(let i = 0; i<wordArray.length; i++){
      let word = wordArray[i];
      if (wordIdNumber == word.id){
        word.stropheDivision = true
        break;
      }
    }
    return wordArray;
  }

export const mergeStropheAction = (wordArray:HebWord[], wordIdNumber:number):HebWord[] => {
    let previousDivision:HebWord | null = null;
    for(let i = 0; i<wordArray.length; i++){
        let word = wordArray[i];
        if (word.stropheDivision ===true ) {
            previousDivision = word;
        }
        if (wordIdNumber == word.id){
            word.stropheDivision = false;
            if (previousDivision !== null) {
                previousDivision.stropheDivision = false;
            }
            wordArray[i+1].stropheDivision = true
            break;
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
    for(let i = 0; i<wordsArray.length; i++){
      let word = wordsArray[i];
      if(i === 0) {
        word.stropheDivision=true;
        lineDivisionArray.push(word);
      }
      else if(word.stropheDivision===true){
        lineCollectionArray.push(lineDivisionArray);
        stropheArray.push(lineCollectionArray);
        lineCollectionArray = [];
        lineDivisionArray = [];
        lineDivisionArray.push(word);
      }
      else if(word.stropheDivision===false || word.stropheDivision==undefined){
        if(word.w_index===0){
          lineCollectionArray.push(lineDivisionArray);
          lineDivisionArray = [];
          lineDivisionArray.push(word);
        }
        else{
          lineDivisionArray.push(word);
        }
      } 
    }
    lineCollectionArray.push(lineDivisionArray);
    stropheArray.push(lineCollectionArray);
    return stropheArray;
  }

  export const StropheBlock = (wordsArray:HebWord[]):HebWord[][][]=> {
    let stropheArray:HebWord[][][] = [];
    stropheArray = createStropheData(wordsArray);
    return stropheArray;
  }