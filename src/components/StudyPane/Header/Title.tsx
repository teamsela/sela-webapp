'use client';

import { ChangeEvent, useContext, useEffect, useRef, useState, useCallback } from "react";
import { updateStudyName } from '@/lib/actions';
import { StudyData } from '@/lib/data';
import { FormatContext } from '../index';

const Title = ({ study }:{
    study: StudyData
}) => {
    const [title, setTitle] = useState(study.name);
    const [isEditing, setIsEditing] = useState(false);
    const [maxTitleLength, setMaxTitleLength] = useState(40);
    
    const { ctxInViewMode } = useContext(FormatContext);
    const titleRef = useRef<HTMLDivElement>(null);

    // Update maxTitleLength based on window width
    useEffect(() => {
        const updateMaxLength = () => {
            const windowWidth = window.innerWidth;
            
            // Gradually reduce max length as window gets smaller
            if (windowWidth >= 1536) {  // 2xl
              setMaxTitleLength(60);
          } else if (windowWidth >= 1280) {  // xl
              setMaxTitleLength(50);
          } else if (windowWidth >= 1024) {  // lg
              setMaxTitleLength(40);
          } else if (windowWidth >= 768) {  // md
              setMaxTitleLength(35);
          } else if (windowWidth >= 640) {  // sm
              setMaxTitleLength(30);
          } else if (windowWidth >= 480) {  // xs
              setMaxTitleLength(25);
          } else {  // smaller than xs
              setMaxTitleLength(20);
          }
        };

        // Initial calculation
        updateMaxLength();

        // Add resize listener
        window.addEventListener('resize', updateMaxLength);
        
        // Cleanup
        return () => window.removeEventListener('resize', updateMaxLength);
    }, []);

    const handleSaveClick = useCallback(() => {
        setIsEditing(false);
        if (title.trim() == "") {
            alert("Error: study title can't be empty or blank.")
            setTitle(study.name);
        } else {
            updateStudyName(study.id, title);
        }
    }, [study.id, title]);
        
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
                handleSaveClick();
            }
        };
    
        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, title, handleSaveClick]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    };

    const handleEditClick = () => {
        !ctxInViewMode && setIsEditing(true);
    };

    function truncateString(str: string, maxLength: number): string {
        if (str.length <= maxLength) {
            return str;
        } else {
            return str.slice(0, maxLength) + '...';
        }
    }
  
    return (
        <div ref={titleRef} className="block">
            {isEditing ? (
                <div>
                    <input
                        className="text-title-sm"
                        type="text"
                        value={title}
                        size={Math.floor(window.innerWidth/50)}
                        onChange={handleInputChange}
                        autoFocus
                        onBlur={handleSaveClick}
                    />
                </div>
            ) : (
                <div className="flex">
                    <h1 
                        className="text-title-sm whitespace-nowrap overflow-hidden text-ellipsis"
                        onClick={handleEditClick}
                    >
                        {truncateString(title, maxTitleLength)}
                    </h1>
                </div>
            )}
        </div>
    );
};

export default Title;