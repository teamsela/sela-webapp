'use client';

import { useState, createContext, useEffect, useRef, MutableRefObject, useCallback } from "react";

import Header from "./Header";
import Passage from "./Passage";
import CloneStudyModal from '../Modals/CloneStudy';
import InfoPane from "./InfoPane";
import { Footer } from "./Footer";

import { ColorData, ColorSource, PassageData, PassageStaticData, PassageProps, StropheProps, WordProps, StudyMetadata, StanzaMetadata, StropheMetadata, WordMetadata, LayerDef, WordMap } from '@/lib/data';
import { ColorActionType, InfoPaneActionType, StructureUpdateType, BoxDisplayStyle, BoxDisplayConfig, LanguageMode, NonEnglishDisplayMode } from "@/lib/types";
import { mergeData } from "@/lib/utils";
import { updateMetadataInDb } from '@/lib/actions';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, DEFAULT_LAYER_FILL, DEFAULT_LAYER_BORDER, DEFAULT_LAYER_TEXT } from "@/lib/colors";

export const DEFAULT_SCALE_VALUE: number = 1;
export { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR } from "@/lib/colors";

export const INITIAL_LAYER_DEF: LayerDef = {
  id: 0,
  name: "Default",
  fill: DEFAULT_LAYER_FILL,
  border: DEFAULT_LAYER_BORDER,
  text: DEFAULT_LAYER_TEXT,
};

export type HistoryEntry = {
  metadata: StudyMetadata;
  wordsColorMap: Map<number, ColorData>;
  activeHighlightIds: Record<ColorSource, string | null>;
  highlightCache: Map<string, Map<number, ColorData | undefined>>;
};

export type HistorySnapshotOptions = {
  wordsColorMap?: Map<number, ColorData>;
  activeHighlightIds?: Record<ColorSource, string | null>;
  highlightCache?: Map<string, Map<number, ColorData | undefined>>;
};

export const cloneWordsColorMap = (map: Map<number, ColorData> = new Map()) =>
  new Map<number, ColorData>(
    Array.from(map.entries()).map(([wordId, color]) => [wordId, color ? { ...color } : color]),
  );

export const cloneHighlightCache = (
  cache: Map<string, Map<number, ColorData | undefined>> = new Map(),
) => {
  const clonedCache = new Map<string, Map<number, ColorData | undefined>>();
  cache.forEach((wordMap, key) => {
    clonedCache.set(
      key,
      new Map<number, ColorData | undefined>(
        Array.from(wordMap.entries()).map(([wordId, color]) => [
          wordId,
          color ? { ...color } : color,
        ]),
      ),
    );
  });
  return clonedCache;
};

