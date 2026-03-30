import { NextRequest, NextResponse } from "next/server";

import { ensureAnonymousPsalmStudy } from "@/lib/actions";
import { ANONYMOUS_SESSION_COOKIE } from "@/lib/anonymous";

const createSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export async function GET(request: NextRequest) {
  let anonymousSessionId = request.cookies.get(ANONYMOUS_SESSION_COOKIE)?.value;

  if (!anonymousSessionId) {
    anonymousSessionId = createSessionId();
  }

  const studyId = await ensureAnonymousPsalmStudy(anonymousSessionId);
  const response = NextResponse.redirect(new URL(`/study/${studyId.replace(/^rec_/, "")}/edit`, request.url));

  response.cookies.set(ANONYMOUS_SESSION_COOKIE, anonymousSessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
