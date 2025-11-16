import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import { LuTextSelect } from "react-icons/lu";
import { IoIosArrowForward, IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import { PiNotePencil } from "react-icons/pi";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, FormatContext } from '../index';
import { WordBlock } from './WordBlock';
import { ColorActionType, StudyNotes, BoxDisplayStyle } from "@/lib/types";
import { ColorData, StropheProps } from '@/lib/data';
import { strophesHasSameColor } from "@/lib/utils";
import { updateMetadataInDb } from '@/lib/actions';
import { LanguageContext } from './PassageBlock';
import { StropheNotes, STROPHE_NOTE_TEXT_MIN_HEIGHT, STROPHE_NOTE_TITLE_MIN_HEIGHT, STROPHE_NOTE_VERTICAL_GAP } from './StropheNotes';
import { getReadableTextColor } from '@/lib/color';

export const StropheBlock = ({
    stropheProps,
    stanzaExpanded,
    maxStanzaNoteWidth,
    onWordAreaWidthChange,
    isForNotes
  }: {
    stropheProps: StropheProps,
    stanzaExpanded: boolean,
    maxStanzaNoteWidth?: number,
    onWordAreaWidthChange?: (stropheId: number, width: number) => void,
    isForNotes: boolean
  }) => {

  const ACTION_ICON_SIZE = 22;
  
  const { ctxStudyId, ctxStudyMetadata, ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxSetSelectedWords, ctxSetNumSelectedWords, ctxColorAction, ctxSelectedColor, ctxSetColorFill, ctxSetBorderColor,
    ctxInViewMode, ctxSetNoteBox, ctxStudyNotes, ctxBoxDisplayConfig, ctxStropheNotesActive
  } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext)

  const [selected, setSelected] = useState(false);
  const [expanded, setExpanded] = useState(stropheProps.metadata?.expanded ?? true);
  const [showNote, setShowNote] = useState(false);
  const wordAreaRef = useRef<HTMLDivElement | null>(null);
  const [wordAreaWidth, setWordAreaWidth] = useState<number | null>(null);
  const [wordAreaHeight, setWordAreaHeight] = useState<number | null>(null);
  const noteTitleRef = useRef<HTMLDivElement | null>(null);
  const [noteTitleHeight, setNoteTitleHeight] = useState<number>(0);
  const firstWordId = stropheProps.lines[0].words[0].wordId;
  const lastWordId = stropheProps.lines.at(-1)?.words.at(-1)?.wordId ?? 0;

  const [colorFillLocal, setColorFillLocal] = useState(() => (
    stropheProps.metadata?.color?.fill ?? DEFAULT_COLOR_FILL
  ));
  const [borderColorLocal, setBorderColorLocal] = useState(() => (
    stropheProps.metadata?.color?.border ?? DEFAULT_BORDER_COLOR
  ));
  const contrastingForegroundColor = useMemo(
    () => getReadableTextColor(colorFillLocal || DEFAULT_COLOR_FILL),
    [colorFillLocal]
  );

  const stropheNoteTitle = useMemo(() => {
    if (!ctxStudyNotes) return "";
    try {
      const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes> | null;
      const strophes = Array.isArray(parsed?.strophes) ? parsed!.strophes! : [];
      const note = strophes?.[stropheProps.stropheId];
      if (note && typeof note.title === "string" && note.title.trim().length > 0) {
        return note.title;
      }
    } catch {
      // ignore malformed study notes payloads
    }
    return "";
  }, [ctxStudyNotes, stropheProps.stropheId]);

  const noteTitleWrapperClass = useMemo(
    () => (ctxIsHebrew ? 'pl-16 justify-end' : 'pr-16 justify-start'),
    [ctxIsHebrew]
  );
  const noteTitleTextClass = useMemo(
    () => (ctxIsHebrew ? 'text-right' : 'text-left'),
    [ctxIsHebrew]
  );

  const handleNoteAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    ctxSetNoteBox(e.currentTarget.getBoundingClientRect());
  }

  const persistStropheColor = useCallback(
    (colorUpdate: Partial<ColorData>) => {
      const wordMetadata = ctxStudyMetadata.words[firstWordId] ?? (ctxStudyMetadata.words[firstWordId] = {});
      const stropheMd = wordMetadata.stropheMd ?? (wordMetadata.stropheMd = {});
      const color = stropheMd.color ?? (stropheMd.color = {});
      stropheProps.metadata.color = color;
      Object.assign(color, colorUpdate);
    },
    [ctxStudyMetadata, firstWordId, stropheProps]
  );

  const metadataFill = stropheProps.metadata?.color?.fill ?? DEFAULT_COLOR_FILL;
  const metadataBorder = stropheProps.metadata?.color?.border ?? DEFAULT_BORDER_COLOR;



  useEffect(() => {
    setColorFillLocal((prev) => (prev === metadataFill ? prev : metadataFill));
    setBorderColorLocal((prev) => (prev === metadataBorder ? prev : metadataBorder));
  }, [metadataFill, metadataBorder]);

  useEffect(() => {
    if (ctxColorAction != ColorActionType.none ) {
      if (ctxColorAction === ColorActionType.colorFill && colorFillLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
        setColorFillLocal(ctxSelectedColor);
        persistStropheColor({ fill: ctxSelectedColor });
      }
      else if (ctxColorAction === ColorActionType.borderColor && borderColorLocal != ctxSelectedColor && ctxSelectedColor != "" && selected) {
        setBorderColorLocal(ctxSelectedColor);
        persistStropheColor({ border: ctxSelectedColor });
      }
      else if ((ctxColorAction === ColorActionType.resetColor && selected) || ctxColorAction == ColorActionType.resetAllColor) {
        if (colorFillLocal != DEFAULT_COLOR_FILL) {
          setColorFillLocal(DEFAULT_COLOR_FILL);
          persistStropheColor({ fill: DEFAULT_COLOR_FILL });
        }
        if (borderColorLocal != DEFAULT_BORDER_COLOR) {
          setBorderColorLocal(DEFAULT_BORDER_COLOR);
          persistStropheColor({ border: DEFAULT_BORDER_COLOR });
        }
      }
    }
    //if (strophe.colorFill != colorFillLocal) { setColorFillLocal(strophe.colorFill || DEFAULT_COLOR_FILL) }
    //if (strophe.borderColor != borderColorLocal) { setBorderColorLocal(strophe.borderColor || DEFAULT_BORDER_COLOR) }
  }, [ctxColorAction, selected, stropheProps, colorFillLocal, borderColorLocal, ctxSelectedColor, persistStropheColor]);
  
  useEffect(() => {
    setSelected(ctxSelectedStrophes.some(stropie => stropie.stropheId === stropheProps.stropheId));
    ctxSetNumSelectedStrophes(ctxSelectedStrophes.length);
  }, [ctxSelectedStrophes, stropheProps, ctxSetNumSelectedStrophes, ctxSetSelectedStrophes]);

  const handleStropheBlockClick = () => {
    setSelected(prevState => !prevState);
    const newSelectedStrophes = [...ctxSelectedStrophes]; // Clone the array
    (!selected) ? newSelectedStrophes.push(stropheProps) : newSelectedStrophes.splice(newSelectedStrophes.indexOf(stropheProps), 1);
    ctxSetSelectedStrophes(newSelectedStrophes);
    ctxSetNumSelectedStrophes(newSelectedStrophes.length);
    // remove any selected word blocks if strophe block is selected
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);

    ctxSetColorFill(DEFAULT_COLOR_FILL);
    ctxSetBorderColor(DEFAULT_BORDER_COLOR);
    if (ctxSelectedStrophes.length >= 1) {
      const lastSelectedStrophe = ctxSelectedStrophes.at(ctxSelectedStrophes.length-1);
      if (lastSelectedStrophe) {
        strophesHasSameColor(ctxSelectedStrophes, ColorActionType.colorFill) && ctxSetColorFill(lastSelectedStrophe.metadata.color?.fill || DEFAULT_COLOR_FILL);
        strophesHasSameColor(ctxSelectedStrophes, ColorActionType.borderColor) && ctxSetBorderColor(lastSelectedStrophe.metadata.color?.border || DEFAULT_BORDER_COLOR);
      }
    }
  }

  const handleCollapseBlockClick = () => {
    setExpanded(prevState => !prevState);

    stropheProps.metadata.expanded = !expanded;
    const firstWordIdinStrophe = stropheProps.lines[0].words[0].wordId;
    ctxStudyMetadata.words[firstWordIdinStrophe] ??= {};
    const firstWordMetadata = ctxStudyMetadata.words[firstWordIdinStrophe];
    firstWordMetadata.stropheMd ??= {};
    firstWordMetadata.stropheMd.expanded = stropheProps.metadata.expanded;

    if (!ctxInViewMode) {
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }

    // remove any selected word blocks if strophe block is collapsed or expanded
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
  }
  
  useEffect(() => {
    stropheProps.metadata?.expanded ? setExpanded(true) : setExpanded(false)
    if(stropheProps.metadata?.expanded === undefined) {
      setExpanded(true)
    }    
  }, [stropheProps.metadata.expanded])

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = wordAreaRef.current;
    if (!el) return;

    const updateMetrics = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setWordAreaWidth(rect.width);
      }
      if (rect.height > 0) {
        setWordAreaHeight(rect.height);
      }
    };

    updateMetrics();
    const observer = new ResizeObserver(() => updateMetrics());
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [stanzaExpanded, expanded]);

  const shouldShowNote = showNote && expanded && stanzaExpanded;
  useEffect(() => {
    if (!stropheNoteTitle || shouldShowNote) {
      if (!stropheNoteTitle) {
        setNoteTitleHeight(0);
      }
      return;
    }
    if (typeof ResizeObserver === "undefined") return;
    const el = noteTitleRef.current;
    if (!el) return;

    const updateNoteTitleHeight = () => {
      const rect = el.getBoundingClientRect();
      let total = rect.height;
      if (typeof window !== "undefined") {
        const style = window.getComputedStyle(el);
        const marginTop = parseFloat(style.marginTop || "0");
        const marginBottom = parseFloat(style.marginBottom || "0");
        if (!Number.isNaN(marginTop)) {
          total += marginTop;
        }
        if (!Number.isNaN(marginBottom)) {
          total += marginBottom;
        }
      }
      setNoteTitleHeight(total);
    };

    updateNoteTitleHeight();
    const observer = new ResizeObserver(() => updateNoteTitleHeight());
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [stropheNoteTitle, shouldShowNote]);

  const minNoteHeight = STROPHE_NOTE_TITLE_MIN_HEIGHT + STROPHE_NOTE_TEXT_MIN_HEIGHT + STROPHE_NOTE_VERTICAL_GAP;
  const effectiveNoteWidth = maxStanzaNoteWidth ?? wordAreaWidth ?? undefined;
  // Keep notes view height aligned with the word view (including any rendered title).
  const combinedWordHeight = (wordAreaHeight ?? 0) + ((stropheNoteTitle && stanzaExpanded) ? noteTitleHeight : 0);
  const noteContainerHeight = shouldShowNote
    ? Math.max(minNoteHeight, combinedWordHeight)
    : undefined;
  const noteContainerStyle = shouldShowNote
    ? (() => {
        const style: React.CSSProperties = {
          maxWidth: '100%',
          minHeight: minNoteHeight,
          height: noteContainerHeight,
          background: colorFillLocal,
        };
        if (typeof effectiveNoteWidth === 'number') {
          style.width = effectiveNoteWidth;
        }
        return style;
      })()
    : undefined;

  useEffect(() => {
    if (!onWordAreaWidthChange) {
      return;
    }
    if (wordAreaWidth === null || wordAreaWidth <= 0) {
      return;
    }
    onWordAreaWidthChange(stropheProps.stropheId, wordAreaWidth);
  }, [onWordAreaWidthChange, stropheProps.stropheId, wordAreaWidth]);

  useEffect(() => {
    setShowNote(isForNotes && ctxStropheNotesActive);
  }, [ctxStropheNotesActive])
  
  return (
    <div 
      key={"strophe_" + stropheProps.stropheId}
      className={`relative flex-column px-5 py-2 mx-1 my-1 min-h-[45px] ${stanzaExpanded?ctxIsHebrew?'pl-20':'pr-20':'pr-5'} ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border'}`}
      style={
        {
          background: `${colorFillLocal}`,
          border: `2px solid ${borderColorLocal}`
        }
      }
    >
      <div
        className={`z-1 absolute top-0 p-[0.5] m-[0.5] bg-transparent ${ctxIsHebrew ? 'left-0' : 'right-0'}`}
        >
      <button
        key={"strophe" + stropheProps.stropheId + "Selector"}
        className={`${stanzaExpanded ? 'mx-[0.5]' : 'mx-1'} hover:bg-theme active:bg-transparent`}
        onClick={() => handleStropheBlockClick()}
        data-clicktype={'clickable'}
      >
        <LuTextSelect
          size={ACTION_ICON_SIZE}
          color={contrastingForegroundColor}
          style={{pointerEvents:'none'}}
        />
      </button>
      {/* {
      expanded && stanzaExpanded?
      <button
        key={"strophe" + stropheProps.stropheId + "notepad"}
        className={`mx-[0.5] hover:bg-theme active:bg-transparent`}
        onClick={() => setShowNote(!showNote)}
      >
        <PiNotePencil size={ACTION_ICON_SIZE} color={contrastingForegroundColor} style={{pointerEvents:'none'}} />
      </button>
      :
      <></>
      } */}
      {
        stanzaExpanded?
        <button
          key={"strophe" + stropheProps.stropheId + "CollapseButton"}
          className={`mx-[0.5] hover:bg-theme active:bg-transparent`}
          onClick={() => handleCollapseBlockClick()}
          data-clicktype={'clickable'}
        >
          { (!expanded && ctxIsHebrew) && <IoIosArrowForward size={ACTION_ICON_SIZE} color={contrastingForegroundColor} style={{pointerEvents:'none'}} /> }
          { (!expanded && !ctxIsHebrew)  && <IoIosArrowBack size={ACTION_ICON_SIZE} color={contrastingForegroundColor} style={{pointerEvents:'none'}} /> }
          { expanded && <IoIosArrowDown size={ACTION_ICON_SIZE} color={contrastingForegroundColor} style={{pointerEvents:'none'}} /> }
        </button>
        :
        <></>
      }
      </div>
      <div
        className={`flex flex-col gap-5.5 z-10 rounded-md shadow-sm ${shouldShowNote ? '' : 'hidden'}`}
        style={noteContainerStyle}
        onClick={handleNoteAreaClick}
      >
          <StropheNotes firstWordId={firstWordId} lastWordId={lastWordId} stropheId={stropheProps.stropheId}/>
      </div>
      {stropheNoteTitle && stanzaExpanded && !shouldShowNote && (
        <div ref={noteTitleRef} className={`mt-2 flex w-full items-center ${noteTitleWrapperClass}`}>
          <span
            className={`block w-full truncate text-base font-semibold ${noteTitleTextClass}`}
            dir="auto"
            style={{ color: contrastingForegroundColor }}
          >
            {stropheNoteTitle}
          </span>
        </div>
      )}
      <div
        ref={wordAreaRef}
        className={expanded && stanzaExpanded && !showNote ? '' : 'hidden'}
      >
        {
          stropheProps.lines.map((line, lineId) => {
            return (
              <div 
                key={"line_" + lineId}
                className={`flex`}
              >
              {
                line.words.map((word) => {
                  return (
                    <div
                      className={`${ctxBoxDisplayConfig.style === BoxDisplayStyle.noBox ? 'mt-0.5 mb-0.5' : 'mt-1 mb-1'}`}
                      key={word.wordId}
                    >
                      <WordBlock
                        key={"word_" + word.wordId}
                        wordProps={word}
                      />
                    </div>
                  )
                })
              }
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
