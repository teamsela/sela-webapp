import React, { useState, useEffect, useContext, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { LuTextSelect } from "react-icons/lu";
import { IoIosArrowForward, IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import { PiNotePencil } from "react-icons/pi";
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, FormatContext } from '../index';
import { WordBlock } from './WordBlock';
import { ColorActionType, StudyNotes, BoxDisplayStyle, LanguageMode } from "@/lib/types";
import { ColorData, StropheProps } from '@/lib/data';
import { strophesHasSameColor } from "@/lib/utils";
import { updateMetadataInDb } from '@/lib/actions';
import { LanguageContext } from './PassageBlock';
import { StropheNotes } from './StropheNotes';
import { getReadableTextColor } from '@/lib/color';

export const StropheBlock = ({
    stropheProps,
    stanzaExpanded,
  }: {
    stropheProps: StropheProps,
    stanzaExpanded: boolean,
  }) => {

  const ACTION_ICON_SIZE = 22;
  const NOTE_PANEL_WIDTH = 360;
  
  const { ctxStudyId, ctxStudyMetadata, ctxSelectedStrophes, ctxSetSelectedStrophes, ctxSetNumSelectedStrophes,
    ctxSetSelectedWords, ctxSetNumSelectedWords, ctxColorAction, ctxSelectedColor, ctxSetColorFill, ctxSetBorderColor,
    ctxInViewMode, ctxSetNoteBox, ctxStudyNotes, ctxBoxDisplayConfig, ctxStropheNoteBtnOn, ctxLanguageMode, ctxScaleValue
  } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext)

  const [selected, setSelected] = useState(false);
  const [expanded, setExpanded] = useState(stropheProps.metadata?.expanded ?? true);
  const [showNote, setShowNote] = useState(false);
  const wordAreaRef = useRef<HTMLDivElement | null>(null);
  const [wordAreaHeight, setWordAreaHeight] = useState<number | null>(null);
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
  const actionButtonWrapperClass = useMemo(
    () => {
      const base = 'z-1 absolute p-[0.5] m-[0.5] bg-transparent';
      if (!stanzaExpanded) {
        const shouldPinToLanguageSide = ctxStropheNoteBtnOn || ctxLanguageMode === LanguageMode.Parallel;
        if (shouldPinToLanguageSide) {
          return `${base} top-[2.5] ${ctxIsHebrew ? 'left-2' : 'right-2'}`;
        }
        return `${base} inset-0 flex items-center justify-center`;
      }
      return `${base} top-0 ${ctxIsHebrew ? 'left-0' : 'right-0'}`;
    },
    [ctxIsHebrew, stanzaExpanded, ctxStropheNoteBtnOn, ctxLanguageMode]
  );

  const handleNoteAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Stop bubbling so drag-select handler does not steal the first click
    e.stopPropagation();
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

  const shouldShowNote = (ctxStropheNoteBtnOn || showNote) && expanded && stanzaExpanded;
  const shouldShowWords = expanded && stanzaExpanded && (!showNote || ctxStropheNoteBtnOn);
  const showOverlayNote = shouldShowNote && !ctxStropheNoteBtnOn;
  const shouldRenderWordArea = expanded && stanzaExpanded;
  const renderSideBySide = ctxStropheNoteBtnOn && shouldShowNote && shouldShowWords;
  const shouldShowCollapsedTitle = !expanded && stanzaExpanded && Boolean(stropheNoteTitle);
  const notePanelStyle = useMemo(() => {
    if (!ctxStropheNoteBtnOn) {
      return undefined;
    }
    const sizeStyles: React.CSSProperties = {
      width: NOTE_PANEL_WIDTH,
      minWidth: NOTE_PANEL_WIDTH,
      maxWidth: NOTE_PANEL_WIDTH,
      flexShrink: 0,
    };
    if (wordAreaHeight) {
      sizeStyles.height = wordAreaHeight;
      sizeStyles.minHeight = wordAreaHeight;
    }
    return sizeStyles;
  }, [ctxStropheNoteBtnOn, wordAreaHeight]);
  const syncWordAreaHeight = useCallback(() => {
    const el = wordAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) {
      const scale = ctxScaleValue > 0 ? ctxScaleValue : 1;
      const nextHeight = Math.ceil(rect.height / scale);
      setWordAreaHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    }
  }, [ctxScaleValue]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = wordAreaRef.current;
    if (!el) return;

    syncWordAreaHeight();
    const observer = new ResizeObserver(() => syncWordAreaHeight());
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [syncWordAreaHeight]);

  useLayoutEffect(() => {
    if (!shouldRenderWordArea) return;
    const frame = requestAnimationFrame(() => {
      syncWordAreaHeight();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [ctxBoxDisplayConfig.style, ctxLanguageMode, ctxStropheNoteBtnOn, shouldRenderWordArea, stropheNoteTitle, syncWordAreaHeight]);

  const contentWidthClass = "w-full min-w-0";

  return (
    <div 
      key={"strophe_" + stropheProps.stropheId}
      className={`w-full relative flex flex-col px-5 py-2 mx-1 my-1 min-h-[45px] ${stanzaExpanded?ctxIsHebrew?'pl-20':'pr-20':'pr-5'} ${selected ? 'rounded border outline outline-offset-1 outline-2 outline-[#FFC300] drop-shadow-md' : 'rounded border'}`}
      style={
        {
          background: `${colorFillLocal}`,
          border: `2px solid ${borderColorLocal}`
        }
      }
    >
      <div
        className={actionButtonWrapperClass}
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
      {
      expanded && stanzaExpanded && !ctxStropheNoteBtnOn ?
      <button
        key={"strophe" + stropheProps.stropheId + "notepad"}
        className={`mx-[0.5] hover:bg-theme active:bg-transparent`}
        onClick={() => setShowNote(!showNote)}
      >
        <PiNotePencil size={ACTION_ICON_SIZE} color={contrastingForegroundColor} style={{pointerEvents:'none'}} />
      </button>
      :
      <></>
      }
      {
        stanzaExpanded?
        <button
          key={"strophe" + stropheProps.stropheId + "CollapseButton"}
          className={`mt-2 mx-[0.5] hover:bg-theme active:bg-transparent`}
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
      {shouldShowCollapsedTitle && (
        <div className={`flex w-full items-center ${noteTitleWrapperClass}`}>
          <span
            className={`block w-full truncate text-base font-semibold ${noteTitleTextClass}`}
            dir="auto"
            style={{ color: contrastingForegroundColor }}
          >
            {stropheNoteTitle}
          </span>
        </div>
      )}
      <div className={`${contentWidthClass} ${renderSideBySide ? 'flex flex-row gap-5' : 'flex flex-col gap-5'} ${ctxIsHebrew && renderSideBySide ? 'flex-row-reverse' : ''}`}>
        {
          ctxStropheNoteBtnOn ? (
            <>
            {
              !ctxIsHebrew && 
              <div
                className={`flex flex-col gap-5.5 z-10 rounded-md shadow-sm ${shouldShowNote ? '' : 'hidden'} w-full max-w-[360px] overflow-auto`}
                style={notePanelStyle}
                onMouseDown={handleNoteAreaMouseDown}
              >
                <StropheNotes firstWordId={firstWordId} lastWordId={lastWordId} stropheId={stropheProps.stropheId}/>
              </div>
            }
              <div
                className={`${shouldShowWords ? '' : 'hidden'} flex-1 min-w-0 overflow-x-auto`}
              >
                <div ref={wordAreaRef}>
                  {stropheNoteTitle && shouldRenderWordArea && (
                  <div className={`mb-2 flex w-full items-center ${noteTitleWrapperClass}`}>
                    <span
                      className={`block w-full truncate text-base font-semibold ${noteTitleTextClass}`}
                      dir="auto"
                      style={{ color: contrastingForegroundColor }}
                    >
                      {stropheNoteTitle}
                    </span>
                  </div>
                  )}
                  {
                    stropheProps.lines.map((line, lineId) => {
                      return (
                        <div 
                          key={"line_" + lineId}
                          className={`flex my-1`}
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
                                  isFirstLineInStrophe={lineId === 0}
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
            {
              ctxIsHebrew && 
              <div
                className={`flex flex-col gap-5.5 z-10 rounded-md shadow-sm ${shouldShowNote ? '' : 'hidden'} w-full max-w-[360px] overflow-auto`}
                style={notePanelStyle}
                onMouseDown={handleNoteAreaMouseDown}
              >
                <StropheNotes firstWordId={firstWordId} lastWordId={lastWordId} stropheId={stropheProps.stropheId}/>
              </div>
            }
            </>
          ) : (
            <div className="relative">
              <div
                className={`${shouldRenderWordArea ? '' : 'hidden'} ${showOverlayNote ? 'invisible pointer-events-none' : ''} min-w-0 overflow-x-auto`}
              >
                <div ref={wordAreaRef}>
                  {stropheNoteTitle && shouldRenderWordArea && (
                  <div className={`mb-2 flex w-full items-center ${noteTitleWrapperClass}`}>
                    <span
                      className={`block w-full truncate text-base font-semibold ${noteTitleTextClass}`}
                      dir="auto"
                      style={{ color: contrastingForegroundColor }}
                    >
                      {stropheNoteTitle}
                    </span>
                  </div>
                  )}
                  
                  {
                    stropheProps.lines.map((line, lineId) => {
                      return (
                        <div 
                          key={"line_" + lineId}
                          className={`flex my-1 `}
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
                                  isFirstLineInStrophe={lineId === 0}
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
              {
                showOverlayNote &&
                <div
                  className="absolute inset-0"
                  onMouseDown={handleNoteAreaMouseDown}
                >
                  <div className="z-10 flex h-full w-full flex-col gap-5.5 rounded-md shadow-sm overflow-auto">
                    <StropheNotes firstWordId={firstWordId} lastWordId={lastWordId} stropheId={stropheProps.stropheId}/>
                  </div>
                </div>
              }
            </div>
          )
        }
      </div>
    </div>
  )
}
