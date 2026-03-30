export const ANONYMOUS_OWNER_PREFIX = "anon:";
export const ANONYMOUS_SESSION_COOKIE = "sela_anon_session";

export const makeAnonymousOwner = (sessionId: string) => `${ANONYMOUS_OWNER_PREFIX}${sessionId}`;

export const isAnonymousOwner = (owner: string | null | undefined) =>
  Boolean(owner && owner.startsWith(ANONYMOUS_OWNER_PREFIX));

export const getAnonymousOwnerSessionId = (owner: string | null | undefined) =>
  owner && owner.startsWith(ANONYMOUS_OWNER_PREFIX)
    ? owner.slice(ANONYMOUS_OWNER_PREFIX.length)
    : null;
