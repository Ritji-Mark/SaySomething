// Plain, forest-themed transactional emails. Each builder returns
// { subject, html, text }. Report links point at the frontend (APP_ORIGIN).

const appOrigin = () => process.env.APP_ORIGIN || "http://localhost:5173";

// Escape user-supplied strings before interpolating into HTML.
function esc(value) {
    return String(value == null ? "" : value).replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
}

function layout(subtitle, bodyHtml) {
    return `<!doctype html>
<html>
  <body style="margin:0;background:#203d28;padding:24px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#274a33;border:1px solid #3a684b;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:24px 28px;">
            <h1 style="margin:0 0 2px;color:#ffffff;font-size:20px;">SaySomething</h1>
            <p style="margin:0 0 20px;color:#a7d7c5;font-size:13px;">${esc(subtitle)}</p>
            ${bodyHtml}
          </td></tr>
        </table>
        <p style="color:#a7d7c5;font-size:11px;margin-top:16px;">You're receiving this because you have a SaySomething account.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href, label) {
    return `<a href="${href}" style="display:inline-block;background:#a7d7c5;color:#203d28;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">${label}</a>`;
}

function statusChangedEmail({ name, reportNumber, statusName, reportId }) {
    const url = `${appOrigin()}/reports/${reportId}`;
    const subject = `Report ${reportNumber} is now "${statusName}"`;
    const html = layout(
        "Report status updated",
        `<p style="color:#ffffff;font-size:15px;margin:0 0 12px;">Hi ${esc(name) || "there"},</p>
         <p style="color:#e8f3ee;font-size:14px;margin:0 0 20px;">Your report <strong>${esc(reportNumber)}</strong> is now <strong>"${esc(statusName)}"</strong>.</p>
         <p style="margin:0;">${button(url, "View report")}</p>`
    );
    const text = `Hi ${name || "there"},\n\nYour report ${reportNumber} is now "${statusName}".\n\nView it: ${url}\n`;
    return { subject, html, text };
}

function reportAssignedEmail({ name, reportNumber, authorityName, reportId }) {
    const url = `${appOrigin()}/reports/${reportId}`;
    const subject = `Report ${reportNumber} has been assigned`;
    const html = layout(
        "Report assigned",
        `<p style="color:#ffffff;font-size:15px;margin:0 0 12px;">Hi ${esc(name) || "there"},</p>
         <p style="color:#e8f3ee;font-size:14px;margin:0 0 20px;">Your report <strong>${esc(reportNumber)}</strong> has been assigned to <strong>${esc(authorityName)}</strong>.</p>
         <p style="margin:0;">${button(url, "View report")}</p>`
    );
    const text = `Hi ${name || "there"},\n\nYour report ${reportNumber} has been assigned to ${authorityName}.\n\nView it: ${url}\n`;
    return { subject, html, text };
}

function passwordResetEmail({ name, resetUrl }) {
    const subject = "Reset your SaySomething password";
    const html = layout(
        "Password reset",
        `<p style="color:#ffffff;font-size:15px;margin:0 0 12px;">Hi ${esc(name) || "there"},</p>
         <p style="color:#e8f3ee;font-size:14px;margin:0 0 20px;">We received a request to reset your password. This link expires in 1 hour and can be used once. If you didn't request it, you can safely ignore this email.</p>
         <p style="margin:0 0 16px;">${button(resetUrl, "Reset password")}</p>
         <p style="color:#a7d7c5;font-size:12px;margin:0;word-break:break-all;">Or paste this link into your browser:<br />${resetUrl}</p>`
    );
    const text = `Hi ${name || "there"},\n\nReset your SaySomething password (link expires in 1 hour, single use):\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n`;
    return { subject, html, text };
}

module.exports = {
    statusChangedEmail,
    reportAssignedEmail,
    passwordResetEmail
};
