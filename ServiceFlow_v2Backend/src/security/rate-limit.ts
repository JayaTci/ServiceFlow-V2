import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@database/client";
import { securityRateLimits } from "@database/schema";

type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

function rateLimitKey(scope: string, identifier: string) {
  return crypto
    .createHash("sha256")
    .update(`${scope}:${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export async function checkRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const key = rateLimitKey(scope, identifier);
  const now = new Date();

  const [existing] = await db
    .select({
      attempts: securityRateLimits.attempts,
      windowStart: securityRateLimits.windowStart,
    })
    .from(securityRateLimits)
    .where(eq(securityRateLimits.key, key))
    .limit(1);

  if (!existing || now.getTime() - existing.windowStart.getTime() >= windowMs) {
    await db
      .insert(securityRateLimits)
      .values({ key, attempts: 1, windowStart: now, updatedAt: now })
      .onConflictDoUpdate({
        target: securityRateLimits.key,
        set: { attempts: 1, windowStart: now, updatedAt: now },
      });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.attempts >= limit) {
    const retryAfterSeconds = Math.ceil(
      (windowMs - (now.getTime() - existing.windowStart.getTime())) / 1000
    );
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  await db
    .update(securityRateLimits)
    .set({ attempts: existing.attempts + 1, updatedAt: now })
    .where(eq(securityRateLimits.key, key));

  return { allowed: true, remaining: limit - existing.attempts - 1 };
}

export async function resetRateLimit(scope: string, identifier: string) {
  await db
    .delete(securityRateLimits)
    .where(eq(securityRateLimits.key, rateLimitKey(scope, identifier)));
}
