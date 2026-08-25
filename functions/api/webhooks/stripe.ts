// functions/api/webhooks/stripe.ts — POST /api/webhooks/stripe
//
// Reads the raw body BEFORE any JSON parsing — signature verification needs
// the exact bytes Stripe signed. On checkout.session.completed for a
// promoted listing: activate it and set promoted_until = now + 30 days.
// Idempotent (safe if Stripe retries delivery).

import type { Env, PagesFunction } from "../../../lib/types";
import { jsonError, jsonOk } from "../../../lib/response";
import { verifyStripeSignature } from "../../../lib/stripe";
import { markListingPromoted } from "../../../lib/db";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const verified = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    return jsonError("INVALID_SIGNATURE", "Stripe signature verification failed.", 400);
  }

  let event: { type: string; data: { object: { metadata?: { listing_id?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonError("INVALID_BODY", "Could not parse webhook payload.", 400);
  }

  if (event.type === "checkout.session.completed") {
    const listingId = event.data.object.metadata?.listing_id;
    if (!listingId) {
      return jsonError("INVALID_EVENT", "checkout.session.completed had no listing_id metadata.", 400);
    }

    try {
      const promotedUntil = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
      await markListingPromoted(env.DB, listingId, promotedUntil);
    } catch (err) {
      console.error("markListingPromoted failed", err);
      return jsonError("DB_ERROR", "Could not activate promoted listing.", 500);
    }
  }

  return jsonOk({});
};
