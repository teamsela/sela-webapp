'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getXataClient, StudyRecord, HebBibleRecord } from '@/xata';
import { ge, le } from "@xata.io/client";
import { parsePassageInfo } from './utils';

export interface StudyData {
    name: string;
    owner: string;
    passage: string;
}

export type HebWord = {
    id: number;
    chapter: number;
    verse: number;
    strongNumber: number;
    wlcWord: string;
    gloss: string;
}

export type ChapterData = {
    id: number;
    numOfVerses: number;
    verses: VerseData[];
}

export type ParagraphData = {
    words: HebWord[];
}

export type VerseData = {
    id: number;
    paragraphs: ParagraphData[];
}

export type PassageData = {
    chapters: ChapterData[];
}

export async function fetchStudyById(studyId: string) {

    // Add noStore() here to prevent the response from being cached.
    // This is equivalent to in fetch(..., {cache: 'no-store'}).
    //noStore();

    const xataClient = getXataClient();

    try {
        // fetch a study by id from xata
        const study = await xataClient.db.study.filter({ id: studyId }).getFirst();

        let result : StudyData = {
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
                const passageContent = await xataClient.db.heb_bible
                    .filter("chapter", ge(passageInfo.startChapter))
                    .filter("chapter", le(passageInfo.endChapter))
                    .filter("verse", ge(passageInfo.startVerse))
                    .filter("verse", le(passageInfo.endVerse))
                    .sort("hebId", "asc")
                //    .select(["hebId", "chapter", "verse", "hebUnicode", "strongNumber", "gloss"])
                    .getAll();
            
                //console.log(passageContent.toArray());

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

                    currentParagraphData.words.push(hebWord);
                })
            }
        }
        return passageData;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch study record.');        
    }
}