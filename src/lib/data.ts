export interface StudyData {
    id: string;
    name: string;
    owner: string | undefined;
    passage: string;
    public: boolean;
    starred?: boolean;
    lastUpdated?: string;
}

export type HebWord = {
    id: number;
    chapter: number;
    verse: number;
    strongNumber: number;
    wlcWord: string;
    gloss: string;
    ETCBCgloss: string | undefined;
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
    firstStropheInStanza: boolean;
    lastStropheInStanza: boolean;
    stanzaId: number | undefined;
    stanzaDiv?: boolean;
    relatedWords: LexiconData | undefined;
    categories: string[];
}

export type LexiconData = {
    strongCode: string;
    lemma: string;
    gloss: string;
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
    firstStropheInStanza?: boolean;
    lastStropheInStanza?: boolean;    
}

export type StanzaData = {
    id: number; // stanza id
    expanded?: boolean;
    strophes: StropheData[]
}

export type PassageData = {
    studyId: string; // study id
    stanzas: StanzaData[];
}

export type FetchStudiesResult = {
    records: StudyData[];
    totalPages: number;
}