'use client';

import { ChangeEvent, useEffect, useRef, useState, useCallback } from "react";
import { updateStudyName } from '@/lib/actions';
import { StudyData } from '@/lib/data';


const Title = ({ study, inViewMode }:{
    study: StudyData,
    inViewMode: boolean
}) => {
    const [title, setTitle] = useState(study.name);
    const [isEditing, setIsEditing] = useState(false);

    const titleRef = useRef<HTMLDivElement>(null);
    const MAX_TITLE_LENGTH = 40;
  
    const handleSaveClick = useCallback(() => {
      setIsEditing(false);
      updateStudyName(study.id, title);
    }, [study.id, title]);
        
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          // when clicked outside of the text box save the change
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
      !inViewMode && setIsEditing(true);
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
          <div>
            <h1 className="text-title-sm" onClick={handleEditClick}>{truncateString(title, MAX_TITLE_LENGTH)}</h1>
          </div>
        )}
      </div>
    );
  };
  
  export default Title;
  