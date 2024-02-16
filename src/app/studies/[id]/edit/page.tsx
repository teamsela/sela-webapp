import { notFound } from 'next/navigation';

import { getXataClient } from '@/xata';
import { currentUser } from '@clerk/nextjs';

const xataClient = getXataClient();

export default async function StudyPage({ params }: { params: { id: string } }) {
  const studyId = params.id;

  const thisUser = await currentUser();

  // fetch a study by id from xata
  const study = await xataClient.db.study.filter({ owner: thisUser?.id, id: studyId }).getFirst();

  if (!study) {
    notFound();
  }
    
  return (
    <main>
      <h1>{study.name}</h1>
      <h4>{study.passage}</h4>
    </main>
  );
}