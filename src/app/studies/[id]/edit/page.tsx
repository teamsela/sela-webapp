import Header from "@/components/Header";
import Toolbar from "@/components/Toolbar";

import { notFound } from 'next/navigation';

import { getXataClient } from '@/xata';
import { currentUser } from '@clerk/nextjs';

const xataClient = getXataClient();

export async function generateMetadata({ params }: { params: { id: string } }) {
  const studyId = params.id;

  const thisUser = await currentUser();

  // fetch a study by id from xata
  const study = await xataClient.db.study.filter({ owner: thisUser?.id, id: studyId }).getFirst();

  var studyName = "Not Found";

  if (study) {
    studyName = study.name;
  }

  return {
    title: studyName + " - Sela Bible Poetry",
  }
}

export default async function StudyPage({ params }: { params: { id: string } }) {
  const studyId = params.id;

  const thisUser = await currentUser();

  // fetch a study by id from xata
  const study = await xataClient.db.study.filter({ owner: thisUser?.id, id: studyId }).getFirst();

  if (!study) {
    notFound();
  }

  return (
    <>
    <Header studyName={study.name} studyPassage={study.passage} />
    <Toolbar />
    <main>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

      </div>
    </main>
    </>
  );
}