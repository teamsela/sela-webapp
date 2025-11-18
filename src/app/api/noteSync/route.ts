import { fetchStudyById, updateStudyNotes } from "@/lib/actions";
import { StudyNotes } from "@/lib/types";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

type NoteSyncPayload = {
  studyId?: string;
  text?: string;
  stropheNotesActive?: boolean;
};

const parseNotes = (raw: string | null | undefined): Partial<StudyNotes> | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<StudyNotes>;
  } catch {
    return null;
  }
};

const normalizeNotes = (notes: Partial<StudyNotes>): StudyNotes => ({
  main: typeof notes.main === "string" ? notes.main : "",
  strophes: Array.isArray(notes.strophes) ? notes.strophes : [],
  ...(typeof notes.stropheNotesActive === "boolean"
    ? { stropheNotesActive: notes.stropheNotesActive }
    : {}),
});

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  const content = (await req.json()) as NoteSyncPayload;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!content?.studyId) {
    return NextResponse.json({ error: "Missing studyId" }, { status: 400 });
  }

  try {
    const study = await fetchStudyById(content.studyId);
    if (!study) return NextResponse.json({ error: "No study found" }, { status: 404 });
    if (study.owner !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingNotes = parseNotes(study.notes) ?? { main: "", strophes: [] };
    const incomingNotes = parseNotes(content.text ?? "") ?? existingNotes;

    const mergedNotes: Partial<StudyNotes> = {
      ...existingNotes,
      ...incomingNotes,
    };

    if (typeof content.stropheNotesActive === "boolean") {
      mergedNotes.stropheNotesActive = content.stropheNotesActive;
    }

    const normalized = normalizeNotes(mergedNotes);
    await updateStudyNotes(study.id, JSON.stringify(normalized));
    return NextResponse.json({ message: "Saved" }, { status: 200 });
  } catch (error) {
    console.error("Database Error", error);
    return NextResponse.json({ message: "Database Error" }, { status: 500 });
  }
}
