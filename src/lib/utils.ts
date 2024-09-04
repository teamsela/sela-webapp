import { HebWord, PassageData, StropheData } from "./data";
import { ColorActionType } from "./types";

type PsalmBook = {
    [key: number]: number;
}

export const psalmBook: PsalmBook = {
    1: 6,
    2: 12,
    3: 8,
    4: 8,
    5: 12,
    6: 10,
    7: 17,
    8: 9,
    9: 20,
    10: 18,
    11: 7,
    12: 8,
    13: 6,
    14: 7,
    15: 5,
    16: 11,
    17: 15,
    18: 50,
    19: 14,
    20: 9,
    21: 13,
    22: 31,
    23: 6,
    24: 10,
    25: 22,
    26: 12,
    27: 14,
    28: 9,
    29: 11,
    30: 12,
    31: 24,
    32: 11,
    33: 22,
    34: 22,
    35: 28,
    36: 12,
    37: 40,
    38: 22,
    39: 13,
    40: 17,
    41: 13,
    42: 11,
    43: 5,
    44: 26,
    45: 17,
    46: 11,
    47: 9,
    48: 14,
    49: 20,
    50: 23,
    51: 19,
    52: 9,
    53: 6,
    54: 7,
    55: 23,
    56: 13,
    57: 11,
    58: 11,
    59: 17,
    60: 12,
    61: 8,
    62: 12,
    63: 11,
    64: 10,
    65: 13,
    66: 20,
    67: 7,
    68: 35,
    69: 36,
    70: 5,
    71: 24,
    72: 20,
    73: 28,
    74: 23,
    75: 10,
    76: 12,
    77: 20,
    78: 72,
    79: 13,
    80: 19,
    81: 16,
    82: 8,
    83: 18,
    84: 12,
    85: 13,
    86: 17,
    87: 7,
    88: 18,
    89: 52,
    90: 17,
    91: 16,
    92: 15,
    93: 5,
    94: 23,
    95: 11,
    96: 13,
    97: 12,
    98: 9,
    99: 9,
    100: 5,
    101: 8,
    102: 28,
    103: 22,
    104: 35,
    105: 45,
    106: 48,
    107: 43,
    108: 13,
    109: 31,
    110: 7,
    111: 10,
    112: 10,
    113: 9,
    114: 8,
    115: 18,
    116: 19,
    117: 2,
    118: 29,
    119: 176,
    120: 7,
    121: 8,
    122: 9,
    123: 4,
    124: 8,
    125: 5,
    126: 6,
    127: 5,
    128: 6,
    129: 8,
    130: 8,
    131: 3,
    132: 18,
    133: 3,
    134: 3,
    135: 21,
    136: 26,
    137: 9,
    138: 8,
    139: 24,
    140: 13,
    141: 10,
    142: 7,
    143: 12,
    144: 15,
    145: 21,
    146: 10,
    147: 20,
    148: 14,
    149: 9,
    150: 6
};

export type PassageInfo = {
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
};

export function parsePassageInfo(inputString: string) : PassageInfo | Error {

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
    startChapter: parseInt(strStartChapter),
    startVerse: (strStartVerse) ? parseInt(strStartVerse) : 1,
    endChapter: (strEndChapter && ((strStartVerse && strEndVerse) || strStartVerse == undefined && strEndVerse == undefined)) ? parseInt(strEndChapter) : parseInt(strStartChapter),
    endVerse:   (strEndVerse) ? parseInt(strEndVerse) : parseInt(strEndChapter)
  };

  if (strStartVerse == undefined && strEndVerse == undefined) {
    result.endVerse = psalmBook[result.endChapter];
  }
  
  if (result.startChapter <= 0 || psalmBook[result.startChapter] == undefined || psalmBook[result.endChapter] == undefined) {
    return Error("Invalid Psalm");
  } else if (result.startVerse <= 0 || result.startVerse > psalmBook[result.startChapter]) {
    return Error("Invalid start verse: Psalm " + result.startChapter + " only has " + psalmBook[result.startChapter] + " verses");
  } else if (result.endVerse <= 0 || result.startVerse > result.endVerse || result.endVerse > psalmBook[result.endChapter]) {
    return Error("Invalid end verse");
  }

  return result;
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

export function getWordById(passage: PassageData, id: number) : HebWord | null {
  for (let strophe of passage.strophes) {
    for (let line of strophe.lines) {
      for (let word of line.words) {
        if (word.id === id) {
          return word;
        }
      }
    }
  }
  return null;
}

export function wordsHasSameColor(words: HebWord[], actionType: ColorActionType) : boolean {

  if (words.length <= 1) return true;

  let previousColor : string = "";

  switch (actionType) {
    case ColorActionType.colorFill:
      previousColor = words[0].colorFill;
      break;    
    case ColorActionType.borderColor:
      previousColor = words[0].borderColor;
      break;    
    case ColorActionType.textColor:
      previousColor = words[0].textColor;
      break;
    default:
      break;
  }

  for (let word of words) {
      switch (actionType) {
        case ColorActionType.colorFill:
          if (word.colorFill != previousColor) { return false; }
          previousColor = word.colorFill;
          break;
        case ColorActionType.borderColor:
          if (word.borderColor != previousColor) { return false; }
          previousColor = word.borderColor;
          break;
        case ColorActionType.textColor:
          if (word.textColor != previousColor) { return false; }
          previousColor = word.textColor;
          break;
        default:
          break;
      }
  }

  return true;
}

export function strophesHasSameColor(strophes: StropheData[], actionType: ColorActionType) : boolean {

  if (strophes.length <= 1) return true;

  let previousColor : any;

  switch (actionType) {
    case ColorActionType.colorFill:
      previousColor = strophes[0].colorFill;
      break;    
    case ColorActionType.borderColor:
      previousColor = strophes[0].borderColor;
      break;
    default:
      break;
  }

  for (let strophe of strophes) {
      switch (actionType) {
        case ColorActionType.colorFill:
          if (strophe.colorFill != previousColor) { return false; }
          previousColor = strophe.colorFill;
          break;
        case ColorActionType.borderColor:
          if (strophe.borderColor != previousColor) { return false; }
          previousColor = strophe.borderColor;
          break;
        default:
          break;
      }
  }

  return true;
}