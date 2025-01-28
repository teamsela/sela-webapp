export type StanzaMetadata = {
    start?: number; // strophe id
    end?: number;   // strophe id
    expanded?: boolean;
}

export type Stanza = {
    id: number,
    metadata: StanzaMetadata
}

export type ColorData = {
    fill?: string,
    border?: string,
    text?: string
}

export type StropheMetadata = {
    start?: number; // heb id
    end?: number;   // heb id
    expanded?: boolean;
    color?: ColorData
}

export type Strophe = {
    id: number,
    metadata: StropheMetadata
}

export type WordMetadata = {
    indent?: number,
    lineBreak?: boolean,
    stropheDiv?: boolean,
    stanzaDiv?: boolean,
    color?: ColorData
}

export type Word = {
    id: number,
    metadata: WordMetadata
}

export type StudyMetadata = {
    stanzas?: Stanza[];
    strophes?: Strophe[];
    words?: WordMap;
    zoomLevel?: number;
    uniformWidth?: boolean;
}

export type WordMap = {
    [id: number]: WordMetadata
}

export type StudyMetadataNew = {
    stanzas?: Stanza[];
    strophes?: Strophe[];
    words?: WordMap;
    zoomLevel?: number;
    uniformWidth?: boolean;
}

export type LexiconData = {
    strongCode: string;
    lemma: string;
    gloss: string;
}

export type MotifData = {
    relatedWords: LexiconData | undefined;
    categories: string[];
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

export type PassageStaticData = {
    study: StudyData;
    bibleData: WordProps[];
}

export type PassageProps = {
//    study: StudyData;
    stanzaProps: StanzaProps[];
}

export interface StanzaProps {
    stanzaId: number; // stanza id
    metadata: StanzaMetadata;
    strophes: StropheProps[]
}

export interface StropheProps {
    stropheId: number; // strophe id
    stanzaId?: number; // located in stanza id
    metadata: StropheMetadata;
    lines: LineProps[];
    firstStropheInStanza?: boolean;
    lastStropheInStanza?: boolean;    
}

export interface LineProps {
    lineId: number; // line id
    words: WordProps[];    
}

export interface WordProps {
    wordId: number;
    stanzaId: number | undefined;
    stropheId: number | undefined;
    lineId: number | undefined;
    chapter: number;
    verse: number;
    strongNumber: number;
    wlcWord: string;
    gloss: string;
    ETCBCgloss: string | undefined;
    metadata: WordMetadata;
    newLine: boolean;
    showVerseNum: boolean;
    lastLineInStrophe: boolean;
    firstWordInStrophe: boolean;
    firstStropheInStanza: boolean;
    lastStropheInStanza: boolean;
    motifData: MotifData;
}

export interface StudyData {
    id: string;
    name: string;
    owner: string | undefined;
    passage: string;
    public: boolean;
    starred?: boolean;
    lastUpdated?: string;
    metadata: StudyMetadata;
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
    lemma: string | undefined;
    relatedWords: LexiconData | undefined;
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

export type FetchStudiesResult = {
    records: StudyData[];
    totalPages: number;
}