import { MockRegistry } from "./MockRegistry.js";
const KEY = "__nuxtMockerState__";
const MAX_EVENTS = 40;
const MAX_TEXT = 12e3;
function preview(value) {
  if (value == null) return value;
  let text;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
  if (text.length <= MAX_TEXT) return value;
  return text.slice(0, MAX_TEXT) + "\u2026 [truncated]";
}
function previewHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (value == null) continue;
    out[key] = value.length > 1e3 ? value.slice(0, 1e3) + "\u2026" : value;
  }
  return out;
}
export function exchangeDetail(input) {
  const query = preview(input.query ?? {});
  return {
    url: input.url,
    query: query && typeof query === "object" && !Array.isArray(query) ? query : {},
    headers: previewHeaders(input.headers),
    body: preview(input.body),
    response: preview(input.response)
  };
}
function state() {
  const scope = globalThis;
  if (!scope[KEY]) {
    scope[KEY] = {
      registry: new MockRegistry(),
      mocked: 0,
      proxied: 0,
      seq: 0,
      events: []
    };
  }
  return scope[KEY];
}
export function resetMockerState() {
  const scope = globalThis;
  delete scope[KEY];
}
export function syncRegistry(entries) {
  const current = state();
  current.registry.register(entries);
  return current.registry;
}
export function isMockingActive(enabled, allowProduction) {
  return enabled === true && (process.env.NODE_ENV !== "production" || allowProduction);
}
export function recordExchange(exchange) {
  const current = state();
  if (exchange.outcome === "mocked") current.mocked += 1;
  if (exchange.outcome === "proxied") current.proxied += 1;
  current.seq += 1;
  current.events.push({
    ...exchange,
    id: current.seq,
    at: Date.now(),
    detail: exchange.detail ? exchangeDetail(exchange.detail) : void 0
  });
  if (current.events.length > MAX_EVENTS)
    current.events.splice(0, current.events.length - MAX_EVENTS);
}
export function snapshot(input) {
  const current = state();
  const routes = current.registry.list();
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
      enabled: true
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
    recent: [...current.events].reverse().slice(0, 12)
  };
}
