import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { claimAnonymousStudy } from "@/lib/actions";
import { ANONYMOUS_SESSION_COOKIE } from "@/lib/anonymous";

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams?: { studyId?: string };
}) {
  const user = await currentUser();

  if (!user) {
    return redirect("/");
  }

  const studyId = searchParams?.studyId;
  const anonymousSessionId = cookies().get(ANONYMOUS_SESSION_COOKIE)?.value;

  if (studyId && anonymousSessionId) {
    const normalizedStudyId = studyId.startsWith("rec_") ? studyId : `rec_${studyId}`;
    const claimedStudyId = await claimAnonymousStudy(normalizedStudyId, anonymousSessionId);

    if (claimedStudyId) {
      return redirect(`/study/${claimedStudyId.replace(/^rec_/, "")}/edit`);
    }
  }

  return redirect("/dashboard/home");
}
