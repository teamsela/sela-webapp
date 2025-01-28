'use client';

import { useState, createContext } from "react";

import Header from "./Header";
import Toolbar from "./Toolbar";
import Passage from "./Passage";
import InfoPane from "./InfoPane";
import { ColorType, ColorActionType, InfoPaneActionType, StructureUpdateType } from "@/lib/types";
import { StudyData, PassageData, PassageStaticData, PassageProps, StropheProps, WordProps, HebWord, StropheData, StudyMetadata, StanzaMetadata, StropheMetadata, WordMetadata } from '@/lib/data';

export const DEFAULT_SCALE_VALUE: number = 1;
export const DEFAULT_COLOR_FILL = "#FFFFFF";
export const DEFAULT_BORDER_COLOR = "#D9D9D9";
export const DEFAULT_TEXT_COLOR = "#656565";

export const FormatContext = createContext({
  ctxStudyId: "",
  ctxStudyMetadata: {} as StudyMetadata,
  ctxSetStudyMetadata: (arg: StudyMetadata) => {},
  ctxScaleValue: DEFAULT_SCALE_VALUE,
  ctxIsHebrew: false,
  ctxSelectedWords: [] as WordProps[],
  ctxSetSelectedWords: (arg: WordProps[]) => {},
  ctxNumSelectedWords: 0 as number,
  ctxSetNumSelectedWords: (arg: number) => {},
  ctxSelectedStrophes: [] as StropheProps[],  
  ctxSetSelectedStrophes: (arg: StropheProps[]) => {},
  ctxNumSelectedStrophes: 0 as number,
  ctxSetNumSelectedStrophes: (arg: number) => {},
  ctxStropheCount: 0 as number,
  ctxSetStropheCount: (arg: number) => {},
  ctxStanzaCount: -1 as number,
  ctxSetStanzaCount: (arg: number) => {},
  ctxColorAction: {} as ColorActionType,
  ctxSelectedColor: "" as string,
  ctxSetSelectedColor: (arg: string) => {},
  ctxColorFill: "" as string,
  ctxSetColorFill: (arg: string) => {},
  ctxBorderColor: "" as string,
  ctxSetBorderColor: (arg: string) => {},
  ctxTextColor: "" as string,
  ctxSetTextColor: (arg: string) => {},
  ctxUniformWidth: false,
  ctxIndentNum: {} as number,
  ctxSetIndentNum: (arg: number) => {},
  ctxInViewMode: false,
  ctxStructureUpdateType: {} as StructureUpdateType,
  ctxSetStructureUpdateType: (arg: StructureUpdateType) => {},
  ctxRootsColorMap : {} as Map<number, ColorType>,
  ctxSetRootsColorMap : (arg: Map<number, ColorType>) =>{},
});

