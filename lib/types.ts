// lib/types.ts — ambient types for the marketplace Pages Functions.
//
// This repo is zero-npm, so there is no @cloudflare/workers-types dependency.
// These are minimal local declarations covering only what this feature uses
// (Cloudflare's Pages Functions build step type-strips .ts without a tsc
// check, so this is for editor/readability clarity, not a hard requirement).

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface R2HTTPMetadata {
  contentType?: string;
}

export interface R2Object {
  httpMetadata?: R2HTTPMetadata;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
}

export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
    options?: { httpMetadata?: R2HTTPMetadata }
  ): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
}

export interface Env {
  DB: D1Database;
  MARKETPLACE_IMAGES: R2Bucket;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

export interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil(promise: Promise<unknown>): void;
  next(): Promise<Response>;
}

export type PagesFunction<E = Env> = (context: EventContext<E>) => Response | Promise<Response>;

export interface ListingRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  location: string;
  region_slug: string | null;
  images: string;
  seller_name: string;
  seller_email: string;
  seller_phone: string | null;
  external_url: string | null;
  tier: string;
  status: string;
  promoted_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryRow {
  id: string;
  listing_id: string;
  buyer_name: string;
  buyer_email: string;
  message: string;
  sent_at: string;
}
