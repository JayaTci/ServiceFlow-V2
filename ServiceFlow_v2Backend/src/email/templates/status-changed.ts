import { APP_URL } from "@backend/email";

interface StatusChangedParams {
  requesterName: string;
  requestCode: string;
  requestTitle: string;
  requestId: number;
  oldStatus: string;
  newStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
};

/** Email sent to the requester when the status of their request changes. */
export function statusChangedTemplate({
  requesterName,
  requestCode,
  requestTitle,
  requestId,
  oldStatus,
  newStatus,
}: StatusChangedParams): { subject: string; html: string } {
  const requestUrl = `${APP_URL}/requests/${requestId}`;
  const newLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const oldLabel = STATUS_LABELS[oldStatus] ?? oldStatus;

  return {
    subject: `[${requestCode}] Status updated to "${newLabel}" — ServiceFlow`,
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
          <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi <strong>${requesterName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
            Your request <strong>${requestCode}</strong> has been updated.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Request</p>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;">${requestTitle}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:24px;">
                    <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Previous</p>
                    <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:4px;font-size:13px;">${oldLabel}</span>
                  </td>
                  <td style="padding-right:16px;color:#9ca3af;font-size:18px;padding-top:12px;">→</td>
                  <td>
                    <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">New Status</p>
                    <span style="background:#4f46e5;color:#ffffff;padding:4px 10px;border-radius:4px;font-size:13px;">${newLabel}</span>
                  </td>
                </tr>
              </table>
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
