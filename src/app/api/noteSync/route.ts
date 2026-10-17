import { fetchStudyById, updateStudyNotes } from "@/lib/actions";
import { sanitizeStudyNotes } from "@/lib/richText";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_PAYLOAD_BYTES = 500_000; // 500 KB cap on stored notes

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let content: { studyId?: unknown; text?: unknown };
  try {
    content = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof content?.studyId !== "string" || typeof content?.text !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (content.text.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Notes too large" }, { status: 413 });
  }

  // Validate + sanitize BEFORE touching the DB: reject malformed input early and
  // never trust the client-provided rich-text doc (the editor schema is only the
  // first gate; a crafted POST bypasses it entirely).
  let sanitized: string;
  try {
    sanitized = sanitizeStudyNotes(content.text);
  } catch {
    return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
  }

  try {
    const study = await fetchStudyById(content.studyId);
    if (!study) return NextResponse.json({ error: "No study found" }, { status: 404 });
    if (study.owner !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await updateStudyNotes(study.id, sanitized);
    return NextResponse.json({ message: "Saved" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Database Error" }, { status: 500 });
  }
}
