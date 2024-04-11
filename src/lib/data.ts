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

export interface HebWord {
    id: number;
    chapter: number;
    verse: number;
    strongNumber: number;
    wlcWord: string;
    gloss: string;
}

export type ChapterData = {
    chapter: number;
    numOfVerses: number;
    verseMap: Map<number, HebWord[]>;
}

export type VerseData = {
    verse: number;
    words: HebWord[];
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

        let words: HebWord[] = [];
        

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

                passageContent.forEach(word => {
                    let hebWord = {} as HebWord;
                    hebWord.id = word.hebId || 0;
                    hebWord.chapter = word.chapter || 0;
                    hebWord.verse = word.verse || 0;
                    hebWord.strongNumber = word.strongNumber || 0;
                    hebWord.wlcWord = word.wlcWord || "";
                    hebWord.gloss = word.gloss || "";
                    words.push(hebWord);
                })
            }
        }
        return words;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch study record.');        
    }
}