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

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ practice?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const studyId = "rec_" + id;

  const [thisUser, result] = await Promise.all([
    currentUser(),
    fetchPassageData(studyId)
  ]);

  /*
    Authorization check
    A study is readable by anyone when it is listed on one of the browsable
    dashboards: public, pre-marked (model), scriptura or tutorial. Checking `public`
    alone 404s pre-marked / scriptura studies that were never flagged public,
    even though those dashboards link straight here.
  */
  const isSharedStudy =
    !!result.study && (result.study.public || result.study.model || result.study.scriptura || result.study.tutorial);

  if (!result.study || (thisUser?.id != result.study.owner && !isSharedStudy)) {
    notFound();
  }

  const isOwner = thisUser?.id == result.study.owner;

  /*
    Tutorials open in practice mode for everyone but the owner: every tool is
    available, nothing is saved, and the guided tour runs. The owner can
    preview exactly that with ?practice=1; otherwise the owner edits.
  */
  if (result.study.tutorial && (!isOwner || sp.practice === "1")) {
    return (
      <StudyPane passageData={result} inViewMode={false} practiceMode />
    );
  }

  if (isOwner) {
    return redirect(`/study/${id}/edit`);
  }

  return (
    <StudyPane passageData={result} inViewMode={true}/>
  );

}