import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs';

import { fetchStudyById, fetchPassageContent } from '@/lib/actions';
import Editor from "@/components/Editor";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const studyId = "rec_" + params.id;
  var studyName = "Not Found";

  const [study] = await Promise.all([fetchStudyById(studyId)]);

  if (study.name) {
    studyName = study.name;
  }

  return {
    title: studyName + " - Sela Bible Poetry",
  }
}

export default async function StudyPage({ params }: { params: { id: string } }) {
  const studyId = "rec_" + params.id;

  const [thisUser, study, passageContent] = await Promise.all([
    currentUser(),
    fetchStudyById(studyId),
    fetchPassageContent(studyId)
  ]);

  if (!study) {
    notFound();
  }

  // only owner has write access to the study
  const editable = thisUser?.id === study.owner;

    /* TODO -
     Add authorization check: any user can read if this study is public 
  */

  return (
      <Editor study={study} content={passageContent} isEditMode ={editable}/>
  );

}