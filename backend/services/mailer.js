const { Resend } = require("resend");

// Email is a feature flag, mirroring the Google-sign-in pattern: with no
// RESEND_API_KEY the app runs normally and mail is skipped (logged). The
// client is built lazily so env load order never matters.
let client = null;

function getClient() {
    if (client) return client;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    client = new Resend(apiKey);
    return client;
}

const from = () =>
    process.env.MAIL_FROM || "SaySomething <onboarding@resend.dev>";

/**
 * Send an email via Resend. NEVER throws — on a missing key or a provider
 * error it logs and resolves, so callers can fire-and-forget without any risk
 * to the request that triggered the send.
 */
async function sendMail({ to, subject, html, text }) {
    const resend = getClient();
    if (!resend) {
        console.warn(
            `[mailer] RESEND_API_KEY not set — skipping email "${subject}" to ${to}`
        );
        return { skipped: true };
    }
    try {
        const { data, error } = await resend.emails.send({
            from: from(),
            to,
            subject,
            html,
            text
        });
        if (error) {
            console.error("[mailer] Resend error:", error.message || error);
            return { error };
        }
        console.log(`[mailer] Sent "${subject}" to ${to} (id: ${data?.id})`);
        return { data };
    } catch (err) {
        console.error("[mailer] Failed to send email:", err.message);
        return { error: err };
    }
}

module.exports = { sendMail };
