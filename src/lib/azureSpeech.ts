const DEFAULT_LANGUAGE_CODE = "he-IL";
const DEFAULT_VOICE_NAME = "he-IL-HilaNeural";

export const AZURE_HEBREW_VOICE_OPTIONS = [
  {
    id: "he-IL-HilaNeural",
    label: "Hila",
  },
  {
    id: "he-IL-AvriNeural",
    label: "Avri",
  },
] as const;

export type AzureHebrewVoiceName = (typeof AZURE_HEBREW_VOICE_OPTIONS)[number]["id"];

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

  const trimmed = value.trim().replace(/,$/, "");

  return stripWrappingQuotes(trimmed);
};

export const getAzureSpeechCredentials = () => {
  const key = normalizeEnvValue(process.env.AZURE_SPEECH_KEY);
  const region = normalizeEnvValue(process.env.AZURE_SPEECH_REGION);
  const voiceName =
    normalizeEnvValue(process.env.AZURE_SPEECH_VOICE_NAME) || DEFAULT_VOICE_NAME;

  if (!key || !region) {
    return null;
  }

  return {
    key,
    languageCode: DEFAULT_LANGUAGE_CODE,
    region,
    voiceName,
  };
};

export const isAzureSpeechConfigured = () => Boolean(getAzureSpeechCredentials());

export const getAzureSpeechVoiceOptions = () => AZURE_HEBREW_VOICE_OPTIONS;

export const isAzureSpeechVoiceName = (
  value: string | undefined,
): value is AzureHebrewVoiceName =>
  Boolean(
    value &&
      AZURE_HEBREW_VOICE_OPTIONS.some((voiceOption) => voiceOption.id === value),
  );
