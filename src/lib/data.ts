export interface StudyData {
    id: string;
    name: string;
    owner: string;
    passage: string;
    public: boolean;
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
    numIndent: number;
    stropheDiv?: boolean;
    showVerseNum: boolean;
    p_index?: number;
    w_index?: number;
}


// export type ChapterData = {
//     id: number;
//     numOfVerses: number;
//     verses: VerseData[];
// }

// export type ParagraphData = {
//     words: HebWord[];
// }

// export type VerseData = {
//     id: number;
//     paragraphs: ParagraphData[];
//     esv: string;
// }


export type LineData = {
    id: number;
    words: HebWord[];
    esv: string;
}

export type StropheData = {
    id: number;
    lines: LineData[];
}

export type PassageData = {
    strophes: StropheData[];
    startChapter: number;
    startVerse: number;
    endChapter: number;
    endVerse: number;
}