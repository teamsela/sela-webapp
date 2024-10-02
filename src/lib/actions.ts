'use server';

import { z } from 'zod';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { getXataClient, StudyRecord, HebBibleRecord } from '@/xata';
import { ge, le } from "@xata.io/client";
import { currentUser } from '@clerk/nextjs';

import { parsePassageInfo } from './utils';
import { StudyData, PassageData, StropheData, HebWord, StanzaData } from './data';
import { ColorActionType } from './types';

const RenameFormSchema = z.object({
  id: z.string(),
  studyName: z.string({ required_error: "Study name is required" })
    .min(5, { message: "Study name must be more than 5 characters" })
    .max(50, { message: "Study name must be less than 50 characters" })
    .trim(),
});

export type State = {
    errors?: {
      studyName?: string[];
    };
    message?: string | null;
};

export async function fetchStudyById(studyId: string) {

  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  //noStore();

  const xataClient = getXataClient();

  try {
      // fetch a study by id from xata
      const study = await xataClient.db.study.filter({ id: studyId }).getFirst();

      let result : StudyData = {
          id: studyId,
          name: study?.name || "",
          owner: study?.owner || "",
          passage: study?.passage || "",
          public: study?.public || false
      };

      return result;
  } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch study record.');        
  }
}

const UpdateStudyName = RenameFormSchema.omit({ id: true });

export async function updateStudyNameWithForm(
  id: string,
  prevState: State,
  formData: FormData,
  ) {

  const validatedFields = UpdateStudyName.safeParse({
    studyName: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to update study.',
    };
  }
  const { studyName } = validatedFields.data;

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: id, name: studyName});
  } catch (error) {
    return { message: 'Database Error: Failed to update study.' };
  }
  redirect('/dashboard/home');
}

export async function updateStudyName(id: string, studyName: string) {

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: id, name: studyName});
  } catch (error) {
    return { message: 'Database Error: Failed to update study name.' };
  }
}

export async function updatePublic(studyId: string, publicAccess: boolean) {
  "use server";

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: studyId, public: publicAccess});
  } catch (error) {
    return { message: 'Database Error: Failed to update study public access.' };
  }
  revalidatePath('/');
}

export async function updateStar(studyId: string, isStarred: boolean) {

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.updateOrThrow({ id: studyId, starred: isStarred });
  } catch (error) {
    return { message: 'Database Error: Failed to update study star.' };
  }
  revalidatePath('/');   
}

export async function updateWordColor(studyId: string, selectedWordIds: number[], actionType: ColorActionType, newColor: string | null) {
  "use server";

  let operations: any = [];

  let fieldsToUpdate: {};

  switch (actionType) {
    case ColorActionType.colorFill:
      fieldsToUpdate = { colorFill: newColor };
      break;
    case ColorActionType.borderColor:
      fieldsToUpdate = { borderColor: newColor };
      break;
    case ColorActionType.textColor:
      fieldsToUpdate = { textColor: newColor };
      break;
    case ColorActionType.resetColor:
      fieldsToUpdate = {
        colorFill: null,
        borderColor: null,
        textColor: null
      }
      break;
    default:
      break;
  }

  selectedWordIds.forEach((wordId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + wordId,
        fields: { studyId: studyId, hebId: wordId, ...fieldsToUpdate },
        upsert: true,
      },
    })
  })
  //console.log(util.inspect(operations, {showHidden: false, depth: null, colors: true}))

  const xataClient = getXataClient();
  let result : any;
  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update word color for study:' + studyId + ', result: ' + result };
  }
}

export async function updateIndented(studyId: string, hebId: number, numIndent: number) {
  "use server";

  const xataClient = getXataClient();

  let result : any;

  try {
    result = await xataClient.transactions.run([
      {
        update: {
          table: "styling" as const,
          id: studyId + "_" + hebId,
          fields: { studyId: studyId, hebId: hebId, numIndent: numIndent },
          upsert: true,
        }
      }
    ]);
  } catch (error) {
    return { message: 'Database Error: Failed to update indented for study:' + studyId + ', result: ' + result };
  }
}

