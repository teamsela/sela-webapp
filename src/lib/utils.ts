import { ColorData, PassageProps, StropheProps, WordProps, StudyMetadata } from "./data";
import { psalmBook, genesisBook } from "./chapterCounts";
import { ColorActionType } from "./types";
import { z } from 'zod';

const otBookSchema = z.enum(['genesis', 'psalms'])

export type PassageInfo = {
    book: string|null|undefined,
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
};

export function parsePassageInfo(inputString: string, bookString: string) : PassageInfo | Error {

  // Verify the book is in the set of otBookSchema:
  const book = otBookSchema.parse(bookString);
  // Define a regular expression for the Bible passage format
  const passageFormatRegex = /^(\d+)(:(\d+))?(-(\d+)(:(\d+))?)?$/;

  // Check if the input matches the regular expression
  const match = inputString.match(passageFormatRegex);

  if (!match) {
    return Error("Type in passage, e.g.: '23' or '48:1-4'");
  }
  

  //console.log(match);
  const [, strStartChapter, , strStartVerse, , strEndChapter, , strEndVerse] = match;

  let result : PassageInfo = {
    book: bookString,
    startChapter: parseInt(strStartChapter),
    startVerse: (strStartVerse) ? parseInt(strStartVerse) : 1,
    endChapter: (strEndChapter && ((strStartVerse && strEndVerse) || strStartVerse == undefined && strEndVerse == undefined)) ? parseInt(strEndChapter) : parseInt(strStartChapter),
    endVerse:   (strEndVerse) ? parseInt(strEndVerse) : parseInt(strEndChapter)
  };

  const bookMap = result.book === 'genesis'? genesisBook: psalmBook

  if (strStartVerse == undefined && strEndVerse == undefined) {
    result.endVerse = bookMap[result.endChapter];
  }
  
  if (result.startChapter <= 0 || bookMap[result.startChapter] == undefined || bookMap[result.endChapter] == undefined) {
    return Error("Invalid Chapter");
  } else if (result.startVerse <= 0 || result.startVerse > bookMap[result.startChapter]) {
    return Error("Invalid start verse: Chapter " + result.startChapter + " only has " + bookMap[result.startChapter] + " verses");
  } else if (result.endVerse <= 0 || result.startVerse > result.endVerse || result.endVerse > bookMap[result.endChapter]) {
    return Error("Invalid end verse");
  }

  return result;
}

export function extractIdenticalWordsFromPassage(passageProps : PassageProps) : Map<number, WordProps[]>  {
  const strongNumWordsMap = new Map<number, WordProps[]>();
  passageProps.stanzaProps.forEach((stanzas) => {
    stanzas.strophes.forEach((strophe) => {
        strophe.lines.forEach((line) => {
            line.words.forEach((word) => {
                const currentWord = strongNumWordsMap.get(word.strongNumber);
                if (currentWord !== undefined) {
                    currentWord.push(word);
                }
                else {
                  strongNumWordsMap.set(word.strongNumber, [word]);
                }
            })
        })
    });
  });

  return strongNumWordsMap;
}

function measureStringWidth(context: CanvasRenderingContext2D, text: string): number {
  // Measure the width of the text
  const metrics = context.measureText(text);
  
  // Return the width
  return metrics.width;
}

// Function to break a string into lines under a fixed width constraint
export function wrapText(
  text: string,
  context: CanvasRenderingContext2D,
  maxWidth: number
): number {
  
  // Split the text by spaces to form words
  const words = text.split(/[\s-]+/);
  let lineCount : number = 0;
  let currentLine = '';
  
  // Iterate over words
  for (const word of words) {
    const testLine = currentLine + (currentLine === '' ? '' : ' ') + word;
    
    // Measure the width of the test line
    const testLineWidth = measureStringWidth(context, testLine);    

    // Check if the test line width is within the max width constraint
    if (testLineWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      // If the test line is too wide, add the current line to the lines array
      lineCount++;

      // Start a new line with the current word
      currentLine = word;
    }
  }
  
  // Add the last line
  if (currentLine) {
    lineCount++;
    (measureStringWidth(context, currentLine) >= maxWidth) && lineCount++;
  }
  
  return lineCount;
}

export function getWordById(passage: PassageProps, id: number) : WordProps | null {
  for (let stanza of passage.stanzaProps) {
    for (let strophe of stanza.strophes) {
      for (let line of strophe.lines) {
        for (let word of line.words) {
          if (word.wordId === id) {
            return word;
          }
        }
      }
    }
  }
  return null;
}

