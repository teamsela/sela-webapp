import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

import { fetchStudyById, fetchPassageData } from '@/lib/actions';
import StudyPane from "@/components/StudyPane";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studyId = "rec_" + id;
  var studyName = "Not Found";

  const [study] = await Promise.all([fetchStudyById(studyId)]);

  if (study.name) {
    studyName = study.name;
  }

  return {
    title: studyName + " - Sela Bible Poetry"
  }
}

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studyId = "rec_" + id;

  const [thisUser, result] = await Promise.all([
    currentUser(),
    fetchPassageData(studyId)
  ]);

  /*
    Authorization check
    Only the owner has write access to this study. Users will be redirected to the view page if the study is public.
  */
  if (!result.study || (thisUser?.id != result.study.owner && !result.study.public)) {
    notFound();
    return redirect(`/study/${id}/view`);
  }

  return (
      <StudyPane passageData={result} inViewMode={false}/>
  );  

}