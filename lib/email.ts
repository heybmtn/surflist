// lib/email.ts — Resend wrapper. Every call site treats a failed send as
// non-fatal: a broken email integration must never fail the parent request.

export { escapeHtml } from "./html";

export interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(apiKey: string, opts: SendEmailOptions): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend send threw", err);
    return false;
  }
}

export const LISTINGS_FROM = "Surflist <hello@surflist.co>";
