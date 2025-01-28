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

  const [thisUser, passageContent, result] = await Promise.all([
    currentUser(),
    //fetchStudyById(studyId),
    fetchPassageContentOld(studyId),
    fetchPassageData(studyId)
  ]);

  if (!result.study || (thisUser?.id != result.study.owner && !result.study.public)) {
    notFound();
  }

  return (
    <StudyPane study={result.study} passageData={result} content={passageContent} inViewMode={true}/>
  );

}