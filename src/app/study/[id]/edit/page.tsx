import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs';

import { fetchStudyById, fetchPassageContent } from '@/lib/data';
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
    currentUser,
    fetchStudyById(studyId),
    fetchPassageContent(studyId)
  ]);

  /* TODO -
     Add authorization check
     Only the owner has write access to this study. Any users can read if this study is public 
  */

  if (!study) {
    notFound();
  }

  return (
      <Editor study={study} studyId={studyId} content={passageContent} />
  );

}