'use server';

//const util = require('util')

import { z } from 'zod';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { getXataClient, StudyRecord, HebBibleRecord } from '@/xata';
import { ge, le } from "@xata.io/client";
import { currentUser } from '@clerk/nextjs';

import { parsePassageInfo } from './utils';
import { StudyData, PassageData, HebWord } from './data';
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

  console.log("Updating study id: " + id + " with new name (" + studyName + ")");

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

export async function updateColor(studyId: string, selectedWords: number[], actionType: ColorActionType, newColor: string | null) {
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
    return { message: 'Database Error: Failed to update color for study:' + studyId + ', result: ' + result };
  }

  redirect('/study/' + studyId.replace("rec_", "") + '/edit');
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
     
      let passageData = { chapters: [] } as PassageData;

      if (study)
      {
          const passageInfo = parsePassageInfo(study.passage);
          // fetch all words from xata by start/end chapter and verse
          if (passageInfo instanceof Error === false)
          {
              const colorStyling = await xataClient.db.styling
                .filter({studyId: study.id})
                .select(['hebId', 'colorFill', 'borderColor', 'textColor'])
                .sort("hebId", "asc")
                .getMany();
              
              const colorStylingMap = new Map();
              colorStyling.forEach((obj) => {
                colorStylingMap.set(obj.hebId, { colorFill: obj.colorFill, borderColor: obj.borderColor, textColor: obj.textColor });
              });

              const passageContent = await xataClient.db.heb_bible
                  .filter("chapter", ge(passageInfo.startChapter))
                  .filter("chapter", le(passageInfo.endChapter))
                  .filter("verse", ge(passageInfo.startVerse))
                  .filter("verse", le(passageInfo.endVerse))
                  .sort("hebId", "asc")
              //    .select(["hebId", "chapter", "verse", "hebUnicode", "strongNumber", "gloss"])
                  .getAll();
          
              let currentChapterIdx = -1;
              let currentVerseIdx = -1;
              let currentParagraphIdx = -1;

              passageContent.forEach(word => {

                  let hebWord = {} as HebWord;
                  hebWord.id = word.hebId || 0;
                  hebWord.chapter = word.chapter || 0;
                  hebWord.verse = word.verse || 0;
                  hebWord.strongNumber = word.strongNumber || 0;
                  hebWord.wlcWord = word.wlcWord || "";
                  hebWord.gloss = word.gloss || "";

                  let currentChapterData = passageData.chapters[currentChapterIdx];
                  if (currentChapterData === undefined || currentChapterData.id != hebWord.chapter) {
                      passageData.chapters.push({id: hebWord.chapter, numOfVerses: 0, verses: []});
                      currentChapterData = passageData.chapters[++currentChapterIdx];
                      currentVerseIdx = -1;
                  }
              
                  currentChapterData.numOfVerses = hebWord.verse;
              
                  let currentVerseData = currentChapterData.verses[currentVerseIdx];
                  if (currentVerseData === undefined || currentVerseData.id != hebWord.verse) {
                      currentChapterData.verses.push({id: hebWord.verse, paragraphs: []});
                      currentParagraphIdx = -1;
                      currentVerseData = currentChapterData.verses[++currentVerseIdx];
                  }

                  let currentParagraphData = currentVerseData.paragraphs[currentParagraphIdx];
                  if (currentParagraphData === undefined || word.paragraphMarker || word.poetryMarker) {
                      currentVerseData.paragraphs.push({words: []});
                      currentParagraphData = currentVerseData.paragraphs[++currentParagraphIdx];
                  }

                  const currentColorStyling = colorStylingMap.get(hebWord.id);

                  if (currentColorStyling !== undefined) {
                    (currentColorStyling.colorFill !== null) && (hebWord.colorFill = currentColorStyling.colorFill);
                    (currentColorStyling.borderColor !== null) && (hebWord.borderColor = currentColorStyling.borderColor);
                    (currentColorStyling.textColor !== null) && (hebWord.textColor = currentColorStyling.textColor);
                  }

                  currentParagraphData.words.push(hebWord);
              })
          }
      }
      return passageData;

  } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to fetch passage content by study id.');        
  }
}