import { LanguageMode } from "@/lib/types";
import { StanzaProps } from "@/lib/data";
import { useContext, useEffect, useState, useRef, useMemo } from "react";
import { FormatContext, DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR } from "..";
import { StropheBlock } from "./StropheBlock";
import { CounterStropheBlock } from "./CounterStropheBlock";
import { TbArrowBarLeft, TbArrowBarRight } from "react-icons/tb";
import { updateMetadataInDb } from "@/lib/actions";
import { LanguageContext } from "./PassageBlock";
import { getReadableTextColor } from "@/lib/color";

export const StanzaBlock = ({
  stanzaProps,
  showCounterLabel = true,
}: {
  stanzaProps: StanzaProps,
  // Whether this stanza's counter stack shows the WORDS/UNITS pill. False for
  // all but the first non-collapsed stanza when stanzas are stacked vertically
  // (reader / strophe-notes mode), where one label at the top is enough.
  showCounterLabel?: boolean,
}) => {

  const { ctxStudyMetadata, ctxSetStudyMetadata, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxStudyId, ctxInViewMode, ctxLanguageMode, ctxStropheNoteBtnOn, ctxReadmeBtnOn, ctxInTextCounterOn, ctxCounterMode } = useContext(FormatContext);
  const { ctxIsHebrew } = useContext(LanguageContext);
  const [expanded, setExpanded] = useState(stanzaProps.metadata?.expanded ?? true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(stanzaProps.metadata?.title ?? "");
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const titleEditorAreaRef = useRef<HTMLDivElement | null>(null);
  const saveTitleRef = useRef<() => void>(() => {});

  // Contrasting text color for the title (stanzas don't have per-stanza colors, so use default)
  const contrastingForegroundColor = useMemo(
    () => getReadableTextColor(DEFAULT_COLOR_FILL),
    []
  );

  const shouldStackStanzas = ctxLanguageMode == LanguageMode.Parallel || ctxStropheNoteBtnOn;
  const shouldStretchReadmeStanza = ctxReadmeBtnOn && ctxLanguageMode != LanguageMode.Parallel;
  const isParallelMode = ctxLanguageMode == LanguageMode.Parallel;
  const stanzaHorizontalPaddingClass = isParallelMode
    ? (ctxIsHebrew ? 'pl-10 pr-2' : 'pr-10 pl-2')
    : (ctxIsHebrew ? 'pl-2' : 'pr-2');
  const stanzaCollapseButtonSideClass = isParallelMode
    ? (ctxIsHebrew ? 'left-0' : 'right-0')
    : (ctxIsHebrew ? 'left-0' : 'right-0');
  const titleReservedSidePaddingClass = isParallelMode
    ? (ctxIsHebrew ? 'pl-12 pr-2' : 'pr-12 pl-2')
    : (ctxIsHebrew ? 'pl-12 pr-2' : 'pr-12 pl-2');

  // Single-language in-text counter: instead of an inline gutter, the stanza
  // renders a second stack of (neutral) count boxes side by side with the
  // language strophes, each strophe box mirrored so rows stay aligned. The
  // WORDS/UNITS pill sits in the counter stack's own title-row slot.
  const sideBySideCounter = ctxInTextCounterOn && !isParallelMode;
  const counterShowsUnits = ctxCounterMode === "units";
  // Only lay out the two side-by-side columns when the stanza is expanded and
  // has strophes; a collapsed stanza falls back to the normal single-column
  // rendering (strophe bars), keeping its pt-10 title reserve.
  const useCounterColumns =
    sideBySideCounter && expanded && stanzaProps.strophes.length > 0;

  // Sync edit title when external changes occur
  useEffect(() => {
    if (isEditingTitle) return;
    const currentTitle = stanzaProps.metadata?.title ?? "";
    if (editTitleValue !== currentTitle) {
      setEditTitleValue(currentTitle);
    }
  }, [stanzaProps.metadata?.title, isEditingTitle]);

  const startEditing = () => {
    setIsEditingTitle(true);
    // Focus the input after it mounts
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setIsEditingTitle(false);
    setEditTitleValue(stanzaProps.metadata?.title ?? "");
  };

  const saveTitle = () => {
    const newTitle = editTitleValue.trim();
    const currentTitle = stanzaProps.metadata?.title ?? "";
    if (newTitle !== currentTitle && ctxStudyId && !ctxInViewMode) {
      const updatedMetadata = { ...ctxStudyMetadata };
      const firstStrophe = stanzaProps.strophes[0];
      if (firstStrophe && firstStrophe.lines[0] && firstStrophe.lines[0].words[0]) {
        const firstWordId = firstStrophe.lines[0].words[0].wordId;
        // Ensure the word metadata entry exists
        if (!updatedMetadata.words[firstWordId]) {
          updatedMetadata.words[firstWordId] = {};
        }
        updatedMetadata.words[firstWordId].stanzaMd = {
          ...updatedMetadata.words[firstWordId].stanzaMd,
          title: newTitle || undefined
        };
        ctxSetStudyMetadata(updatedMetadata);
        updateMetadataInDb(ctxStudyId, updatedMetadata);
      }
    }
    setIsEditingTitle(false);
  };

  saveTitleRef.current = saveTitle;

  useEffect(() => {
    if (!isEditingTitle) return;

    const handleOutsidePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (titleEditorAreaRef.current?.contains(target)) return;
      saveTitleRef.current();
    };

    document.addEventListener("mousedown", handleOutsidePointerDown);
    document.addEventListener("touchstart", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsidePointerDown);
      document.removeEventListener("touchstart", handleOutsidePointerDown);
    };
  }, [isEditingTitle]);

  const handleCollapseBlockClick = () => {
    setExpanded(prevState => !prevState);

    stanzaProps.metadata.expanded = !expanded;
    const firstWordIdinStanza = stanzaProps.strophes[0].lines[0].words[0].wordId;
    if (ctxStudyMetadata.words[firstWordIdinStanza]) {
      ctxStudyMetadata.words[firstWordIdinStanza].stanzaMd ??= {};
      ctxStudyMetadata.words[firstWordIdinStanza].stanzaMd.expanded = stanzaProps.metadata.expanded;  
    }

    if (!ctxInViewMode) {
      updateMetadataInDb(ctxStudyId, ctxStudyMetadata);
    }

    // remove any selected word blocks if stanza block is collapsed or expanded
    ctxSetSelectedWords([]);
    ctxSetNumSelectedWords(0);
  }
  
  useEffect(() => {
    stanzaProps.metadata?.expanded ? setExpanded(true) : setExpanded(false)
    if(stanzaProps.metadata?.expanded === undefined) {
      setExpanded(true)
    }
  }, [stanzaProps.metadata?.expanded])

  // Title display helpers
  const hasTitle = Boolean(stanzaProps.metadata?.title);
  const placeholderText = "Add stanza title...";

  const renderArrow = () => {
    if (shouldStackStanzas) {
      if (expanded) {
        return (
            <TbArrowBarLeft className="rotate-[-90deg]" fontSize="1.1em" style={{pointerEvents:'none'}} />
        )
      }
      else {
        return (
          <>
          { 
            ctxIsHebrew ? <TbArrowBarRight fontSize="1.1em" style={{pointerEvents:'none'}} /> : <TbArrowBarLeft fontSize="1.1em" style={{pointerEvents:'none'}} />
          } 
          </>
        )  
      }
   
    }
    else {
      return (
        <>
          { ((!expanded && ctxIsHebrew) || (expanded && !ctxIsHebrew)) && <TbArrowBarLeft fontSize="1.1em" style={{pointerEvents:'none'}} /> }
          { ((!expanded && !ctxIsHebrew) || (expanded && ctxIsHebrew)) && <TbArrowBarRight fontSize="1.1em" style={{pointerEvents:'none'}} /> }        
        </>
      )        
    }
  }

  // Shared title content (used in both expanded and collapsed modes)
  const renderTitleContent = (isEditing: boolean) => {
    if (isEditing) {
      return (
        <textarea
          ref={titleInputRef}
          rows={1}
          value={editTitleValue}
          onChange={(e) => setEditTitleValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveTitle();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelEditing();
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={saveTitle}
          dir="auto"
          className={`w-full resize-none rounded border border-primary bg-transparent py-1 text-base font-semibold outline-none ${titleReservedSidePaddingClass}`}
          style={{ color: contrastingForegroundColor }}
          placeholder={placeholderText}
        />
      );
    }

    // Read-only users can't edit the title, so never show the "Add stanza
    // title..." affordance. Render an existing title as plain text; render
    // nothing when there's no title.
    if (ctxInViewMode) {
      if (!hasTitle) {
        return null;
      }
      return (
        <span
          className={`block w-full truncate py-1 text-base font-semibold ${ctxIsHebrew ? 'text-right' : 'text-left'} ${titleReservedSidePaddingClass}`}
          dir="auto"
          style={{ color: contrastingForegroundColor }}
        >
          {stanzaProps.metadata?.title}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={startEditing}
        className={`group flex w-full items-center rounded py-1 hover:bg-theme active:bg-transparent ${titleReservedSidePaddingClass}`}
        title={hasTitle ? "Edit title" : "Add title"}
      >
        <span
          className={`block w-full truncate text-base font-semibold ${!hasTitle ? 'italic opacity-0 transition-opacity group-hover:opacity-50' : ''} ${ctxIsHebrew ? 'text-right' : 'text-left'}`}
          dir="auto"
          style={{ color: contrastingForegroundColor }}
        >
          {hasTitle ? stanzaProps.metadata?.title : placeholderText}
        </span>
      </button>
    );
  };

  return(
      <div
      key={"stanza_" + stanzaProps.stanzaId}
      className={`relative flex flex-col ${ctxLanguageMode == LanguageMode.Parallel || useCounterColumns ? '' : 'pt-10'} ${shouldStretchReadmeStanza ? 'w-full min-w-0 flex-1 grow' : 'grow-0'} ${expanded ? 'flex-1' : ''} ${stanzaHorizontalPaddingClass} rounded border`}
      >
      <div
        className={`z-1 absolute top-0 p-[0.5] m-[0.5] bg-transparent ${stanzaCollapseButtonSideClass}`}
        >
      <button
        key={"strophe" + stanzaProps.stanzaId + "Selector"}
        className={`p-2 m-1 hover:bg-theme active:bg-transparent`}
        onClick={() => handleCollapseBlockClick()}
        data-clicktype={'clickable'}
      >
        
        { renderArrow() }

      </button>
      </div>
      {/* Expanded title display (parallel + single-no-counter). In the
          side-by-side counter layout the title is rendered in-flow inside the
          language column instead (see below). */}
      {expanded && stanzaProps.strophes.length > 0 && !useCounterColumns && (
        ctxLanguageMode == LanguageMode.Parallel ? (
          // In parallel mode, title spans full width at top as a flex item
          <div
            ref={titleEditorAreaRef}
            className={`mx-1 flex w-full items-center ${ctxIsHebrew ? 'justify-end' : 'justify-start'}`}
          >
            {renderTitleContent(isEditingTitle)}
          </div>
        ) : (
          // In single mode, title uses absolute positioning within the reserved
          // pt-10 space at the top of the stanza.
          <div
            ref={titleEditorAreaRef}
            className={`absolute top-0 flex h-10 items-center ${ctxIsHebrew ? 'justify-end' : 'justify-start'}`}
            style={{ insetInlineStart: "0.25rem", insetInlineEnd: "0.25rem" }}
          >
            {renderTitleContent(isEditingTitle)}
          </div>
        )
      )}

      {useCounterColumns ? (
        // Single-language + counter: two stacks side by side, kept inside the
        // stanza border. The counter stack is the first child; a plain flex-row
        // then places it on the reading-start side automatically, because the
        // passage inherits `direction: rtl` in Hebrew — so the counter sits left
        // of English text and right of Hebrew text (matching the verse-number
        // side and the old inline gutter). Do NOT add flex-row-reverse: combined
        // with the inherited rtl it would cancel out and push the counter back
        // to the left in Hebrew.
        <div className="flex flex-row">
          {/* Counter stack — WORDS/UNITS pill occupies the title-row slot (h-10,
              matching the language title row) so both stacks' strophes start at
              the same y and stay row-aligned. */}
          <div className="flex flex-col shrink-0 ms-1">
            {/* h-10 slot always present (keeps the counter column's strophes
                row-aligned with the language column, whose stanza-title row is
                also h-10); the pill itself only shows when showCounterLabel. */}
            <div className="flex h-10 items-center justify-center" aria-hidden="true">
              {showCounterLabel && (
                // Both labels share one grid cell so the blue pill always sizes
                // to the wider word (WORDS); only the active mode is visible, so
                // toggling Words/Units keeps the pill width fixed.
                <span className="select-none rounded-sm bg-primary px-2.5 h-8 grid place-items-center text-[10px] font-semibold uppercase tracking-wide text-white">
                  <span className={`col-start-1 row-start-1 whitespace-nowrap ${counterShowsUnits ? "" : "invisible"}`}>Units</span>
                  <span className={`col-start-1 row-start-1 whitespace-nowrap ${counterShowsUnits ? "invisible" : ""}`}>Words</span>
                </span>
              )}
            </div>
            {stanzaProps.strophes.map((strophe) => (
              <CounterStropheBlock
                key={strophe.stropheId}
                stropheProps={strophe}
                stanzaExpanded={expanded}
                bordered
              />
            ))}
          </div>
          {/* Language stack — in-flow stanza title row (h-10) above the strophes. */}
          <div className="flex flex-col flex-1 min-w-0">
            <div
              ref={titleEditorAreaRef}
              className={`flex h-10 items-center ${ctxIsHebrew ? 'justify-end' : 'justify-start'}`}
            >
              {renderTitleContent(isEditingTitle)}
            </div>
            {stanzaProps.strophes.map((strophe) => (
              <StropheBlock
                stropheProps={strophe}
                key={strophe.stropheId}
                stanzaExpanded={expanded}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex flex-col ${ctxLanguageMode == LanguageMode.Parallel || shouldStretchReadmeStanza ? 'w-full min-w-0' : ''}`}>
        {
            stanzaProps.strophes.map((strophe) => {
                return (
                    <StropheBlock
                    stropheProps={strophe}
                    key={strophe.stropheId}
                    stanzaExpanded={expanded}
                    />
                )
            })
        }
        </div>
      )}
      </div>
  )
}
