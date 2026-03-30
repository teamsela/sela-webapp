import { fetchStudyById, updateStudyNotes } from "@/lib/actions";
import { getAnonymousOwnerSessionId, ANONYMOUS_SESSION_COOKIE } from "@/lib/anonymous";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  const content: { studyId: string; text: string } = await req.json();

  try {
    const study = await fetchStudyById(content.studyId);
    if (!study) return NextResponse.json({ error: "No study found" }, { status: 404 });

    const anonymousSessionId = req.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value;
    const ownerAnonymousSessionId = getAnonymousOwnerSessionId(study.owner);

    const isAuthorized =
      study.owner === userId ||
      Boolean(ownerAnonymousSessionId && anonymousSessionId && ownerAnonymousSessionId === anonymousSessionId);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    updateStudyNotes(study.id, content.text);
    return NextResponse.json({ message: "Saved" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Database Error" }, { status: 404 });
  }
}