const StudyPane = ({
  passageData, content, inViewMode
}: {
  passageData: PassageStaticData, // heb word data
  content: PassageData; // to be deprecated
  inViewMode: boolean;
}) => {

  const [studyMetadata, setStudyMetadata] = useState<StudyMetadata>(passageData.study.metadata);
  const [scaleValue, setScaleValue] = useState(DEFAULT_SCALE_VALUE);
  const [isHebrew, setHebrew] = useState(false);

  
  const [numSelectedWords, setNumSelectedWords] = useState(0);
  const [selectedWords, setSelectedWords] = useState<WordProps[]>([]);
  const [selectedStrophes, setSelectedStrophes] = useState<StropheProps[]>([]);
  const [numSelectedStrophes, setNumSelectedStrophes] = useState(0);
  const [stropheCount, setStropheCount] = useState(0);

  const [stanzaCount, setStanzaCount] = useState(-1);

  const [colorAction, setColorAction] = useState(ColorActionType.none);
  const [selectedColor, setSelectedColor] = useState("");

  const [colorFill, setColorFill] = useState(DEFAULT_COLOR_FILL);
  const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [uniformWidth, setUniformWidth] = useState(false);
  const [indentNum, setIndentNum] = useState(0);

  const [infoPaneAction, setInfoPaneAction] = useState(InfoPaneActionType.none);
  const [structureUpdateType, setStructureUpdateType] = useState(StructureUpdateType.none);
  const [rootsColorMap, setRootsColorMap] = useState<Map<number, ColorType>>(new Map());
  
  const formatContextValue = {
    ctxStudyId: passageData.study.id,
    ctxStudyMetadata: studyMetadata,
    ctxSetStudyMetadata: setStudyMetadata,
    ctxScaleValue: scaleValue,
    ctxIsHebrew: isHebrew,
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords: setSelectedWords,
    ctxNumSelectedWords: numSelectedWords,
    ctxSetNumSelectedWords: setNumSelectedWords,
    ctxSelectedStrophes: selectedStrophes,
    ctxSetSelectedStrophes: setSelectedStrophes,
    ctxNumSelectedStrophes: numSelectedStrophes,
    ctxSetNumSelectedStrophes: setNumSelectedStrophes,
    ctxStanzaCount: stanzaCount,
    ctxSetStanzaCount: setStanzaCount,
    ctxColorAction: colorAction,
    ctxSelectedColor: selectedColor,
    ctxSetSelectedColor: setSelectedColor,
    ctxColorFill: colorFill,
    ctxSetColorFill: setColorFill,
    ctxBorderColor: borderColor,
    ctxSetBorderColor: setBorderColor,
    ctxTextColor: textColor,
    ctxSetTextColor: setTextColor,
    ctxUniformWidth: uniformWidth,
    ctxIndentNum: indentNum,
    ctxSetIndentNum: setIndentNum,
    ctxInViewMode: inViewMode,
    ctxStructureUpdateType: structureUpdateType,
    ctxSetStructureUpdateType: setStructureUpdateType,
    ctxStropheCount: stropheCount,
    ctxSetStropheCount: setStropheCount,
    ctxRootsColorMap: rootsColorMap,
    ctxSetRootsColorMap: setRootsColorMap,
  }

  const passageDivStyle = {
    className: `flex overflow-y-auto h-full w-full ${isHebrew ? "hbFont" : ""}`
  };
  const studyPaneWrapperStyle = {
    className: `grid gap-x-2 ${infoPaneAction !== InfoPaneActionType.none ? 'grid-cols-[3fr_1fr]' : ''} relative h-full`
  }
  
  
  if (!passageData.study.metadata.words) {

    // convert content to StudyMetadata
    let studyMetadata1 : StudyMetadata = { stanzas: {}, strophes: {}, words: {} };

    content.stanzas.forEach((stanza) => {

      const stanzaMetadata : StanzaMetadata = (stanza.expanded === false) ? { expanded: false } : {};

      stanzaMetadata.start = stanza.strophes[0].lines[0].words[0].id;
      let prevStanzaBreakId : number = 0;

      stanza.strophes.forEach((strophe) => {

        let stropheMetadata : StropheMetadata = (strophe.expanded) ? {} : {expanded: false};
        if (strophe.borderColor) {
          stropheMetadata.color = { border: strophe.borderColor }
        }
        if (strophe.colorFill) {
          if (stropheMetadata.color) {
            stropheMetadata.color.fill = strophe.colorFill;
          } else {
            stropheMetadata.color = { fill: strophe.colorFill }
          }
        }
      
        stropheMetadata.start = strophe.lines[0].words[0].id;
        let prevStropheBreakId : number = 0;

        strophe.lines.forEach((line) => {

          line.words.forEach((word) => {

            let wordMetadata : WordMetadata = {};
            if (word.borderColor) {
              wordMetadata.color = { border: word.borderColor }
            }
            if (word.colorFill) {
              if (wordMetadata.color) {
                wordMetadata.color.fill = word.colorFill;
              } else {
                wordMetadata.color = { fill: word.colorFill }
              }
            }
            if (word.textColor) {
              if (wordMetadata.color) {
                wordMetadata.color.text = word.textColor;
              } else {
                wordMetadata.color = { text: word.textColor }
              }
            }          
            if (word.numIndent > 0) {
              wordMetadata.indent = word.numIndent;
            }
            // if (word.lineBreak) {
            //   wordMetadata.lineBreak = word.lineBreak;
            // }
            if (word.stropheDiv) {
              wordMetadata.stropheDiv = word.stropheDiv;
              prevStropheBreakId = word.id - 1;
            }
            if (word.stanzaDiv) {
              wordMetadata.stanzaDiv = word.stanzaDiv;
              prevStanzaBreakId = word.id - 1;
            }

            if (Object.keys(wordMetadata).length !== 0) {
              //if (studyMeta1.words) {
                //studyMetadata1.words?.push({id: word.id, metadata: wordMetadata});
              //}
              if (!studyMetadata1.words) {
                studyMetadata1.words = {};
              }
              //else {
                //studyMetadata1.words = [ {id: word.id, metadata: wordMetadata} ];
              //}  
              studyMetadata1.words[word.id] = wordMetadata;
            }

          })
        })

        if (!studyMetadata1.strophes) {
          studyMetadata1.strophes = {};
          //studyMetadata1.strophes?.push({id: strophe.id, metadata: stropheMetadata});
        }
        //else {
        //  studyMetadata1.strophes = [ {id: strophe.id, metadata: stropheMetadata} ];
       // }
        studyMetadata1.strophes[strophe.id] = stropheMetadata;

      })

      if (!studyMetadata1.stanzas) {
        studyMetadata1.stanzas = {};
        //studyMetadata1.stanzas?.push({id: stanza.id, metadata: stanzaMetadata});
      }
      // else {
      //   studyMetadata1.stanzas = [ {id: stanza.id, metadata: stanzaMetadata} ];
      // }
      studyMetadata1.stanzas[stanza.id] = stanzaMetadata;

    });

    passageData.study.metadata = studyMetadata1;
    setStudyMetadata(studyMetadata1)
    const jsonOutput = JSON.stringify(studyMetadata1);
  }
  else {
    //console.log(passageData.study.metadata);
  }



  return (
    <>
      <FormatContext.Provider value={formatContextValue}>
        <Header
          study={passageData.study}
          setLangToHebrew={setHebrew}
          setInfoPaneAction={setInfoPaneAction}
          infoPaneAction={infoPaneAction}
        />
  
        <main {...studyPaneWrapperStyle}>
          <div {...passageDivStyle}>
            <Toolbar
              setScaleValue={setScaleValue}
              //color functions
              setColorAction={setColorAction}
              setSelectedColor={setSelectedColor}
              setUniformWidth={setUniformWidth}
            />
  
            <Passage content={content} bibleData={passageData.bibleData}/>
          </div>
  
          {
            infoPaneAction !== InfoPaneActionType.none && (
              <div className="top-19 right-0 w-1/4 h-full z-30 bg-white border-l border-gray-300">
                <InfoPane
                  infoPaneAction={infoPaneAction}
                  setInfoPaneAction={setInfoPaneAction}
                  content={content}
                />
              </div>
            )
          }
        </main>
      </FormatContext.Provider>
    </>
  );

};

export default StudyPane;

