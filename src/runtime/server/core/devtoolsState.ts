import type { MockRegistryEntry } from "../../../types.js";
import { MockRegistry, type MockRouteInfo } from "./MockRegistry.js";

export type PanelStrategy = MockRouteInfo["strategy"] | "proxy";

export interface PanelRoute extends Omit<MockRouteInfo, "strategy"> {
  strategy: PanelStrategy;
}

export interface ExchangeDetail {
  url: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body?: unknown;
  response?: unknown;
}

export interface MockerExchange {
  id: number;
  at: number;
  method: string;
  path: string;
  status: number;
  latency: number;
  outcome: "mocked" | "proxied" | "error";
  strategy?: string;
  detail?: ExchangeDetail;
}

export interface MockerSnapshot {
  enabled: boolean;
  basePath: string;
  fallback: "proxy" | "error";
  targets: { name: string; baseURL: string }[];
  mapped: number;
  mocked: number;
  proxied: number;
  routes: PanelRoute[];
  recent: MockerExchange[];
}

interface MockerState {
  registry: MockRegistry;
  mocked: number;
  proxied: number;
  seq: number;
  events: MockerExchange[];
}

const KEY = "__nuxtMockerState__";
const MAX_EVENTS = 40;
const MAX_TEXT = 12000;

function preview(value: unknown): unknown {
  if (value == null) return value;
  let text: string;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
  if (text.length <= MAX_TEXT) return value;
  return text.slice(0, MAX_TEXT) + "… [truncated]";
}

function previewHeaders(headers: Record<string, string | undefined> | undefined) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value == null) continue;
    out[key] = value.length > 1000 ? value.slice(0, 1000) + "…" : value;
  }
  return out;
}

export function exchangeDetail(input: {
  url: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string | undefined>;
  body?: unknown;
  response?: unknown;
}): ExchangeDetail {
  const query = preview(input.query ?? {});
  return {
    url: input.url,
    query:
      query && typeof query === "object" && !Array.isArray(query)
        ? (query as Record<string, unknown>)
        : {},
    headers: previewHeaders(input.headers),
    body: preview(input.body),
    response: preview(input.response),
  };
}

function state(): MockerState {
  const scope = globalThis as typeof globalThis & { [KEY]?: MockerState };
  if (!scope[KEY]) {
    scope[KEY] = {
      registry: new MockRegistry(),
      mocked: 0,
      proxied: 0,
      seq: 0,
      events: [],
    };
  }
  return scope[KEY];
}

export function resetMockerState() {
  const scope = globalThis as typeof globalThis & { [KEY]?: MockerState };
  delete scope[KEY];
}

export function syncRegistry(entries: MockRegistryEntry[]) {
  const current = state();
  current.registry.register(entries);
  return current.registry;
}

export function isMockingActive(
  enabled: boolean | undefined,
  allowProduction: boolean,
) {
  return (
    enabled === true &&
    (process.env.NODE_ENV !== "production" || allowProduction)
  );
}

export function recordExchange(
  exchange: Omit<MockerExchange, "id" | "at">,
) {
  const current = state();
  if (exchange.outcome === "mocked") current.mocked += 1;
  if (exchange.outcome === "proxied") current.proxied += 1;
  current.seq += 1;
  current.events.push({
    ...exchange,
    id: current.seq,
    at: Date.now(),
    detail: exchange.detail ? exchangeDetail(exchange.detail) : undefined,
  });
  if (current.events.length > MAX_EVENTS)
    current.events.splice(0, current.events.length - MAX_EVENTS);
}

export function snapshot(input: {
  enabled: boolean;
  basePath: string;
  fallback: "proxy" | "error";
  targets?: { name: string; baseURL: string }[];
}): MockerSnapshot {
  const current = state();
  const routes: PanelRoute[] = current.registry.list();
  const seen = new Set(routes.map((route) => `${route.method} ${route.route}`));
  for (const event of current.events) {
    if (event.outcome !== "proxied") continue;
    const key = `${event.method} ${event.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    routes.push({
      file: "",
      name: "",
      route: event.path,
      method: event.method,
      strategy: "proxy",
      enabled: true,
    });
  }
  return {
    enabled: input.enabled,
    basePath: input.basePath,
    fallback: input.fallback,
    targets: input.targets ?? [],
    mapped: current.registry.list().length,
    mocked: current.mocked,
    proxied: current.proxied,
    routes,
    recent: [...current.events].reverse().slice(0, 12),
  };
}
