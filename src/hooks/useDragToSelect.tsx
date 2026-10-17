import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../components/StudyPane/index';
import { getWordById, wordsHasSameColor } from '@/lib/utils';
import { PassageData, PassageProps } from '@/lib/data';
import { ColorActionType, StructureUpdateType } from '@/lib/types';

export const useDragToSelect = (passageProps: PassageProps) => {

    const { ctxSelectedWords, ctxSetSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes,
        ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor, ctxNoteBox, ctxSetNoteBox,
        ctxSetNumSelectedLayers
    } = useContext(FormatContext)

    //drag-to-select module
    ///////////////////////////
    ///////////////////////////
    const [isDragging, setIsDragging] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
    // Use a ref (not state) so handleMouseUp always reads the current value without stale closure.
    const clickToDeSelectRef = useRef(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        // to make selection of text inside text boxes possible ***  //
        const eventRectX = event.pageX;
        const eventRectY = event.pageY;
        let insideNoteBox = false;
        if (ctxNoteBox) {
            insideNoteBox = ctxNoteBox && (eventRectX >= ctxNoteBox.left && eventRectX <= ctxNoteBox.right ) && (eventRectY >= ctxNoteBox.top && eventRectY <= ctxNoteBox.bottom) 
            !insideNoteBox && ctxSetNoteBox(undefined);
            !insideNoteBox && document.activeElement instanceof HTMLElement && document.activeElement.blur();
        }
        if (insideNoteBox) return;
        // ********************************************************  //
        event.preventDefault();
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        setSelectionStart({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
        setSelectionEnd(null);
        //click to de-select
        //if clicked on wordBlock, set status here so de-select function doesnt fire
        // Use closest() so clicks on inner child spans (e.g. Hebrew highlight
        // segments) correctly resolve the clickable ancestor, not just the direct target.
        const target = event.target as HTMLElement;
        const clickableAncestor = target.closest('[data-clicktype="clickable"]');
        clickToDeSelectRef.current = !clickableAncestor;
    };

    let rects;
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!isDragging) return;
        if (!selectionStart) return;
        // filter out small accidental drags when user clicks
        /////////
        const distance = Math.sqrt(Math.pow(event.clientX - selectionStart.x, 2) + Math.pow(event.clientY - selectionStart.y, 2));
        if (distance > 6)
            setSelectionEnd({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
        else
            setSelectionEnd(null);
        /////////
        if (!selectionStart || !selectionEnd || !containerRef.current) return;
        // Get all elements with the class 'wordBlock' inside the container
        rects = containerRef.current.querySelectorAll('.wordBlock');

        rects.forEach(rect => {
            const rectBounds = rect.getBoundingClientRect();
            const adjustedBounds = {
                top: rectBounds.top + window.scrollY,
                bottom: rectBounds.bottom + window.scrollY,
                left: rectBounds.left + window.scrollX,
                right: rectBounds.right + window.scrollX,
            };

            // Check if the element is within the selection box
            if (
                adjustedBounds.left < Math.max(selectionStart.x, selectionEnd.x) &&
                adjustedBounds.right > Math.min(selectionStart.x, selectionEnd.x) &&
                adjustedBounds.top < Math.max(selectionStart.y, selectionEnd.y) &&
                adjustedBounds.bottom > Math.min(selectionStart.y, selectionEnd.y)
            ) {
                const wordId = Number(rect.getAttribute('id'));
                const selectedWord = getWordById(passageProps, wordId);
                if (selectedWord !== null && !ctxSelectedWords.includes(selectedWord)) {
                    const newArray = [...ctxSelectedWords, selectedWord];
                    ctxSetSelectedWords(newArray);
                    ctxSetNumSelectedWords(ctxSelectedWords.length);
                }
            }
        });

        ctxSetColorFill(DEFAULT_COLOR_FILL);
        ctxSetBorderColor(DEFAULT_BORDER_COLOR);
        ctxSetTextColor(DEFAULT_TEXT_COLOR);

        if (ctxSelectedWords.length >= 1) {
            const lastSelectedWord = ctxSelectedWords.at(ctxSelectedWords.length - 1);
            // if (lastSelectedWord) {
            //     wordsHasSameColor(ctxSelectedWords, ColorActionType.colorFill) && ctxSetColorFill(lastSelectedWord?.colorFill);
            //     wordsHasSameColor(ctxSelectedWords, ColorActionType.borderColor) && ctxSetBorderColor(lastSelectedWord?.borderColor);
            //     wordsHasSameColor(ctxSelectedWords, ColorActionType.textColor) && ctxSetTextColor(lastSelectedWord?.textColor);
            // }
            ctxSetSelectedStrophes([]);
        }

    }, [isDragging, selectionStart, selectionEnd, passageProps, ctxSelectedWords, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxSetSelectedStrophes, ctxSetBorderColor, ctxSetColorFill, ctxSetTextColor]);

    const handleMouseUp = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLTextAreaElement;
        document.body.style.userSelect = 'text';
        setIsDragging(false);
        // List of class names to skip
        const skipClasses = ["ClickBlock"];

        // Check if the clicked target or its parents contain any of the skip classes
        const shouldSkip = skipClasses.some((cls) =>
            target.classList.contains(cls) || target.closest(`.${cls}`)
        );
        if (shouldSkip) {
            return;
        }
        if (!selectionEnd && clickToDeSelectRef.current) {
            ctxSetNumSelectedWords(0);
            ctxSetSelectedWords([]);
            ctxSetSelectedStrophes([]);
            // Clicking the passage workspace also de-selects any active layer.
            // Scope this to clicks that actually land inside the passage container
            // so toolbar/color-picker clicks don't spuriously drop the layer.
            if (containerRef.current && containerRef.current.contains(target)) {
                ctxSetNumSelectedLayers(0);
            }
        }
    }, [selectionEnd, ctxSetNumSelectedWords, ctxSetSelectedWords, ctxSetSelectedStrophes, ctxSetNumSelectedLayers]);

  
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);


    const getSelectionBoxStyle = (): React.CSSProperties => {
        if (!selectionStart || !selectionEnd) return {};
        const left = Math.min(selectionStart.x, selectionEnd.x) - window.scrollX;
        const top = Math.min(selectionStart.y, selectionEnd.y) - window.scrollY;
        const width = Math.abs(selectionStart.x - selectionEnd.x);
        const height = Math.abs(selectionStart.y - selectionEnd.y);
        return {
            left,
            top,
            width,
            height,
            position: 'fixed',
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            border: '1px solid blue',
            pointerEvents: 'none',
            zIndex: 100,
        };
    };


    return {
        isDragging,
        selectionStart,
        selectionEnd,
        clickToDeSelect: clickToDeSelectRef.current,
        handleMouseDown,
        handleMouseUp,
        setClickToDeSelect: (val: boolean) => { clickToDeSelectRef.current = val; },
        containerRef,
        getSelectionBoxStyle
    };

}
