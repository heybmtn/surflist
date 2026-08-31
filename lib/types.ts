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
  /** Pages D1 binding (`surflist-marketplace`). Used by the visitor counter. */
  DB?: D1Database;
}

/** Minimal D1 surface used by Pages Functions in this repo. */
export interface D1Database {
  exec(query: string): Promise<unknown>;
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta?: { changes?: number };
}

export interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil(promise: Promise<unknown>): void;
  next(): Promise<Response>;
}

export type PagesFunction<E = Env> = (context: EventContext<E>) => Response | Promise<Response>;
