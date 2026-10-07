import { timingSafeEqual } from "node:crypto";

/** Compare a cron bearer header without a content-dependent string comparison. */
export function isCronAuthorizationValid(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!authorization || !secret) return false;

  const actual = Buffer.from(authorization, "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Return only a same-origin absolute path, or the supplied fallback. */
export function safeInternalPath(
  candidate: string | null,
  fallback: string,
  origin: string,
): string {
  const trustedOrigin = new URL(origin).origin;
  const resolvePath = (value: string | null): string | null => {
    if (
      !value ||
      !value.startsWith("/") ||
      value.startsWith("//") ||
      value.includes("\\")
    ) {
      return null;
    }

    try {
      const resolved = new URL(value, trustedOrigin);
      if (resolved.origin !== trustedOrigin) return null;
      return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
      return null;
    }
  };

  return resolvePath(candidate) ?? resolvePath(fallback) ?? "/";
}