export async function updateStropheColor(studyId: string, selectedStropheIds: number[], actionType: ColorActionType, newColor: string | null) {
  "use server";

  let operations: any = [];

  let fieldsToUpdate: {};

  switch (actionType) {
    case ColorActionType.colorFill:
      fieldsToUpdate = { colorFill: newColor };
      break;
    case ColorActionType.borderColor:
      fieldsToUpdate = { borderColor: newColor };
      break;
    case ColorActionType.resetColor:
      fieldsToUpdate = {
        colorFill: null,
        borderColor: null,
      }
      break;
    default:
      break;
  }

  selectedStropheIds.forEach((stropheId) => {
    operations.push({
      update: {
        table: "stropheStyling" as const,
        id: studyId + "_" + stropheId,
        fields: { studyId: studyId, stropheId: stropheId, ...fieldsToUpdate },
        upsert: true,
      },
    })
  })
  //console.log(util.inspect(operations, {showHidden: false, depth: null, colors: true}))

  const xataClient = getXataClient();
  let result : any;
  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update strophe color for study:' + studyId + ', result: ' + result };
  }
}

export async function updateStropheState(studyId: string, stropheId: number, newState: boolean) {
  "use server";

  const xataClient = getXataClient();

  let result : any;
  let operations: any = [];

  operations.push({
      update: {
        table: "stropheStyling" as const,
        id: studyId + "_" + stropheId,
        fields: { studyId: studyId, stropheId: stropheId, expanded: newState },
        upsert: true,
      }
  })

  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update styling strophe expanded state.' };
  }
}

export async function updateStanzaState(studyId: string, stanzaId: number, newState: boolean) {
  "use server";
  const xataClient = getXataClient();

  let result : any;
  let operations: any = [];

  operations.push({
      update: {
        table: "stanzaStyling" as const,
        id: studyId + "_" + stanzaId,
        fields: { studyId: studyId, stanzaId: stanzaId, expanded: newState },
        upsert: true,
      }
  })

  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update styling strophe expanded state.' };
  }
}

export async function updateLineBreak(studyId: string, hebIdsToAddBreak: number[], hebIdsToRemoveBreak: number[]) {
  "use server";

  const xataClient = getXataClient();

  let result : any;
  let operations: any = [];

  hebIdsToAddBreak.forEach((hebId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, lineBreak: true },
        upsert: true,
      }
    })
  })

  hebIdsToRemoveBreak.forEach((hebId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, lineBreak: false },
        upsert: true,
      }
    })
  })

  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update line break in styling.' };
  }
}

export async function updateStropheDiv(studyId: string, hebIdsToAddDiv: number[], hebIdsToRemoveDiv: number[], strophesToUpdate: StropheData[]) {
  "use server";

  const xataClient = getXataClient();

  let result : any;
  let operations: any = [];

  hebIdsToAddDiv.forEach((hebId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, stropheDiv: true },
        upsert: true,
      }
    })
  })

  hebIdsToRemoveDiv.forEach((hebId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, stropheDiv: false },
        upsert: true,
      }
    })
  })

  if (strophesToUpdate.length > 0) {
    try {
      const stropheRecords = await xataClient.db.stropheStyling.select(["id"]).filter({"studyId.id": studyId}).getMany();
      stropheRecords.forEach((stropheRecord) => {
        operations.push({
          delete: {
            table: "stropheStyling" as const,
            id: stropheRecord.id,
          }    
        })
      });
    } catch (error) {
      console.log(error);
    } 
  }

  strophesToUpdate.forEach((strophe) => {
    operations.push({
      update: {
        table: "stropheStyling" as const,
        id: studyId + "_" + strophe.id,
        fields: { studyId: studyId, stropheId: strophe.id, colorFill: strophe.colorFill, borderColor: strophe.borderColor, expanded: strophe.expanded },
        upsert: true,
      }
    })
  })

  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update strophe division in styling.' };
  }
}

export async function updateStanzaDiv(studyId: string, hebIdsToAddBreak: number[], hebIdsToRemoveDiv: number[], stanzasToUpDate: StanzaData[]) {
  "use server"

  const xataClient = getXataClient();

  let result: any;
  let operations: any =[];

  hebIdsToAddBreak.forEach((hebId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, stanzaDiv: true },
        upsert: true,
      }
    });
  })

  hebIdsToRemoveDiv.forEach((hebId) =>{
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, stanzaDiv: false },
        upsert: true,
      }
    });
  })

  if (stanzasToUpDate.length > 0) {
    try {
      const stanzaRecords = await xataClient.db.stanzaStyling.select(["id"]).filter({"studyId.id": studyId}).getMany();
      stanzaRecords.forEach((stanzaRecord) => {
        operations.push({
          delete: {
            table: "stanzaStyling" as const,
            id: stanzaRecord.id,
          }
        })
      });
    } catch (error) {
      console.log(error);
    }
  }

  stanzasToUpDate.forEach((stanza) => {
    operations.push({
      update: {
        table: "stanzaStyling" as const,
        id: studyId + "_" + stanza.id,
        fields: { studyId, stanzaId: stanza.id, expanded: stanza.expanded },
        upsert: true,
      }
    });
  })

  try {
    result = await xataClient.transactions.run(operations);
  } catch (error) {
    return { message: 'Database Error: Failed to update stanza division in styling.' };
  }

}

