'use server';

import { z } from 'zod';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { getXataClient, StudyRecord, HebBibleRecord } from '@/xata';
import { ge, le } from "@xata.io/client";
import { currentUser } from '@clerk/nextjs';

import { parsePassageInfo, psalmBook } from './utils';
import { StudyData, PassageData, StropheData, HebWord } from './data';
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

export async function updateWordColor(studyId: string, selectedWords: number[], actionType: ColorActionType, newColor: string | null) {
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

  selectedWords.forEach((hebId) => {
    operations.push({
      update: {
        table: "styling" as const,
        id: studyId + "_" + hebId,
        fields: { studyId: studyId, hebId: hebId, ...fieldsToUpdate },
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

  redirect('/study/' + studyId.replace("rec_", "") + '/edit');
}

export async function updateStropheColor(studyId: string, selectedStrophes: StropheData[], actionType: ColorActionType, newColor: string | null) {
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

  selectedStrophes.forEach((strophe) => {
    operations.push({
      update: {
        table: "stropheStyling" as const,
        id: studyId + "_" + strophe.id,
        fields: { studyId: studyId, stropheId: strophe.id, ...fieldsToUpdate },
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

  redirect('/study/' + studyId.replace("rec_", "") + '/edit');
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

export async function updateStropheDiv(studyId: string, hebId: number, stropheDiv: boolean) {
  "use server";

  const xataClient = getXataClient();

  let result : any;

  try {
    result = await xataClient.transactions.run([
      {
        update: {
          table: "styling" as const,
          id: studyId + "_" + hebId,
          fields: { studyId: studyId, hebId: hebId, stropheDiv: stropheDiv },
          upsert: true,
        }
      }
    ]);
  } catch (error) {
    return { message: 'Database Error: Failed to update styling strophe division.' };
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
      const study = await xataClient.db.study.filter({ id: studyId }).getFirst();
     
      let passageData = { strophes: [], startChapter: 0, startVerse: 0, endChapter: 0, endVerse: 0 } as PassageData;

      if (study)
      {
          const passageInfo = parsePassageInfo(study.passage);

          // fetch all words from xata by start/end chapter and verse
          if (passageInfo instanceof Error === false)
          {
              passageData.startChapter = passageInfo.startChapter;
              passageData.startVerse = passageInfo.startVerse;
              passageData.endChapter = passageInfo.endChapter;
              passageData.endVerse = passageInfo.endVerse;

              const wordStyling = await xataClient.db.styling
                .filter({studyId: study.id})
                .select(['hebId', 'colorFill', 'borderColor', 'textColor', 'numIndent', 'stropheDiv'])
                .sort("hebId", "asc")
                .getAll();
              const wordStylingMap = new Map();
              wordStyling.forEach((obj) => {
                wordStylingMap.set(obj.hebId, { colorFill: obj.colorFill, borderColor: obj.borderColor, textColor: obj.textColor, numIndent: obj.numIndent, stropheDiv: obj.stropheDiv });
              });

              const stropheStyling = await xataClient.db.stropheStyling
                .filter({studyId: study.id})
                .select(['stropheId', 'colorFill', 'borderColor'])
                .sort("stropheId", "asc")
                .getAll();
              const stropheStylingMap = new Map();
              stropheStyling.forEach((obj) => {
                stropheStylingMap.set(obj.stropheId, { colorFill: obj.colorFill, borderColor: obj.borderColor });
              });

              const passageContent = await xataClient.db.heb_bible_bsb
                  .filter("chapter", ge(passageInfo.startChapter))
                  .filter("chapter", le(passageInfo.endChapter))
                  .filter("verse", ge(passageInfo.startVerse))
                  .filter("verse", le(passageInfo.endVerse))
                  .sort("hebId", "asc")
              //    .select(["hebId", "chapter", "verse", "hebUnicode", "strongNumber", "gloss"])
                  .getAll();
          
              let currentStropheIdx = -1;
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
                  hebWord.showVerseNum = false;
                  hebWord.numIndent = 0;

                  const currentWordStyling = wordStylingMap.get(hebWord.id);
                  if (currentWordStyling !== undefined) {
                    (currentWordStyling.colorFill !== null) && (hebWord.colorFill = currentWordStyling.colorFill);
                    (currentWordStyling.borderColor !== null) && (hebWord.borderColor = currentWordStyling.borderColor);
                    (currentWordStyling.textColor !== null) && (hebWord.textColor = currentWordStyling.textColor);
                    (currentWordStyling.numIndent !== null) && (hebWord.numIndent = currentWordStyling.numIndent);
                    (currentWordStyling.stropheDiv !== null) && (hebWord.stropheDiv = currentWordStyling.stropheDiv);
                  }

                  let currentStropheData = passageData.strophes[currentStropheIdx];
                  if (currentStropheData === undefined || (hebWord.stropheDiv !== undefined && hebWord.stropheDiv)) {
                      passageData.strophes.push({id: ++currentStropheIdx, lines: []});
                      currentStropheData = passageData.strophes[currentStropheIdx];
                      const currentStropheStyling = stropheStylingMap.get(currentStropheIdx);
                      if (currentStropheStyling !== undefined) {
                          (currentStropheStyling.colorFill !== null) && (currentStropheData.colorFill = currentStropheStyling.colorFill);
                          (currentStropheStyling.borderColor !== null) && (currentStropheData.borderColor = currentStropheStyling.borderColor);
                      }
                      currentLineIdx = -1;
                  }

                  let currentLineData = currentStropheData.lines[currentLineIdx];
                  if (currentLineData === undefined || word.paragraphMarker || word.poetryMarker || word.verseBreak) {
                      currentStropheData.lines.push({id: ++currentLineIdx, words: [], esv: ""})
                      currentLineData = currentStropheData.lines[currentLineIdx];
                  }

                  if (prevVerseNum !== hebWord.verse) {
                      hebWord.showVerseNum = true;
                  }
                  currentLineData.words.push(hebWord);
                  prevVerseNum = hebWord.verse;
              })
          }
      }
      return passageData;

  } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch passage content by study id.');        
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
    return data.passages[0];
  } catch (error) {
    console.log('Error fetching ESV passage text: ' + error);
    throw new Error('Failed to fetch ESV passage text from ESV API endpoint.');
  }
};