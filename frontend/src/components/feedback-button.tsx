/**
 * Feedback entrypoint — DISABLED (no personal email in client bundle).
 *
 * Simpler options later:
 * 1. Google Form: host an anonymous form, put only `FORMS_URL` in .env — sheet notifies your Gmail without exposing address.
 * 2. Alias inbox: `feedback@yourdomain.com` → forwards to personal Gmail (DNS/email provider); mailto or backend OK.
 * 3. Backend relay (best UX): POST /api/feedback with message JSON; Go sends mail via existing SendGrid using FEEDBACK_TO_EMAIL in server env only.
 *
 * Previous implementations (removed from bundle): EmailJS env vars; mailto with fixed address.
 */
export default function FeedbackButton() {
  return null
}