export const FormatContext = createContext({
  ctxStudyId: "",
  ctxStudyMetadata: {} as StudyMetadata,
  ctxSetStudyMetadata: (arg: StudyMetadata) => {},
  ctxStudyNotes: "",
  ctxSetStudyNotes: (args: string) => {},
  ctxStudyBook: "" as string,
  ctxPassageProps: {} as PassageProps,
  ctxSetPassageProps: (arg: PassageProps) => {},
  ctxScaleValue: DEFAULT_SCALE_VALUE,
  ctxIsHebrew: false,
  ctxSetIsHebrew: (arg: boolean) => {},
  ctxSelectedWords: [] as WordProps[],
  ctxSetSelectedWords: (arg: WordProps[]) => {},
  ctxNumSelectedWords: 0 as number,
  ctxSetNumSelectedWords: (arg: number) => {},
  ctxSelectedStrophes: [] as StropheProps[],
  ctxSetSelectedStrophes: (arg: StropheProps[]) => {},
  ctxNumSelectedStrophes: 0 as number,
  ctxSetNumSelectedStrophes: (arg: number) => {},
  ctxNumSelectedLayers: 0 as number,
  ctxSetNumSelectedLayers: (arg: number) => {},
  ctxColorAction: {} as ColorActionType,
  ctxSetColorAction: (_arg: ColorActionType) => {},
  ctxSelectedColor: "" as string,
  ctxSetSelectedColor: (arg: string) => {},
  ctxColorFill: "" as string,
  ctxSetColorFill: (arg: string) => {},
  ctxBorderColor: "" as string,
  ctxSetBorderColor: (arg: string) => {},
  ctxTextColor: "" as string,
  ctxSetTextColor: (arg: string) => {},
  ctxBoxDisplayConfig: {} as BoxDisplayConfig,
  ctxIndentNum: {} as number,
  ctxSetIndentNum: (arg: number) => {},
  ctxInViewMode: false,
  ctxEditingWordId: null as number | null,
  ctxSetEditingWordId: (arg: number | null) => {},
  ctxStructureUpdateType: {} as StructureUpdateType,
  ctxSetStructureUpdateType: (arg: StructureUpdateType) => {},
  ctxActiveHighlightIds: { syntax: null, motif: null, structure: null } as Record<ColorSource, string | null>,
  ctxSetActiveHighlightId: (_source: ColorSource, _id: string | null) => {},
  ctxHighlightCacheRef: null as unknown as MutableRefObject<Map<string, Map<number, ColorData | undefined>>>,
  ctxWordsColorMap: {} as Map<number, ColorData>,
  ctxSetWordsColorMap: (arg: Map<number, ColorData>) => {},
  ctxHistory: [] as HistoryEntry[],
  ctxPointer: {} as number,
  ctxSetPointer: (arg: number) => {},
  ctxAddToHistory: (metadata: StudyMetadata, options?: HistorySnapshotOptions) => {},
  ctxLanguageMode: {} as LanguageMode,
  ctxSetLanguageMode: (arg: LanguageMode) => {},
  ctxNonEnglishDisplayMode: NonEnglishDisplayMode.Hebrew,
  ctxSetNonEnglishDisplayMode: (arg: NonEnglishDisplayMode) => {},
  ctxSelectedSoundChipIds: [] as string[],
  ctxSetSelectedSoundChipIds: (arg: string[]) => {},
  ctxHighlightedSoundChipIds: [] as string[],
  ctxSetHighlightedSoundChipIds: (arg: string[]) => {},
  ctxSoundHighlightEnabled: false,
  ctxSetSoundHighlightEnabled: (arg: boolean) => {},
  ctxSelectedLetterChipIds: [] as string[],
  ctxSetSelectedLetterChipIds: (arg: string[]) => {},
  ctxHighlightedLetterChipIds: [] as string[],
  ctxSetHighlightedLetterChipIds: (arg: string[]) => {},
  ctxLetterHighlightEnabled: false,
  ctxSetLetterHighlightEnabled: (arg: boolean) => {},
  ctxNoteBox: undefined as undefined|DOMRect,
  ctxSetNoteBox: (arg: undefined|DOMRect) => {},
  ctxNoteMerge: true,
  ctxSetNoteMerge: (arg: boolean) => {},
  ctxActiveNotesPane: null as "heb" | "eng" | null,
  ctxSetActiveNotesPane: (arg: "heb" | "eng" | null) => {},
  ctxStropheNoteBtnOn: false,
  ctxSetStropheNoteBtnOn: (arg: boolean) => {},
  ctxLayers: [INITIAL_LAYER_DEF] as LayerDef[],
  ctxSetLayers: (_arg: LayerDef[]) => {},
  ctxActiveLayerId: 0,
  ctxSwitchLayer: (_id: number) => {},
  ctxCreateLayer: (_layer: LayerDef) => {},
  ctxDeleteLayer: (_id: number) => {},
  ctxCurrentSpokenWordIds: [] as number[],
  ctxSetCurrentSpokenWordIds: (_arg: number[]) => {},
  // Accent "portion" words (cross-word lead words) tied to the current Structure
  // selection; they receive a matching border when a fill color is applied.
  ctxAccentBorderWordIds: [] as number[],
  ctxSetAccentBorderWordIds: (_arg: number[]) => {}
});

// Clone a word map for a new layer, dropping colour and strophe-note data while
// keeping structural metadata (line/strophe/stanza divisions, indentation, etc.).
const cloneWordMapWithoutColorAndNotes = (words: WordMap): WordMap => {
  const result: WordMap = {};
  for (const key of Object.keys(words)) {
    const id = Number(key);
    const { color, stropheMd, ...rest } = words[id];
    const cloned: WordMetadata = structuredClone(rest);
    if (stropheMd) {
      const { color: _stropheColor, notes: _stropheNotes, ...stropheRest } = stropheMd;
      cloned.stropheMd = structuredClone(stropheRest);
    }
    result[id] = cloned;
  }
  return result;
};

