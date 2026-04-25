import { APP_URL } from "@/lib/email";

interface RequestAssignedParams {
  assigneeName: string;
  requestCode: string;
  requestTitle: string;
  requestId: number;
  requesterName: string;
}

/** Email sent to the assignee when a request is assigned to them. */
export function requestAssignedTemplate({
  assigneeName,
  requestCode,
  requestTitle,
  requestId,
  requesterName,
}: RequestAssignedParams): { subject: string; html: string } {
  const requestUrl = `${APP_URL}/requests/${requestId}`;

  return {
    subject: `[${requestCode}] A request has been assigned to you — ServiceFlow`,
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
          <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${assigneeName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
            A new service request has been assigned to you. Please review and take action.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Request Code</p>
              <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;font-family:monospace;">${requestCode}</p>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Title</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">${requestTitle}</p>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Submitted by</p>
              <p style="margin:0;color:#374151;font-size:15px;">${requesterName}</p>
            </td></tr>
          </table>
          <a href="${requestUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
            View Request →
          </a>
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
