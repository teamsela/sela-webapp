import { NextResponse } from "next/server";

import {
  getGoogleAccessToken,
  isGoogleTtsConfigured,
} from "@/lib/googleServiceAccount";

const GOOGLE_TTS_API_URL =
  "https://texttospeech.googleapis.com/v1/text:synthesize";
const DEFAULT_LANGUAGE_CODE = "he-IL";

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const normalizeEnvValue = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  return stripWrappingQuotes(value.trim());
};

const DEFAULT_VOICE_NAME = normalizeEnvValue(process.env.GOOGLE_TTS_VOICE_NAME) || "Kore";
const DEFAULT_MODEL_NAME =
  normalizeEnvValue(process.env.GOOGLE_TTS_MODEL) || "gemini-2.5-flash-tts";
const DEFAULT_PROJECT_ID = normalizeEnvValue(process.env.GOOGLE_TTS_PROJECT_ID);

type GeminiTtsRequest = {
  speakingRate?: number;
  text?: string;
};

const isAbortLikeError = (error: unknown) =>
  error instanceof Error &&
  (error.name === "AbortError" ||
    error.message === "aborted" ||
    "code" in error);

const normalizeSpeakingRate = (value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 1;
  }

  return Math.min(1.5, Math.max(0.5, value));
};

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isGoogleTtsConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isGoogleTtsConfigured()) {
    return NextResponse.json(
      { error: "Google Gemini TTS is not configured." },
      { status: 503 },
    );
  }

  let payload: GeminiTtsRequest;

  try {
    payload = (await request.json()) as GeminiTtsRequest;
  } catch (error) {
    if (request.signal.aborted || isAbortLikeError(error)) {
      return new Response(null, { status: 499 });
    }

    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = payload.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const response = await fetch(GOOGLE_TTS_API_URL, {
      method: "POST",
      signal: request.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(DEFAULT_PROJECT_ID
          ? { "x-goog-user-project": DEFAULT_PROJECT_ID }
          : {}),
      },
      body: JSON.stringify({
        input: {
          text,
        },
        voice: {
          languageCode: DEFAULT_LANGUAGE_CODE,
          name: DEFAULT_VOICE_NAME,
          modelName: DEFAULT_MODEL_NAME,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: normalizeSpeakingRate(payload.speakingRate),
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gemini TTS synthesis failed: ${errorText}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as { audioContent?: string };
    if (!data.audioContent) {
      return NextResponse.json(
        { error: "Gemini TTS returned no audio content." },
        { status: 502 },
      );
    }

    const audioBuffer = Buffer.from(data.audioContent, "base64");

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (request.signal.aborted || isAbortLikeError(error)) {
      return new Response(null, { status: 499 });
    }

    const message =
      error instanceof Error ? error.message : "Unexpected Gemini TTS error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
