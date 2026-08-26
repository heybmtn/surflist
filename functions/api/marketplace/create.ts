// functions/api/marketplace/create.ts — POST /api/marketplace/create
//
// Free tier: insert active listing, best-effort confirmation email.
// Promoted tier (£5/30 days): create the Stripe Checkout Session FIRST, so a
// Stripe failure never leaves an orphaned D1 row; insert as pending_payment,
// return the Checkout URL for the browser to redirect to.

import type { Env, ListingRow, PagesFunction } from "../../../lib/types";
import { jsonError, jsonOk } from "../../../lib/response";
import {
  MAX_PHOTOS,
  clampText,
  isValidCategory,
  isValidCondition,
  isValidEmail,
  isValidImageFile,
  isValidUrl,
  parsePricePence,
  requireNonEmpty,
} from "../../../lib/validate";
import { makeListingSlug } from "../../../lib/slug";
import { insertListing } from "../../../lib/db";
import { createCheckoutSession } from "../../../lib/stripe";
import { MARKETPLACE_FROM, escapeHtml, sendEmail } from "../../../lib/email";

function extensionForType(type: string): string {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  return ".jpg";
}

function clampRegionSlug(value: string): string {
  return value.trim().toLowerCase().slice(0, 80);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("INVALID_BODY", "Expected multipart/form-data.", 400);
  }

  const title = requireNonEmpty(form.get("title"), 140);
  const category = String(form.get("category") ?? "");
  const description = requireNonEmpty(form.get("description"), 5000);
  const location = requireNonEmpty(form.get("location"), 140);
  const regionSlugRaw = form.get("region_slug");
  const regionSlug = regionSlugRaw ? clampRegionSlug(String(regionSlugRaw)) : null;
  const sellerName = requireNonEmpty(form.get("seller_name"), 140);
  const sellerEmail = String(form.get("seller_email") ?? "").trim();
  const sellerPhoneRaw = form.get("seller_phone");
  const sellerPhone = sellerPhoneRaw ? requireNonEmpty(sellerPhoneRaw, 40) : null;
  const externalUrlRaw = String(form.get("external_url") ?? "").trim();
  const externalUrl = externalUrlRaw ? externalUrlRaw : null;
  const tier = String(form.get("tier") ?? "free") === "promoted" ? "promoted" : "free";
  const pricePence = parsePricePence(String(form.get("price") ?? ""));

  const boardType = clampText(form.get("board_type"), 80) || null;
  const dimensionLength = clampText(form.get("dimension_length"), 40) || null;
  const dimensionWidth = clampText(form.get("dimension_width"), 40) || null;
  const dimensionThickness = clampText(form.get("dimension_thickness"), 40) || null;
  const dimensionVolume = clampText(form.get("dimension_volume"), 40) || null;
  const condition = clampText(form.get("condition"), 40) || null;
  const localPickupOnly = form.get("local_pickup_only") === "on" ? 1 : 0;

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Title is required.";
  if (!isValidCategory(category)) fieldErrors.category = "Choose a valid category.";
  if (!description) fieldErrors.description = "Description is required.";
  if (!location) fieldErrors.location = "Location is required.";
  if (!sellerName) fieldErrors.seller_name = "Your name is required.";
  if (!isValidEmail(sellerEmail)) fieldErrors.seller_email = "A valid email is required.";
  if (pricePence === null) fieldErrors.price = "Enter a valid price.";
  if (externalUrl && !isValidUrl(externalUrl)) fieldErrors.external_url = "Enter a valid http(s) link.";
  const isBoardCategory = category === "surfboards" || category === "bodyboards";
  if (isBoardCategory && !boardType) fieldErrors.board_type = "Board type is required.";
  if (isBoardCategory && !condition) {
    fieldErrors.condition = "Condition is required.";
  } else if (condition && !isValidCondition(condition)) {
    fieldErrors.condition = "Choose a valid condition.";
  }

  const photos = form.getAll("photos").filter((p): p is File => p instanceof File && p.size > 0);
  if (photos.length > MAX_PHOTOS) fieldErrors.photos = `Up to ${MAX_PHOTOS} photos allowed.`;
  else {
    for (const photo of photos) {
      if (!isValidImageFile(photo)) {
        fieldErrors.photos = "Photos must be JPG, PNG or WEBP and 5MB or smaller.";
        break;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return jsonError("VALIDATION_ERROR", "Some fields need attention.", 400, { fields: fieldErrors });
  }

  const id = crypto.randomUUID();
  const slug = makeListingSlug(title as string, id);
  const now = new Date().toISOString();

  const images: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const key = `${id}/${i}${extensionForType(photo.type)}`;
    try {
      await env.MARKETPLACE_IMAGES.put(key, await photo.arrayBuffer(), {
        httpMetadata: { contentType: photo.type },
      });
      images.push(`/marketplace-images/${key}`);
    } catch (err) {
      console.error("R2 upload failed", err);
      return jsonError("UPLOAD_FAILED", "Could not upload one or more photos. Please try again.", 502);
    }
  }

  const baseRow: ListingRow = {
    id,
    title: title as string,
    slug,
    description: description as string,
    category,
    board_type: boardType,
    dimension_length: dimensionLength,
    dimension_width: dimensionWidth,
    dimension_thickness: dimensionThickness,
    dimension_volume: dimensionVolume,
    condition,
    price: pricePence as number,
    currency: "GBP",
    location: location as string,
    region_slug: regionSlug,
    local_pickup_only: localPickupOnly,
    images: JSON.stringify(images),
    seller_name: sellerName as string,
    seller_email: sellerEmail,
    seller_phone: sellerPhone,
    external_url: externalUrl,
    tier: "free",
    status: "active",
    promoted_until: null,
    created_at: now,
    updated_at: now,
  };

  if (tier === "promoted") {
    const origin = new URL(request.url).origin;
    let checkout;
    try {
      checkout = await createCheckoutSession(env.STRIPE_SECRET_KEY, {
        listingId: id,
        title: title as string,
        successUrl: `${origin}/marketplace/${slug}/?promoted=success`,
        cancelUrl: `${origin}/marketplace/sell/?promoted=cancelled`,
      });
    } catch (err) {
      console.error("Stripe checkout session failed", err);
      return jsonError("STRIPE_ERROR", "Could not start checkout. Please try again.", 502);
    }

    const row: ListingRow = { ...baseRow, tier: "promoted", status: "pending_payment" };
    try {
      await insertListing(env.DB, row);
    } catch (err) {
      console.error("D1 insert failed (promoted)", err);
      return jsonError("DB_ERROR", "Could not save your listing. Please try again.", 500);
    }

    return jsonOk({ listing: { id, slug }, checkoutUrl: checkout.url });
  }

  try {
    await insertListing(env.DB, baseRow);
  } catch (err) {
    console.error("D1 insert failed (free)", err);
    return jsonError("DB_ERROR", "Could not save your listing. Please try again.", 500);
  }

  await sendEmail(env.RESEND_API_KEY, {
    to: sellerEmail,
    from: MARKETPLACE_FROM,
    subject: "Your Surflist Marketplace listing is live",
    html:
      `<p>Hi ${escapeHtml(sellerName)},</p>` +
      `<p>Your listing "${escapeHtml(title)}" is now live on Surflist Marketplace.</p>`,
  });

  return jsonOk({ listing: { id, slug }, checkoutUrl: null });
};
