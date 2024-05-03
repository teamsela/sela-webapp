export interface StudyData {
    id: string;
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
    colorFill: string;
    borderColor: string;
    textColor: string;
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