export function wordsHasSameColor(words: WordProps[], actionType: ColorActionType) : boolean {

  if (words.length <= 1) return true;

  let previousColor : ColorData | undefined = words[0].metadata?.color;

  for (let word of words) {
    switch (actionType) {
      case ColorActionType.colorFill:
        if (word.metadata?.color?.fill != previousColor?.fill) { return false; }
        break;
      case ColorActionType.borderColor:
        if (word.metadata?.color?.border != previousColor?.border) { return false; }
        break;
      case ColorActionType.textColor:
        if (word.metadata?.color?.text != previousColor?.text) { return false; }
        break;
      default:
        break;
    }
    previousColor = word.metadata?.color;
  }

  return true;
}

export function strophesHasSameColor(strophes: StropheProps[], actionType: ColorActionType) : boolean {

  if (strophes.length <= 1) return true;

  let previousColor : ColorData | undefined = strophes[0].metadata?.color;

  for (let strophe of strophes) {
    switch (actionType) {
      case ColorActionType.colorFill:
        if (strophe.metadata.color?.fill != previousColor?.fill) { return false; }
        break;
      case ColorActionType.borderColor:
        if (strophe.metadata.color?.border != previousColor?.border) { return false; }
        break;
      default:
        break;
    }
    previousColor = strophe.metadata.color;
  }

  return true;
}

export const mergeData = (bibleData: WordProps[], studyMetadata : StudyMetadata) : PassageProps => {

  let passageProps : PassageProps = { stanzaProps: [], stanzaCount: 0, stropheCount: 0 }

  let currentStanzaIdx = -1;
  let currentStropheIdx = -1;
  let runningStropheIdx = -1;
  let currentLineIdx = -1;
  let prevVerseNum = 0;

  bibleData.forEach((wordProps) => {

    wordProps.firstStropheInStanza = false;
    wordProps.firstWordInStrophe = false;
    wordProps.metadata = {};

    if (studyMetadata?.words) {
      const currentWordStyling = studyMetadata.words[wordProps.wordId];
      if (currentWordStyling !== undefined) {
        wordProps.metadata = currentWordStyling;
      }  
    }

    let currentStanzaData = passageProps.stanzaProps[currentStanzaIdx];
    if (currentStanzaData === undefined || (wordProps.metadata !== undefined && wordProps.metadata.stanzaDiv)) {
      passageProps.stanzaProps.push({stanzaId: ++currentStanzaIdx, strophes:[], metadata: {}});
      currentStanzaData = passageProps.stanzaProps[currentStanzaIdx];

      const currentStanzaStyling = studyMetadata.words?.[wordProps.wordId]?.stanzaMd || undefined;
      if (currentStanzaStyling !== undefined) {
        currentStanzaData.metadata = currentStanzaStyling;
      }

      currentStropheIdx = -1;
      passageProps.stanzaCount++; 
    }

    let currentStropheData = currentStanzaData.strophes[currentStropheIdx];
    if (currentStropheData === undefined || (wordProps.metadata !== undefined && wordProps.metadata.stropheDiv)) {
      passageProps.stanzaProps[currentStanzaIdx].strophes.push({stropheId: ++runningStropheIdx, lines: [], metadata: {}});
      ++currentStropheIdx;
      currentStropheData = passageProps.stanzaProps[currentStanzaIdx].strophes[currentStropheIdx];

      const currentStropheStyling = studyMetadata.words?.[wordProps.wordId]?.stropheMd || undefined;
      if (currentStropheStyling !== undefined) {
        currentStropheData.metadata = currentStropheStyling;
      }
      currentLineIdx = -1;
      passageProps.stropheCount++; 

      currentStropheData.firstStropheInStanza = (currentStropheIdx === 0);
      wordProps.firstWordInStrophe = true;      
    } 

    let currentLineData = currentStropheData.lines[currentLineIdx];
    let ignoreNewLine = wordProps.metadata?.ignoreNewLine || false;
    if (currentLineData === undefined || (!ignoreNewLine && (wordProps.newLine || (wordProps.metadata && wordProps.metadata.lineBreak)))) {
      currentStropheData.lines.push({lineId: ++currentLineIdx, words: []})
      currentLineData = currentStropheData.lines[currentLineIdx];
    }

    if (prevVerseNum !== wordProps.verse) {
      wordProps.showVerseNum = true;
    }
    wordProps.firstStropheInStanza = (currentStropheIdx === 0);
    wordProps.lastStropheInStanza = false;
    wordProps.lineId = currentLineIdx;
    wordProps.stropheId = currentStropheIdx;
    wordProps.stanzaId = currentStanzaIdx;

    currentLineData.words.push(wordProps);
    prevVerseNum = wordProps.verse;
  });

  passageProps.stanzaProps.map((stanza) => {
    stanza.strophes.map((strophe, stropheId) => {
      strophe.lastStropheInStanza = (stropheId === stanza.strophes.length-1);
      if (strophe.lastStropheInStanza) {
        strophe.lines.forEach((line) => {
          line.words.forEach((word) => {
            word.lastStropheInStanza = true;
          })
        })
      }      
    })
  })

  return passageProps;
}
