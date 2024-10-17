import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { DEFAULT_COLOR_FILL, DEFAULT_BORDER_COLOR, DEFAULT_TEXT_COLOR, FormatContext } from '../components/StudyPane/index';
import { getWordById, wordsHasSameColor } from '@/lib/utils';
import { PassageData } from '@/lib/data';
import { ColorActionType, StructureUpdateType } from '@/lib/types';

export const useDragToSelect = (content: PassageData) => {

    const { ctxSelectedHebWords, ctxSetSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedStrophes,
        ctxSetColorFill, ctxSetBorderColor, ctxSetTextColor, ctxStructureUpdateType, ctxSetStructureUpdateType, ctxSetStropheCount, ctxSetSelectedRoots
      } = useContext(FormatContext)

    //drag-to-select module
    ///////////////////////////
    ///////////////////////////
    const [isDragging, setIsDragging] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
    const [clickToDeSelect, setClickToDeSelect] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        setSelectionStart({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
        setSelectionEnd(null);
        //click to de-select
        //if clicked on wordBlock, set status here so de-select function doesnt fire
        //const target used to get rid of error Property 'getAttribute' does not exist on type 'EventTarget'.ts(2339)
        const target = event.target as HTMLElement;
        console.log(target)
        const clickedTarget = target.getAttribute('data-clickType');
        clickedTarget == "clickable" ? setClickToDeSelect(false) : setClickToDeSelect(true);
    };


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
        const rects = containerRef.current.querySelectorAll('.wordBlock');
    
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
            const selectedWord = getWordById(content, wordId);
            if (selectedWord !== null && !ctxSelectedHebWords.includes(selectedWord)) {
            const newArray = [...ctxSelectedHebWords, selectedWord];
            ctxSetSelectedHebWords(newArray);
            ctxSetNumSelectedWords(ctxSelectedHebWords.length);
            }
        }
        });

        ctxSetColorFill(DEFAULT_COLOR_FILL);
        ctxSetBorderColor(DEFAULT_BORDER_COLOR);
        ctxSetTextColor(DEFAULT_TEXT_COLOR);

        if (ctxSelectedHebWords.length >= 1) {
        const lastSelectedWord = ctxSelectedHebWords.at(ctxSelectedHebWords.length-1);
        if (lastSelectedWord) { 
            wordsHasSameColor(ctxSelectedHebWords, ColorActionType.colorFill) && ctxSetColorFill(lastSelectedWord?.colorFill); 
            wordsHasSameColor(ctxSelectedHebWords, ColorActionType.borderColor) && ctxSetBorderColor(lastSelectedWord?.borderColor);
            wordsHasSameColor(ctxSelectedHebWords, ColorActionType.textColor) && ctxSetTextColor(lastSelectedWord?.textColor);
        }
        ctxSetSelectedStrophes([]);
        }

    }, [isDragging, selectionStart, selectionEnd, content, ctxSelectedHebWords, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetSelectedStrophes, ctxSetBorderColor, ctxSetColorFill, ctxSetTextColor]);


    const handleMouseUp = useCallback((event: MouseEvent) => {
        const target  = event.target as HTMLTextAreaElement;
        document.body.style.userSelect = 'text';
        setIsDragging(false);
        //click to de-select
        //if selectionEnd is null it means the mouse didnt move at all
        //otherwise it means it is a drag
        if(target?.classList.contains("RootBlock")){
            return;
        }
        if (!selectionEnd && clickToDeSelect) {
        ctxSetNumSelectedWords(0);
        ctxSetSelectedHebWords([]);
        ctxSetSelectedStrophes([]);
        ctxSetSelectedRoots([]);
        }
    }, [selectionEnd, clickToDeSelect, ctxSetNumSelectedWords, ctxSetSelectedHebWords, ctxSetSelectedStrophes]);


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
        //console.log(`height is ${height}, width is ${width}`);
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
        clickToDeSelect,
        handleMouseDown,
        handleMouseUp,
        setClickToDeSelect,
        containerRef,
        getSelectionBoxStyle
    };

}