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
    lineBreak?: boolean;
    showVerseNum: boolean;
    // p_index?: number;
    // w_index?: number;
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
    id: number; // line id
    words: HebWord[];
}

export type StropheData = {
    id: number; // strophe id
    colorFill?: string;
    borderColor?: string;    
    lines: LineData[];
}

export type PassageData = {
    studyId: string; // study id
    strophes: StropheData[];
}