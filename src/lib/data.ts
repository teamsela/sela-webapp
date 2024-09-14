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
    stropheId: number | undefined;
    firstWordInStrophe: boolean;
}

export type LineData = {
    id: number; // line id
    words: HebWord[];
}

export type StropheData = {
    id: number; // strophe id
    colorFill?: string;
    borderColor?: string;
    expanded?: boolean;
    lines: LineData[];
}

export type PassageData = {
    studyId: string; // study id
    strophes: StropheData[];
}