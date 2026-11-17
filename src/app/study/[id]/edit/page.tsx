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

  if (!result.study) {
    notFound();
  }

  /*
    Authorization check
    Only the owner has write access to this study. Any other user — including
    those opening a public / pre-marked / scriptura study — is redirected to the
    read-only view page, which runs its own access check.
  */
  if (thisUser?.id != result.study.owner) {
    return redirect(`/study/${id}/view`);
  }

  return (
      <StudyPane passageData={result} inViewMode={false}/>
  );

}