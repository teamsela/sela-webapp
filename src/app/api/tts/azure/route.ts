import { NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import {
  getAzureSpeechCredentials,
  isAzureSpeechConfigured,
} from "@/lib/azureSpeech";

type AzureTtsRequest = {
  speakingRate?: number;
  text?: string;
};

type AzureWordBoundary = {
  audioOffsetMs: number;
  text: string;
  textOffset: number;
  wordLength: number;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const normalizeSpeakingRate = (value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 1;
  }

  return Math.min(1.5, Math.max(0.5, value));
};

const toSsmlRate = (value: number) => `${Math.round((value - 1) * 100)}%`;

const createAbortError = () => {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
};

const isAbortLikeError = (error: unknown) =>
  error instanceof Error &&
  (error.name === "AbortError" || error.message === "aborted");

const synthesizeAzureSpeech = async (
  text: string,
  speakingRate: number,
  signal: AbortSignal,
) => {
  const credentials = getAzureSpeechCredentials();
  if (!credentials) {
    throw new Error("Azure Speech is not configured.");
  }

  if (signal.aborted) {
    throw createAbortError();
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    credentials.key,
    credentials.region,
  );
  speechConfig.speechSynthesisLanguage = credentials.languageCode;
  speechConfig.speechSynthesisVoiceName = credentials.voiceName;
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
  const wordBoundaries: AzureWordBoundary[] = [];

  return await new Promise<{
    audioData: Buffer;
    wordBoundaries: AzureWordBoundary[];
  }>((resolve, reject) => {
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      signal.removeEventListener("abort", abortHandler);
      synthesizer.close();
      callback();
    };

    const abortHandler = () => {
      finish(() => reject(createAbortError()));
    };

    signal.addEventListener("abort", abortHandler, { once: true });

    synthesizer.wordBoundary = (_sender, event) => {
      if (event.boundaryType !== sdk.SpeechSynthesisBoundaryType.Word) {
        return;
      }

      wordBoundaries.push({
        audioOffsetMs: event.audioOffset / 10_000,
        text: event.text,
        textOffset: event.textOffset,
        wordLength: event.wordLength,
      });
    };

    const ssml = [
      "<speak version='1.0' xmlns='https://www.w3.org/2001/10/synthesis' xml:lang='he-IL'>",
      `  <voice name='${escapeXml(credentials.voiceName)}'>`,
      `    <prosody rate='${toSsmlRate(speakingRate)}'>${escapeXml(text)}</prosody>`,
      "  </voice>",
      "</speak>",
    ].join("\n");

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        finish(() => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve({
              audioData: Buffer.from(result.audioData),
              wordBoundaries,
            });
            return;
          }

          const cancellation = sdk.CancellationDetails.fromResult(result);
          reject(
            new Error(
              cancellation.errorDetails ||
                "Azure Speech synthesis was canceled.",
            ),
          );
        });
      },
      (error) => {
        finish(() => reject(new Error(error)));
      },
    );
  });
};

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isAzureSpeechConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isAzureSpeechConfigured()) {
    return NextResponse.json(
      { error: "Azure Speech is not configured." },
      { status: 503 },
    );
  }

  let payload: AzureTtsRequest;

  try {
    payload = (await request.json()) as AzureTtsRequest;
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
    const result = await synthesizeAzureSpeech(
      text,
      normalizeSpeakingRate(payload.speakingRate),
      request.signal,
    );

    return NextResponse.json({
      audioContent: result.audioData.toString("base64"),
      contentType: "audio/mpeg",
      wordBoundaries: result.wordBoundaries,
    });
  } catch (error) {
    if (request.signal.aborted || isAbortLikeError(error)) {
      return new Response(null, { status: 499 });
    }

    const message =
      error instanceof Error ? error.message : "Unexpected Azure Speech error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
