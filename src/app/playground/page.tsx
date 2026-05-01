import { fetchPassageData } from '@/lib/actions';
import { PLAYGROUND_STUDY_ID } from '@/lib/data';
import StudyPane from "@/components/StudyPane";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Playground - Sela Bible Poetry"
};

export default async function PlaygroundPage() {
  const result = await fetchPassageData(PLAYGROUND_STUDY_ID);

  return (
    <StudyPane passageData={result} inViewMode={false} isPlayground={true}/>
  );
}
