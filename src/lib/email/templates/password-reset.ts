import { APP_URL } from "@/lib/email";

interface PasswordResetParams {
  userName: string;
  resetToken: string;
}

/** Email containing the password reset link. Token expires in 1 hour. */
export function passwordResetTemplate({
  userName,
  resetToken,
}: PasswordResetParams): { subject: string; html: string } {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  return {
    subject: "Reset your ServiceFlow password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr><td style="background:#4f46e5;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">ServiceFlow</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${userName}</strong>,</p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:15px;line-height:1.6;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <p style="margin:0 0 28px;color:#9ca3af;font-size:13px;">
            This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
            Reset Password →
          </a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
            Or copy this link: <span style="color:#4f46e5;word-break:break-all;">${resetUrl}</span>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">ServiceFlow · <a href="${APP_URL}" style="color:#6b7280;">serviceflow.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  };
}
