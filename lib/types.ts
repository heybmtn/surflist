// lib/types.ts — ambient types for the Pages Functions.
//
// This repo is zero-npm, so there is no @cloudflare/workers-types dependency.
// These are minimal local declarations covering only what this feature uses
// (Cloudflare's Pages Functions build step type-strips .ts without a tsc
// check, so this is for editor/readability clarity, not a hard requirement).

export interface Env {
  RESEND_API_KEY: string;
  /** Optional override for the get-listed staff inbox. Defaults to listings@. */
  LISTINGS_INBOX?: string;
}

export interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil(promise: Promise<unknown>): void;
  next(): Promise<Response>;
}

export type PagesFunction<E = Env> = (context: EventContext<E>) => Response | Promise<Response>;
