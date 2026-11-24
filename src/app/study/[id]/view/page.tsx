import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

import { fetchStudyById, fetchPassageData } from '@/lib/actions';
import { canViewStudyViaClassroom } from '@/lib/classroomActions';
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
    A study is readable by anyone when it is listed on one of the browsable
    dashboards: public, pre-marked (model) or scriptura. Checking `public`
    alone 404s pre-marked / scriptura studies that were never flagged public,
    even though those dashboards link straight here.
  */
  const isSharedStudy =
    !!result.study && (result.study.public || result.study.model || result.study.scriptura);

  // Studies shared into a classroom are readable by that classroom's members.
  const isClassroomStudy =
    !!result.study && !isSharedStudy && !!thisUser && thisUser.id != result.study.owner
      ? await canViewStudyViaClassroom(studyId)
      : false;

  if (!result.study || (thisUser?.id != result.study.owner && !isSharedStudy && !isClassroomStudy)) {
    notFound();
  }
  else if (thisUser?.id == result.study.owner) {
    return redirect(`/study/${id}/edit`);
  }

  return (
    <StudyPane passageData={result} inViewMode={true}/>
  );

}