import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs';
import { cookies } from 'next/headers';

import { fetchStudyById, fetchPassageData } from '@/lib/actions';
import { getAnonymousOwnerSessionId, ANONYMOUS_SESSION_COOKIE } from '@/lib/anonymous';
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

  const [thisUser, result] = await Promise.all([
    currentUser(),
    fetchPassageData(studyId)
  ]);

  const anonymousSessionId = cookies().get(ANONYMOUS_SESSION_COOKIE)?.value;
  const studyAnonymousSessionId = getAnonymousOwnerSessionId(result.study?.owner);
  const isAnonymousOwner = Boolean(
    !thisUser &&
      anonymousSessionId &&
      studyAnonymousSessionId &&
      anonymousSessionId === studyAnonymousSessionId,
  );

  /*
    Authorization check
    Only the owner has write access to this study.
  */
  if (!result.study || (thisUser?.id != result.study.owner && !isAnonymousOwner)) {
    notFound();
    return redirect(`/study/${params.id}/view`);
  }

  return (
      <StudyPane passageData={result} inViewMode={false}/>
  );  

}