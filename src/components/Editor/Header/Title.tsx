'use client';

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { updateStudyName } from '@/lib/actions';


const Title = ({ studyName, studyId }:{
    studyName: string,
    studyId: string
}) => {
    const [title, setTitle] = useState(studyName);
    const [isEditing, setIsEditing] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
                console.log("clicked");
                console.log(title);
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
      }, [isEditing, title]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      setTitle(event.target.value);
    };
  
    const handleSaveClick = async () => {
      setIsEditing(false);
      console.log(studyId);
      console.log(title);
      const [study] = await Promise.all([updateStudyName(studyId, title)]);
      console.log(study);
    };
  
    const handleEditClick = () => {
      setIsEditing(true);
    };
  
    return (
      <div ref={titleRef} className="block">
        {isEditing ? (
          <div>
            <input
              type="text"
              value={title}
              onChange={handleInputChange}
              autoFocus
              onBlur={handleSaveClick}
            />
          </div>
        ) : (
          <div>
            <h1 onClick={handleEditClick}>{title}</h1>
          </div>
        )}
      </div>
    );
  };
  
  export default Title;
  