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
    lineId: number | undefined;
    stropheId: number | undefined;
    lastLineInStrophe: boolean;
    firstWordInStrophe: boolean;
    stanzaId: number | undefined;
    stanzaDiv?: boolean;
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

export type StanzaData = {
    id: number; // stanza id
    colorFill?: string;
    borderColor?: string;
    expanded?: boolean;
    strophes: StropheData[]
}

export type PassageData = {
    studyId: string; //study id
    stanzas: StanzaData[];
}