export async function deleteStudy(studyId: string) {

  const xataClient = getXataClient();
  try {
    await xataClient.db.study.deleteOrThrow({ id: studyId });
  } catch (error) {
    return { message: 'Database Error: Failed to delete study.' };
  }
  revalidatePath('/');   
}

export async function createStudy(passage: string) {

  const user = await currentUser();

  if (user)
  {
    var record : StudyRecord;
    const xataClient = getXataClient();
    try {
      record = await xataClient.db.study.create({ name: "Untitled Study", passage: passage, owner: user.id });
    } catch (error) {
      return { message: 'Database Error: Failed to Create Study.' };
    }
    if (record)
      redirect('/study/' + record.id.replace("rec_", "") + '/edit');
  }
}

export async function fetchPassageContent(studyId: string) {
  
  const xataClient = getXataClient();

  try {
    // fetch a study by id from xata
    const study = await xataClient.db.study.filter({ id: studyId}).getFirst();

    let passageData = { studyId: studyId, stanzas: [] } as PassageData;

    if (study)
    {
      const passageInfo = parsePassageInfo(study.passage);

      // fetch all words from xata by start/end chapter and verse
      if (passageInfo instanceof Error === false)
      {
        const wordStyling = await xataClient.db.styling
          .filter({studyId: study.id})
          .select(['hebId', 'colorFill', 'borderColor', 'textColor', 'numIndent', 'lineBreak', 'stropheDiv', 'stanzaDiv'])
          .sort("hebId", "asc")
          .getAll();
        const wordStylingMap = new Map();
        wordStyling.forEach((obj) => {
          wordStylingMap.set(obj.hebId, { colorFill: obj.colorFill, borderColor: obj.borderColor, textColor: obj.textColor, numIndent: obj.numIndent, lineBreak: obj.lineBreak, stropheDiv: obj.stropheDiv, stanzaDiv: obj.stanzaDiv });
        });
        
        const stanzaStyling = await xataClient.db.stanzaStyling
          .filter({studyId: study.id})
          .select(['stanzaId', 'expanded'])
          .sort("stanzaId", "asc")
          .getAll();
        const stanzaStylingMap = new Map();
        stanzaStyling.forEach((obj) => {
          stanzaStylingMap.set(obj.stanzaId, { expanded: obj.expanded })
        })

        const stropheStyling = await xataClient.db.stropheStyling
          .filter({studyId: study.id})
          .select(['stropheId', 'expanded', 'borderColor', 'colorFill'])
          .sort("stropheId", "asc")
          .getAll();
        const stropheStylingMap = new Map();
        stropheStyling.forEach((obj) => {
          stropheStylingMap.set(obj.stropheId, { borderColor: obj.borderColor, colorFill: obj.colorFill, expanded: obj.expanded });
        });

        const passageContent = await xataClient.db.heb_bible
          .filter("chapter", ge(passageInfo.startChapter))
          .filter("chapter", le(passageInfo.endChapter))
          .filter("verse", ge(passageInfo.startVerse))
          .filter("verse", le(passageInfo.endVerse))
          .sort("hebId", "asc")
          .getAll();

        let currentStanzaIdx = -1;
        let currentStropheIdx = -1;
        let runningStropheIdx = -1;
        let currentLineIdx = -1;
        let prevVerseNum = 0;

        passageContent.forEach(word => {
          let hebWord = {} as HebWord;
          hebWord.id = word.hebId || 0;
          hebWord.chapter = word.chapter || 0;
          hebWord.verse = word.verse || 0;
          hebWord.strongNumber = word.strongNumber || 0;
          hebWord.wlcWord = word.wlcWord || "";
          hebWord.gloss = word.gloss?.trim() || "";
          hebWord.ETCBCgloss = word.ETCBCgloss || "";
          hebWord.showVerseNum = false;
          hebWord.numIndent = 0;
          hebWord.lineBreak = (word.paragraphMarker || word.poetryMarker || word.verseBreak) || false;
          hebWord.lastLineInStrophe = false;
          hebWord.firstWordInStrophe = false;

          const currentWordStyling = wordStylingMap.get(hebWord.id);
          if (currentWordStyling !== undefined) {
            (currentWordStyling.colorFill !== null) && (hebWord.colorFill = currentWordStyling.colorFill);
            (currentWordStyling.borderColor !== null) && (hebWord.borderColor = currentWordStyling.borderColor);
            (currentWordStyling.textColor !== null) && (hebWord.textColor = currentWordStyling.textColor);
            (currentWordStyling.numIndent !== null) && (hebWord.numIndent = currentWordStyling.numIndent);
            (currentWordStyling.lineBreak !== null) && (hebWord.lineBreak = currentWordStyling.lineBreak);
            (currentWordStyling.stropheDiv !== null) && (hebWord.stropheDiv = currentWordStyling.stropheDiv);
            (currentWordStyling.stanzaDiv !== null) && (hebWord.stanzaDiv = currentWordStyling.stanzaDiv);
          }

          let currentStanzaData = passageData.stanzas[currentStanzaIdx];
          if (currentStanzaData === undefined || (hebWord.stanzaDiv !== undefined && hebWord.stanzaDiv)) {
            passageData.stanzas.push({id: ++currentStanzaIdx, strophes:[]});
            currentStanzaData = passageData.stanzas[currentStanzaIdx];
            const currentStanzaStyling = stanzaStylingMap.get(currentStanzaIdx);
            if (currentStanzaStyling !== undefined) {
              (currentStanzaStyling.expanded !== null) && (currentStanzaData.expanded = currentStanzaStyling.expanded);
            }
            currentStropheIdx = -1;

          } 

          let currentStropheData = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx];
          if (currentStropheData === undefined || (hebWord.stropheDiv !== undefined && hebWord.stropheDiv)) {
            if (currentStropheIdx !== -1) {
              let lastLineIdxInLastStrophe = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines.length-1;
              passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
                word.lastLineInStrophe = true;
              })
            }
            passageData.stanzas[currentStanzaIdx].strophes.push({id: ++runningStropheIdx, lines: []});
            ++currentStropheIdx;
            currentStropheData = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx];
            const currentStropheStyling = stropheStylingMap.get(runningStropheIdx);
            if (currentStropheStyling !== undefined) {
              (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
              (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
              (currentStropheStyling.expanded !== null) && (currentStropheData.expanded = currentStropheStyling.expanded);
            }
            currentLineIdx = -1;
            hebWord.firstWordInStrophe = true;
          } 

          let currentLineData = currentStropheData.lines[currentLineIdx];
          if (currentLineData === undefined || hebWord.lineBreak) {
            currentStropheData.lines.push({id: ++currentLineIdx, words: []})
            currentLineData = currentStropheData.lines[currentLineIdx];
          }

          if (prevVerseNum !== hebWord.verse) {
            hebWord.showVerseNum = true;
          }
          hebWord.lineId = currentLineIdx;
          hebWord.stropheId = runningStropheIdx;
          hebWord.stanzaId = currentStanzaIdx;

          currentLineData.words.push(hebWord);
          prevVerseNum = hebWord.verse;
        })
        let lastLineIdxInLastStrophe = passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines.length-1;
        passageData.stanzas[currentStanzaIdx].strophes[currentStropheIdx].lines[lastLineIdxInLastStrophe].words.forEach(word => {
          word.lastLineInStrophe = true;
        })
      }
    }
    return passageData;
  }
  catch (error) {
    console.error('Database Error', error);
    throw new Error('Failed to fetch passage content by study id');
  }
}

export async function fetchESVTranslation(chapter: number, verse: number) {

  const ESV_API_KEY = process.env.ESV_API_KEY;

  const esvApiEndpoint = new URL('https://api.esv.org/v3/passage/text/?');
  esvApiEndpoint.searchParams.append('q', 'Psalm+' + chapter + ':' + verse);
  esvApiEndpoint.searchParams.append('include-headings', 'false');
  esvApiEndpoint.searchParams.append('include-footnotes', 'false');
  esvApiEndpoint.searchParams.append('include-verse-numbers', 'false');
  esvApiEndpoint.searchParams.append('include-short-copyright', 'true');
  esvApiEndpoint.searchParams.append('include-passage-references', 'false');

  try {
    const response = await fetch(esvApiEndpoint, {
      headers: {
        'Authorization': 'Token ' + ESV_API_KEY
      },
    })
  
    const data = await response.json();
    return Object.hasOwn(data, 'passages') ? data.passages[0] : "";
  } catch (error) {
    throw new Error('Failed to fetch passage text from ESV API endpoint (error ' + error);
  }
};