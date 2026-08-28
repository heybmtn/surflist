// functions/api/list-your-business.ts — POST /api/list-your-business
//
// Intake for the "get listed" form: no DB row, no file upload — just
// validate and best-effort email the details to the team (listings@) with
// Reply-To the submitter, plus a short confirmation back to the submitter.

import type { Env, PagesFunction } from "../../lib/types";
import { jsonError, jsonOk } from "../../lib/response";
import { clampText, isValidEmail, isValidUrl, requireNonEmpty } from "../../lib/validate";
import { LISTINGS_FROM, escapeHtml, sendEmail } from "../../lib/email";

const DEFAULT_LISTINGS_INBOX = "listings@surflist.co";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_BODY", "Expected JSON.", 400);
  }

  const businessName = requireNonEmpty(body.business_name, 140);
  const website = String(body.website ?? "").trim();
  const socials = clampText(body.socials, 1000);
  const contactEmail = String(body.contact_email ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!businessName) fieldErrors.business_name = "Business name is required.";
  if (!isValidUrl(website)) fieldErrors.website = "A valid website (http/https) is required.";
  if (!isValidEmail(contactEmail)) fieldErrors.contact_email = "A valid email is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return jsonError("VALIDATION_ERROR", "Some fields need attention.", 400, { fields: fieldErrors });
  }

  await sendEmail(env.RESEND_API_KEY, {
    to: env.LISTINGS_INBOX || DEFAULT_LISTINGS_INBOX,
    from: LISTINGS_FROM,
    replyTo: contactEmail,
    subject: `New listing submission: ${businessName}`,
    html:
      `<p><strong>Business:</strong> ${escapeHtml(businessName as string)}</p>` +
      `<p><strong>Website:</strong> <a href="${escapeHtml(website)}">${escapeHtml(website)}</a></p>` +
      `<p><strong>Socials:</strong><br>${escapeHtml(socials).replace(/\n/g, "<br>") || "—"}</p>` +
      `<p><strong>Contact email:</strong> ${escapeHtml(contactEmail)}</p>`,
  });

  await sendEmail(env.RESEND_API_KEY, {
    to: contactEmail,
    from: LISTINGS_FROM,
    subject: "We've got your submission",
    html: `<p>Thanks — we've received your details for ${escapeHtml(businessName as string)} and will be in touch shortly.</p>`,
  });

  return jsonOk({});
};
