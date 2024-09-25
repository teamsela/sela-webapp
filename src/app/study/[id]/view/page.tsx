import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs';

import { fetchStudyById, fetchPassageContent, fetchPassageContent2 } from '@/lib/actions';
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

  const [thisUser, study, passageContent, passageContent2] = await Promise.all([
    currentUser(),
    fetchStudyById(studyId),
    fetchPassageContent(studyId),
    fetchPassageContent2(studyId)
  ]);

  if (!study || (thisUser?.id != study.owner && !study.public)) {
    notFound();
  }

  return (
    // <StudyPane study={study} content={passageContent} inViewMode={true}/>
    <StudyPane study={study} content={passageContent2} inViewMode={true}/>
  );

}