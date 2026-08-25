// functions/api/marketplace/inquire.ts — POST /api/marketplace/inquire
//
// Looks up the listing by slug (the frontend only has the slug, not the raw
// id), records the inquiry, then best-effort emails the seller (Reply-To the
// buyer) and a confirmation to the buyer. A durable D1 insert is enough for
// a 200 — email delivery must never block or fail this request.

import type { Env, InquiryRow, PagesFunction } from "../../../lib/types";
import { jsonError, jsonOk } from "../../../lib/response";
import { getListingBySlug, insertInquiry } from "../../../lib/db";
import { isValidEmail, requireNonEmpty } from "../../../lib/validate";
import { MARKETPLACE_FROM, escapeHtml, sendEmail } from "../../../lib/email";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_BODY", "Expected JSON.", 400);
  }

  const slug = requireNonEmpty(body.slug, 160);
  const buyerName = requireNonEmpty(body.buyer_name, 140);
  const buyerEmail = String(body.buyer_email ?? "").trim();
  const message = requireNonEmpty(body.message, 4000);

  const fieldErrors: Record<string, string> = {};
  if (!slug) fieldErrors.slug = "Missing listing.";
  if (!buyerName) fieldErrors.buyer_name = "Your name is required.";
  if (!isValidEmail(buyerEmail)) fieldErrors.buyer_email = "A valid email is required.";
  if (!message) fieldErrors.message = "Message is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return jsonError("VALIDATION_ERROR", "Some fields need attention.", 400, { fields: fieldErrors });
  }

  const listing = await getListingBySlug(env.DB, slug as string);
  if (!listing || (listing.status !== "active" && listing.status !== "sold")) {
    return jsonError("NOT_FOUND", "Listing not found.", 404);
  }

  const inquiry: InquiryRow = {
    id: crypto.randomUUID(),
    listing_id: listing.id,
    buyer_name: buyerName as string,
    buyer_email: buyerEmail,
    message: message as string,
    sent_at: new Date().toISOString(),
  };

  try {
    await insertInquiry(env.DB, inquiry);
  } catch (err) {
    console.error("insertInquiry failed", err);
    return jsonError("DB_ERROR", "Could not send your inquiry. Please try again.", 500);
  }

  await sendEmail(env.RESEND_API_KEY, {
    to: listing.seller_email,
    from: MARKETPLACE_FROM,
    replyTo: buyerEmail,
    subject: `New inquiry for your listing: ${listing.title}`,
    html:
      `<p>You have a new inquiry for "${escapeHtml(listing.title)}".</p>` +
      `<p><strong>From:</strong> ${escapeHtml(buyerName)} (${escapeHtml(buyerEmail)})</p>` +
      `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` +
      `<p><em>Replying to this email will reply directly to ${escapeHtml(buyerEmail)}.</em></p>`,
  });

  await sendEmail(env.RESEND_API_KEY, {
    to: buyerEmail,
    from: MARKETPLACE_FROM,
    subject: "Your inquiry has been sent",
    html: `<p>Your message about "${escapeHtml(listing.title)}" was delivered to the seller.</p>`,
  });

  return jsonOk({});
};