const StudyPane = ({
  passageData, inViewMode
}: {
  passageData: PassageStaticData, // heb word data
  inViewMode: boolean;
}) => {

  const [passageProps, setPassageProps] = useState<PassageProps>({ stanzaProps: [], stanzaCount: 0, stropheCount: 0 });

  // --- Layer initialisation (migration-safe) ---
  const rawMetadata = passageData.study.metadata;
  const _initialLayerDefs: LayerDef[] = rawMetadata.layerDefs ?? [INITIAL_LAYER_DEF];
  const _initialActiveLayerId: number = rawMetadata.activeLayerId ?? 0;
  // The active layer's words are always authoritative in studyMetadata.words.
  const _initialLayerWordMaps: Record<string, WordMap> = {
    ...(rawMetadata.layerWordMaps ?? {}),
    [String(_initialActiveLayerId)]: rawMetadata.words ?? {},
  };
  const _initialStudyMetadata: StudyMetadata = {
    ...rawMetadata,
    layerDefs: _initialLayerDefs,
    layerWordMaps: _initialLayerWordMaps,
    activeLayerId: _initialActiveLayerId,
  };

  const [studyMetadata, setStudyMetadata] = useState<StudyMetadata>(_initialStudyMetadata);
  const [layerDefs, setLayerDefs] = useState<LayerDef[]>(_initialLayerDefs);
  const [activeLayerId, setActiveLayerId] = useState<number>(_initialActiveLayerId);

  // Ref kept current so callbacks can read latest metadata without stale closures.
  const studyMetadataRef = useRef<StudyMetadata>(_initialStudyMetadata);
  useEffect(() => { studyMetadataRef.current = studyMetadata; }, [studyMetadata]);

  const [studyNotes, setStudyNotes] = useState<string>(passageData.study.notes);
  const [scaleValue, setScaleValue] = useState(passageData.study.metadata?.scaleValue || DEFAULT_SCALE_VALUE);
  const [isHebrew, setHebrew] = useState(false);

  const [numSelectedWords, setNumSelectedWords] = useState(0);
  const [selectedWords, setSelectedWords] = useState<WordProps[]>([]);
  const [selectedStrophes, setSelectedStrophes] = useState<StropheProps[]>([]);
  const [numSelectedStrophes, setNumSelectedStrophes] = useState(0);
  const [numSelectedLayers, setNumSelectedLayers] = useState(0);

  const [colorAction, setColorAction] = useState(ColorActionType.none);
  const [selectedColor, setSelectedColor] = useState("");

  const [colorFill, setColorFill] = useState(DEFAULT_COLOR_FILL);
  const [borderColor, setBorderColor] = useState(DEFAULT_BORDER_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [boxDisplayConfig, setBoxDisplayConfig] = useState<BoxDisplayConfig>({ style: BoxDisplayStyle.box });
  const [indentNum, setIndentNum] = useState(0);

  const [infoPaneAction, setInfoPaneAction] = useState(InfoPaneActionType.none);
  const [infoPaneWidth, setInfoPaneWidth] = useState(360);
  const [structureUpdateType, setStructureUpdateType] = useState(StructureUpdateType.none);
  const [wordsColorMap, setWordsColorMap] = useState<Map<number, ColorData>>(new Map());
  const [activeHighlightIds, setActiveHighlightIds] = useState<Record<ColorSource, string | null>>({
    syntax: null,
    motif: null,
    structure: null,
  });
  const highlightCacheRef = useRef<Map<string, Map<number, ColorData | undefined>>>(new Map());

  const snapshotHistoryEntry = (
    metadata: StudyMetadata,
    options?: HistorySnapshotOptions,
  ): HistoryEntry => ({
    metadata: structuredClone(metadata),
    wordsColorMap: cloneWordsColorMap(options?.wordsColorMap ?? wordsColorMap),
    activeHighlightIds: options?.activeHighlightIds
      ? { ...options.activeHighlightIds }
      : { ...activeHighlightIds },
    highlightCache: cloneHighlightCache(options?.highlightCache ?? highlightCacheRef.current),
  });

  const [cloneStudyOpen, setCloneStudyOpen] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([
    snapshotHistoryEntry(passageData.study.metadata),
  ]);
  const [pointer, setPointer] = useState(0);

  // set default language to English
  const [languageMode, setLanguageMode] = useState<LanguageMode>(LanguageMode.English);
  const [nonEnglishDisplayMode, setNonEnglishDisplayMode] = useState<NonEnglishDisplayMode>(
    NonEnglishDisplayMode.Hebrew,
  );
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [selectedSoundChipIds, setSelectedSoundChipIds] = useState<string[]>([]);
  const [highlightedSoundChipIds, setHighlightedSoundChipIds] = useState<string[]>([]);
  const [soundHighlightEnabled, setSoundHighlightEnabled] = useState(false);
  const [selectedLetterChipIds, setSelectedLetterChipIds] = useState<string[]>([]);
  const [highlightedLetterChipIds, setHighlightedLetterChipIds] = useState<string[]>([]);
  const [letterHighlightEnabled, setLetterHighlightEnabled] = useState(false);
  const [accentBorderWordIds, setAccentBorderWordIds] = useState<number[]>([]);

  const [noteBox, setNoteBox] = useState(undefined as undefined|DOMRect);
  const [noteMerge, setNoteMerge] = useState(true);
  const [activeNotesPane, setActiveNotesPane] = useState<"heb" | "eng" | null>(null);
  const [stropheNoteBtnOn, setStropheNoteBtnOn] = useState(false);
  const [currentSpokenWordIds, setCurrentSpokenWordIds] = useState<number[]>([]);

  const addToHistory = (
    updatedMetadata: StudyMetadata,
    options?: HistorySnapshotOptions,
  ) => { 
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(snapshotHistoryEntry(updatedMetadata, options));
    setHistory(newHistory);
    setPointer(pointer + 1);
  };

  // Commit a layer-level metadata change. `undoable` controls whether this creates
  // a new history step (true, e.g. deletion) or simply keeps the current history
  // entry in sync with the latest state (false, e.g. switching, renaming, recolouring).
  // Defined as a plain function (not memoized) so it always reads fresh history/pointer.
  const commitLayerState = (
    updated: StudyMetadata,
    undoable: boolean,
    options?: HistorySnapshotOptions,
  ) => {
    setStudyMetadata(updated);
    setLayerDefs(updated.layerDefs ?? []);
    setActiveLayerId(updated.activeLayerId ?? 0);
    if (undoable) {
      addToHistory(updated, options);
    } else {
      setHistory((prev) => {
        const copy = prev.slice();
        copy[pointer] = snapshotHistoryEntry(updated, options);
        return copy;
      });
    }
    updateMetadataInDb(passageData.study.id, updated);
  };

  // Switch the active layer: saves the current layer's words then loads the new layer's words.
  const switchLayer = (newId: number) => {
    if (newId === activeLayerId) return;
    const current = studyMetadataRef.current;
    const updatedLayerWordMaps: Record<string, WordMap> = {
      ...(current.layerWordMaps ?? {}),
      [String(activeLayerId)]: current.words,
    };
    const newWords: WordMap = updatedLayerWordMaps[String(newId)] ?? {};
    const updated: StudyMetadata = {
      ...current,
      words: newWords,
      layerWordMaps: updatedLayerWordMaps,
      activeLayerId: newId,
      layerDefs,
    };
    setWordsColorMap(new Map());
    commitLayerState(updated, false, { wordsColorMap: new Map() });
  };

  // Update the layer definitions (name/colour changes, reorder). Not separately undoable.
  const handleSetLayers = (newLayers: LayerDef[]) => {
    const updated: StudyMetadata = { ...studyMetadataRef.current, layerDefs: newLayers };
    commitLayerState(updated, false);
  };

  // Create a new layer, copying the current layer's structural metadata (divisions,
  // indentation, etc.) but not its colour or notes.
  const createLayer = (newLayer: LayerDef) => {
    const current = studyMetadataRef.current;
    const seededWords = cloneWordMapWithoutColorAndNotes(current.words);
    const updatedLayerWordMaps: Record<string, WordMap> = {
      ...(current.layerWordMaps ?? {}),
      [String(activeLayerId)]: current.words,
      [String(newLayer.id)]: seededWords,
    };
    const updated: StudyMetadata = {
      ...current,
      words: seededWords,
      layerWordMaps: updatedLayerWordMaps,
      layerDefs: [...layerDefs, newLayer],
      activeLayerId: newLayer.id,
    };
    setWordsColorMap(new Map());
    commitLayerState(updated, false, { wordsColorMap: new Map() });
  };

  // Delete a layer. This IS undoable: the pre-deletion state lives at history[pointer],
  // so pressing undo restores the removed layer (and its metadata).
  const deleteLayer = (id: number) => {
    if (layerDefs.length <= 1) return; // always keep at least one layer
    const current = studyMetadataRef.current;
    const newLayerDefs = layerDefs.filter((l) => l.id !== id);
    const newLayerWordMaps: Record<string, WordMap> = {
      ...(current.layerWordMaps ?? {}),
      [String(activeLayerId)]: current.words,
    };
    delete newLayerWordMaps[String(id)];

    let newActiveId = current.activeLayerId ?? activeLayerId;
    let newWords = current.words;
    if (newActiveId === id) {
      newActiveId = newLayerDefs[0].id;
      newWords = newLayerWordMaps[String(newActiveId)] ?? {};
      setWordsColorMap(new Map());
    }

    const updated: StudyMetadata = {
      ...current,
      words: newWords,
      layerWordMaps: newLayerWordMaps,
      layerDefs: newLayerDefs,
      activeLayerId: newActiveId,
    };
    commitLayerState(updated, true, newActiveId !== (current.activeLayerId ?? activeLayerId) ? { wordsColorMap: new Map() } : undefined);
  };

  // Keep the layer UI state in sync when studyMetadata is replaced wholesale
  // (e.g. by undo/redo, which only sets studyMetadata).
  useEffect(() => {
    if (studyMetadata.layerDefs && studyMetadata.layerDefs !== layerDefs) {
      setLayerDefs(studyMetadata.layerDefs);
    }
    if (typeof studyMetadata.activeLayerId === "number" && studyMetadata.activeLayerId !== activeLayerId) {
      setActiveLayerId(studyMetadata.activeLayerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyMetadata]);

  useEffect(() => {
    if (languageMode === LanguageMode.Parallel && stropheNoteBtnOn) {
      setStropheNoteBtnOn(false);
    }
  }, [languageMode, stropheNoteBtnOn]);

  const updateActiveHighlightId = useCallback(
    (source: ColorSource, highlightId: string | null) => {
      setActiveHighlightIds((prev) => {
        if (prev[source] === highlightId) {
          return prev;
        }
        return { ...prev, [source]: highlightId };
      });
    },
    [],
  );

  useEffect(() => {
    if (selectedWords.length === 0) {
      setColorFill(DEFAULT_COLOR_FILL);
      setBorderColor(DEFAULT_BORDER_COLOR);
      setTextColor(DEFAULT_TEXT_COLOR);
      return;
    }

    const getEffectiveColor = (wordId: number) => {
      const mapColor = wordsColorMap.get(wordId);
      if (mapColor) return mapColor;
      return studyMetadata.words[wordId]?.color;
    };

    const firstWordId = selectedWords[0].wordId;
    const firstColor = getEffectiveColor(firstWordId);

    let sameFill = true;
    let sameBorder = true;
    let sameText = true;

    const targetFill = firstColor?.fill || DEFAULT_COLOR_FILL;
    const targetBorder = firstColor?.border || DEFAULT_BORDER_COLOR;
    const targetText = firstColor?.text || DEFAULT_TEXT_COLOR;

    for (let i = 1; i < selectedWords.length; i++) {
      const color = getEffectiveColor(selectedWords[i].wordId);
      if ((color?.fill || DEFAULT_COLOR_FILL) !== targetFill) sameFill = false;
      if ((color?.border || DEFAULT_BORDER_COLOR) !== targetBorder) sameBorder = false;
      if ((color?.text || DEFAULT_TEXT_COLOR) !== targetText) sameText = false;
    }

    setColorFill(sameFill ? targetFill : DEFAULT_COLOR_FILL);
    setBorderColor(sameBorder ? targetBorder : DEFAULT_BORDER_COLOR);
    setTextColor(sameText ? targetText : DEFAULT_TEXT_COLOR);

  }, [selectedWords, wordsColorMap, studyMetadata]);

  const formatContextValue = {
    ctxStudyId: passageData.study.id,
    ctxStudyMetadata: studyMetadata,
    ctxSetStudyMetadata: setStudyMetadata,
    ctxStudyNotes: studyNotes,
    ctxSetStudyNotes: setStudyNotes,
    ctxStudyBook: passageData.study.book,
    ctxPassageProps: passageProps,
    ctxSetPassageProps: setPassageProps,
    ctxScaleValue: scaleValue,
    ctxIsHebrew: isHebrew,
    ctxSetIsHebrew: setHebrew,
    ctxSelectedWords: selectedWords,
    ctxSetSelectedWords: setSelectedWords,
    ctxNumSelectedWords: numSelectedWords,
    ctxSetNumSelectedWords: setNumSelectedWords,
    ctxSelectedStrophes: selectedStrophes,
    ctxSetSelectedStrophes: setSelectedStrophes,
    ctxNumSelectedStrophes: numSelectedStrophes,
    ctxSetNumSelectedStrophes: setNumSelectedStrophes,
    ctxNumSelectedLayers: numSelectedLayers,
    ctxSetNumSelectedLayers: setNumSelectedLayers,
    ctxColorAction: colorAction,
    ctxSetColorAction: setColorAction,
    ctxSelectedColor: selectedColor,
    ctxSetSelectedColor: setSelectedColor,
    ctxColorFill: colorFill,
    ctxSetColorFill: setColorFill,
    ctxBorderColor: borderColor,
    ctxSetBorderColor: setBorderColor,
    ctxTextColor: textColor,
    ctxSetTextColor: setTextColor,
    ctxBoxDisplayConfig: boxDisplayConfig,
    ctxIndentNum: indentNum,
    ctxSetIndentNum: setIndentNum,
    ctxInViewMode: inViewMode,
    ctxEditingWordId: editingWordId,
    ctxSetEditingWordId: setEditingWordId,
    ctxStructureUpdateType: structureUpdateType,
    ctxSetStructureUpdateType: setStructureUpdateType,
    ctxActiveHighlightIds: activeHighlightIds,
    ctxSetActiveHighlightId: updateActiveHighlightId,
    ctxHighlightCacheRef: highlightCacheRef,
    ctxWordsColorMap: wordsColorMap,
    ctxSetWordsColorMap: setWordsColorMap,
    ctxHistory: history,
    ctxPointer: pointer,
    ctxSetPointer: setPointer,
    ctxAddToHistory: addToHistory,
    ctxLanguageMode: languageMode,
    ctxSetLanguageMode: setLanguageMode,
    ctxNonEnglishDisplayMode: nonEnglishDisplayMode,
    ctxSetNonEnglishDisplayMode: setNonEnglishDisplayMode,
    ctxSelectedSoundChipIds: selectedSoundChipIds,
    ctxSetSelectedSoundChipIds: setSelectedSoundChipIds,
    ctxHighlightedSoundChipIds: highlightedSoundChipIds,
    ctxSetHighlightedSoundChipIds: setHighlightedSoundChipIds,
    ctxSoundHighlightEnabled: soundHighlightEnabled,
    ctxSetSoundHighlightEnabled: setSoundHighlightEnabled,
    ctxSelectedLetterChipIds: selectedLetterChipIds,
    ctxSetSelectedLetterChipIds: setSelectedLetterChipIds,
    ctxHighlightedLetterChipIds: highlightedLetterChipIds,
    ctxSetHighlightedLetterChipIds: setHighlightedLetterChipIds,
    ctxLetterHighlightEnabled: letterHighlightEnabled,
    ctxSetLetterHighlightEnabled: setLetterHighlightEnabled,
    ctxNoteBox: noteBox,
    ctxSetNoteBox: setNoteBox,
    ctxNoteMerge: noteMerge,
    ctxSetNoteMerge: setNoteMerge,
    ctxActiveNotesPane: activeNotesPane,
    ctxSetActiveNotesPane: setActiveNotesPane,
    ctxStropheNoteBtnOn: stropheNoteBtnOn,
    ctxSetStropheNoteBtnOn: setStropheNoteBtnOn,
    ctxLayers: layerDefs,
    ctxSetLayers: handleSetLayers,
    ctxActiveLayerId: activeLayerId,
    ctxSwitchLayer: switchLayer,
    ctxCreateLayer: createLayer,
    ctxDeleteLayer: deleteLayer,
    ctxCurrentSpokenWordIds: currentSpokenWordIds,
    ctxSetCurrentSpokenWordIds: setCurrentSpokenWordIds,
    ctxAccentBorderWordIds: accentBorderWordIds,
    ctxSetAccentBorderWordIds: setAccentBorderWordIds
  };

  useEffect(() => {

    // merge custom metadata with bible data
    let initPassageProps : PassageProps = mergeData(passageData.bibleData, studyMetadata);
    setPassageProps(initPassageProps);
    
    // Handle migration from old BoxDisplayStyle enum to new BoxDisplayConfig
    let boxConfig = studyMetadata.boxStyle;
    if (boxConfig && typeof boxConfig === 'number') {
      // This is the old enum format, convert it
      const oldStyle = boxConfig as any; // BoxDisplayStyle enum
      if (oldStyle === 0) { // noBox
        boxConfig = { style: BoxDisplayStyle.noBox };
      } else if (oldStyle === 1) { // box
        boxConfig = { style: BoxDisplayStyle.box };
      } else if (oldStyle === 2) { // uniformBoxes
        boxConfig = { style: BoxDisplayStyle.uniformBoxes };
      }
      // Update the metadata with the new format
      studyMetadata.boxStyle = boxConfig;
      updateMetadataInDb(passageData.study.id, studyMetadata);
    }
    
    setBoxDisplayConfig(boxConfig || { style: BoxDisplayStyle.box });
    setLanguageMode(studyMetadata.lang || LanguageMode.English);
    setNonEnglishDisplayMode(
      studyMetadata.nonEnglishDisplayMode ?? NonEnglishDisplayMode.Hebrew,
    );
  
  }, [passageData.bibleData, studyMetadata]);

  if (!passageData.study.metadata.words) {
    let emptyStudyMetadata : StudyMetadata = { words: {} };
    passageData.study.metadata = emptyStudyMetadata;
    setStudyMetadata(emptyStudyMetadata);
    setPointer(0);
    updateMetadataInDb(passageData.study.id, emptyStudyMetadata);
  }

  return (

    <>
      <FormatContext.Provider value={formatContextValue}>

        {/* Header */}
        <Header
          study={passageData.study}
          setInfoPaneAction={setInfoPaneAction}
          infoPaneAction={infoPaneAction}
          setScaleValue={setScaleValue}
          setColorAction={setColorAction}
          setSelectedColor={setSelectedColor}
          setBoxStyle={setBoxDisplayConfig}
          setCloneStudyOpen={setCloneStudyOpen}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden pt-32 pb-14 max-[645px]:!pb-0">
          <main className={`flex flex-row overflow-y-auto overflow-x-auto relative h-full flex-1 ${languageMode == LanguageMode.Hebrew && nonEnglishDisplayMode == NonEnglishDisplayMode.Hebrew ? "hbFont" : ""}`}>
            {/* Scrollable Passage Pane */}
            <Passage bibleData={passageData.bibleData}/>
            {
            <CloneStudyModal originalStudy={passageData.study} open={cloneStudyOpen} setOpen={setCloneStudyOpen} />
            }
          </main>

          {
              infoPaneAction !== InfoPaneActionType.none && (
                /* Scrollable Info Pane */
                <InfoPane
                  infoPaneAction={infoPaneAction}
                  setInfoPaneAction={setInfoPaneAction}
                  infoPaneWidth={infoPaneWidth}
                  setInfoPaneWidth={setInfoPaneWidth}
                />
              )
          }
        </div>

        {/* Footer */}
        <Footer/>
      </FormatContext.Provider>
    </>
  );

};

export default StudyPane;
