import { BoxDisplayStyle } from "@/lib/types"

export type ColorData = {
    fill?: string,
    border?: string,
    text?: string
}

export type WordMetadata = {
    indent?: number,
    lineBreak?: boolean,
    ignoreNewLine?: boolean, // ignore the new line in default Bible data
    stanzaDiv?: boolean,
    stanzaMd?: StanzaMetadata;
    stropheDiv?: boolean,
    stropheMd?: StropheMetadata;
    color?: ColorData
}

export type WordMap = {
    [id: number]: WordMetadata
}

export type StropheMetadata = {
    expanded?: boolean;
    color?: ColorData
}

export type StropheMap = {
    [id: number]: StropheMetadata
}

export type StanzaMetadata = {
    expanded?: boolean;
}

export type StanzaMap = {
    [id: number]: StanzaMetadata
}

export type StudyMetadata = {
    words: WordMap;
    scaleValue?: number;
    boxStyle?: BoxDisplayStyle;
}

export interface StudyProps {
    studyId: string;
    name: string;
    owner: string | undefined;
    passage: string;
    public: boolean;
    starred?: boolean;
    lastUpdated?: string;
    metadata: StudyMetadata;
}

export type LexiconData = {
    strongCode: string;
    lemma: string;
    gloss: string;
}

export type MotifData = {
    relatedWords: LexiconData | undefined;
    relatedStrongNums: number[] | undefined;
    categories: string[];
}

export interface WordProps {
    wordId: number;
    stanzaId: number;
    stropheId: number;
    lineId: number;
    chapter: number;
    verse: number;
    strongNumber: number;
    wlcWord: string;
    gloss: string;
    ETCBCgloss: string | undefined;
    metadata: WordMetadata;
    newLine: boolean;
    showVerseNum: boolean;
    firstWordInStrophe: boolean;
    firstStropheInStanza: boolean;
    lastStropheInStanza: boolean;
    motifData: MotifData;
}

export interface LineProps {
    lineId: number; // line id
    words: WordProps[];    
}

export interface StropheProps {
    stropheId: number; // strophe id
    stanzaId?: number; // located in which stanza
    metadata: StropheMetadata;
    lines: LineProps[];
    firstStropheInStanza?: boolean;
    lastStropheInStanza?: boolean;    
}

export interface StanzaProps {
    stanzaId: number; // stanza id
    metadata: StanzaMetadata;
    strophes: StropheProps[]
}

export type PassageProps = {
    stanzaProps: StanzaProps[];
    stanzaCount: number;
    stropheCount: number;
}

export interface StudyData {
    id: string;
    name: string;
    owner: string | undefined;
    passage: string;
    public: boolean;
    starred?: boolean;
    model?: boolean;
    lastUpdated?: string;
    createdAt?: string;
    metadata: StudyMetadata;
}

export type PassageStaticData = {
    study: StudyData;
    bibleData: WordProps[];
}

// TO BE DEPRECATED - START
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
    lineId: number | undefined;
    showVerseNum: boolean;
    lineBreak?: boolean;
    stropheId: number | undefined;
    stropheDiv?: boolean;
    lastLineInStrophe: boolean;
    firstWordInStrophe: boolean;
    stanzaId: number | undefined;
    stanzaDiv?: boolean;
    firstStropheInStanza: boolean;
    lastStropheInStanza: boolean;
    lemma: string | undefined;
    relatedWords: LexiconData | undefined;
    relatedStrongNums: number[] | undefined;
    categories: string[];
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
// TO BE DEPRECATED - END

export type FetchStudiesResult = {
    records: StudyData[];
    totalPages: number;
}