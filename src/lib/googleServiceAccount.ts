import { createPrivateKey, createSign } from "crypto";

type AccessTokenCache = {
  accessToken: string;
  expiresAt: number;
};

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TTS_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const ACCESS_TOKEN_BUFFER_MS = 60_000;

let cachedAccessToken: AccessTokenCache | null = null;

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

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

const normalizePrivateKey = (value: string | undefined) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/\\n/g, "\n");
};

const getServiceAccountCredentials = () => {
  const clientEmail = normalizeEnvValue(process.env.GOOGLE_TTS_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.GOOGLE_TTS_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    return null;
  }

  return {
    clientEmail,
    privateKey,
  };
};

const createSignedJwt = (clientEmail: string, privateKey: string) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_TTS_SCOPE,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${encodedHeader}.${encodedPayload}`);
  signer.end();

  const signingKey = createPrivateKey({
    key: privateKey,
    format: "pem",
  });
  const signature = signer.sign(signingKey);

  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`;
};

export const isGoogleTtsConfigured = () => Boolean(getServiceAccountCredentials());

export const getGoogleAccessToken = async () => {
  if (
    cachedAccessToken &&
    cachedAccessToken.expiresAt - ACCESS_TOKEN_BUFFER_MS > Date.now()
  ) {
    return cachedAccessToken.accessToken;
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    throw new Error("Google TTS credentials are not configured.");
  }

  const assertion = createSignedJwt(
    credentials.clientEmail,
    credentials.privateKey,
  );

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth token request failed: ${errorText}`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAccessToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return payload.access_token;
};
