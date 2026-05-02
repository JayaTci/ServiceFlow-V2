/**
 * Resend email client initialisation.
 * Import `sendEmail` everywhere you need to send emails — never import Resend directly.
 *
 * All sends are fire-and-forget from the caller's perspective.
 * Failures are logged but never thrown, so an email error can't break a user action.
 */
import { Resend } from "resend";
import { logger } from "@backend/utils/logger";
import { env } from "@backend/config/env";

const resend = new Resend(env.RESEND_API_KEY);

const FROM = env.EMAIL_FROM ?? "ServiceFlow <noreply@serviceflow.app>";
const APP_URL = env.NEXT_PUBLIC_APP_URL ?? env.AUTH_URL ?? "http://localhost:3000";

export { APP_URL };

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend.
 * Returns `true` on success, `false` on failure (logs the error).
 */
export async function sendEmail({ to, subject, html }: SendOptions): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not set — email not sent", { subject });
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      logger.error("Resend API error", { subject, error: error.message });
      return false;
    }

    return true;
  } catch (err) {
    logger.error("Failed to send email", { subject, error: String(err) });
    return false;
  }
}
