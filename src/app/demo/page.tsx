import { fetchPassageData } from '@/lib/actions';
import { DEMO_STUDY_ID } from '@/lib/data';
import StudyPane from "@/components/StudyPane";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Demo - Sela Bible Poetry"
};

export default async function DemoPage() {
  const result = await fetchPassageData(DEMO_STUDY_ID);

  return (
    <StudyPane passageData={result} inViewMode={false} isDemo={true}/>
  );
}
