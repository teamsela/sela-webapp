import { LanguageMode } from "@/lib/types";
import { StanzaProps } from "@/lib/data";
import { useContext, useEffect, useState, useRef, useMemo } from "react";
import { FormatContext, DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR } from "..";
import { StropheBlock } from "./StropheBlock";
import { TbArrowBarLeft, TbArrowBarRight } from "react-icons/tb";
import { updateMetadataInDb } from "@/lib/actions";
import { LanguageContext } from "./PassageBlock";
import { getReadableTextColor } from "@/lib/color";

export const StanzaBlock = ({
  stanzaProps
}: {
  stanzaProps: StanzaProps
}) => {

  const { ctxStudyMetadata, ctxSetStudyMetadata, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxStudyId, ctxInViewMode, ctxLanguageMode, ctxStropheNoteBtnOn } = useContext(FormatContext);
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

    return (
      <button
        type="button"
        onClick={startEditing}
        className={`flex w-full items-center rounded py-1 hover:bg-theme active:bg-transparent ${titleReservedSidePaddingClass}`}
        title={hasTitle ? "Edit title" : "Add title"}
      >
        <span
          className={`block w-full truncate text-base font-semibold ${!hasTitle ? 'opacity-50 italic' : ''} ${ctxIsHebrew ? 'text-right' : 'text-left'}`}
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
      className={`relative flex flex-col ${ctxLanguageMode == LanguageMode.Parallel ? '' : 'pt-10'} grow-0 ${expanded ? 'flex-1' : ''} ${stanzaHorizontalPaddingClass} rounded border`} 
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

      {/* Expanded title display */}
      {expanded && stanzaProps.strophes.length > 0 && (
        ctxLanguageMode == LanguageMode.Parallel ? (
          // In parallel mode, title spans full width at top as a flex item
          <div
            ref={titleEditorAreaRef}
            className={`mx-1 flex w-full items-center ${ctxIsHebrew ? 'justify-end' : 'justify-start'}`}
          >
            {renderTitleContent(isEditingTitle)}
          </div>
        ) : (
          // In single mode, title uses absolute positioning
          <div
            ref={titleEditorAreaRef}
            className={`absolute top-0 left-1 right-1 flex h-10 items-center ${ctxIsHebrew ? 'justify-end' : 'justify-start'}`}
          >
            {renderTitleContent(isEditingTitle)}
          </div>
        )
      )}

      <div className={`flex flex-col ${ctxLanguageMode == LanguageMode.Parallel ? 'w-full' : ''}`}>
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
      </div>
  )
}
