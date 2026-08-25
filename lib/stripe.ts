// lib/stripe.ts — minimal hand-rolled Stripe REST client. No SDK: this repo
// has zero npm dependencies, and only two Stripe calls are needed.

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

export async function createCheckoutSession(
  secretKey: string,
  opts: { listingId: string; title: string; successUrl: string; cancelUrl: string }
): Promise<CheckoutSessionResult> {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": "500",
    "line_items[0][price_data][product_data][name]": `Promoted listing: ${opts.title}`,
    "line_items[0][quantity]": "1",
    "metadata[listing_id]": opts.listingId,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stripe checkout session creation failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { id: string; url: string };
  return { id: json.id, url: json.url };
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Verifies a Stripe webhook signature per Stripe's documented algorithm:
 * HMAC-SHA256(secret, `${timestamp}.${rawBody}`) compared against the v1
 * signature(s) in the Stripe-Signature header, with a 5-minute replay window.
 */
export async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!sigHeader) return false;

  const parts: Record<string, string> = {};
  for (const kv of sigHeader.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) parts[k] = v;
  }
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const skewSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(skewSeconds) || skewSeconds > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`)
  );
  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  let v1Bytes: Uint8Array;
  try {
    v1Bytes = hexToBytes(v1);
  } catch {
    return false;
  }
  return timingSafeEqual(hexToBytes(computedHex), v1Bytes);
}
