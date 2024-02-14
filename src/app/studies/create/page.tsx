import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import StudyForm from "@/components/CreateStudyForm";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create Study | Sela Bible Poetry",
  description: "Digging for Gems in Bible Poetry",
  // other metadata
};

export default function CreateStudyPage() {
    
  return (
    <>
      <Breadcrumb pageName="Create Study" />

      <div className="flex flex-col gap-10">
          <StudyForm />
      </div>
    </>
  );
}