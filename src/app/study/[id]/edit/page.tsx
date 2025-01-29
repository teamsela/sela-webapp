import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs';

import { fetchStudyById, fetchPassageContentOld, fetchPassageData } from '@/lib/actions';
import StudyPane from "@/components/StudyPane";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const studyId = "rec_" + params.id;
  var studyName = "Not Found";

  const [study] = await Promise.all([fetchStudyById(studyId)]);

  if (study.name) {
    studyName = study.name;
  }

  return {
    title: studyName + " - Sela Bible Poetry"
  }
}

export default async function StudyPage({ params }: { params: { id: string } }) {
  const studyId = "rec_" + params.id;

  const [thisUser, passageContentOld, result] = await Promise.all([
    currentUser(),
    fetchPassageContentOld(studyId),
    fetchPassageData(studyId)
  ]);

  /*
    Authorization check
    Only the owner has write access to this study. Users will be redirected to the view page if the study is public. 
  */
  if (!result.study || (thisUser?.id != result.study.owner && !result.study.public)) {
    notFound();
    return redirect(`/study/${params.id}/view`);
  }

  return (
      <StudyPane passageData={result} content={passageContentOld} inViewMode={false}/>
  );  

}