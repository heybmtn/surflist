// functions/marketplace-images/[[path]].ts — GET /marketplace-images/*
//
// R2 buckets are private by default; rather than relying on the R2.dev
// public-bucket toggle, reads are proxied through this Function so
// `images` JSON can store plain same-origin paths. Object keys are
// content-addressed by upload (id/index.ext), so caching forever is safe.

import type { Env, PagesFunction } from "../../lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const key = pathParts.filter(Boolean).join("/");
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.MARKETPLACE_IMAGES.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};
