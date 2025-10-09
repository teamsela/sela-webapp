import { fetchStudyById, updateStudyNotes } from "@/lib/actions";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  const content: {studyId:string, text: string} = await req.json();
  if (!userId) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  try{
    const study = await fetchStudyById(content.studyId);
    if (!study) return NextResponse.json({error: 'No study found'}, {status: 404});
    if (study.owner !== userId) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    if (study.owner == userId ) {
      if (!study.notes) {
        updateStudyNotes(study.id, content.text);
        return NextResponse.json({ message: "Saved" }, { status: 200 });
      }
      const parsedNotes = JSON.parse(study.notes);
      const parsedRequestNotes = JSON.parse(content.text);
      updateStudyNotes(study.id, JSON.stringify(parsedRequestNotes))
      return NextResponse.json({ message: "Saved" }, { status: 200 });
  }
  } catch (error) {
    return NextResponse.json({ message: "Database Error"}, { status: 404})
  }
};
