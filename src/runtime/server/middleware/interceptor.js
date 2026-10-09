import {
  defineEventHandler,
  getRequestURL,
  getMethod,
  getQuery,
  readBody,
  setResponseStatus,
  setResponseHeader,
  proxyRequest,
  createError,
  getRequestHeaders,
  getResponseStatus
} from "h3";
import { useRuntimeConfig } from "#imports";
import entries from "#mock-registry";
import options from "#mock-options";
import { MockResolver } from "../core/MockResolver.js";
import {
  isMockingActive,
  exchangeDetail,
  recordExchange,
  syncRegistry
} from "../core/devtoolsState.js";
function errorStatus(error, fallback) {
  if (typeof error === "object" && error && "statusCode" in error) {
    const status = Number(error.statusCode);
    if (Number.isInteger(status) && status >= 400) return status;
  }
  return fallback;
}
const registry = syncRegistry(entries);
const resolver = new MockResolver();
function observed(event, extra = {}) {
  return exchangeDetail({
    url: extra.url ?? getRequestURL(event).href,
    query: getQuery(event),
    headers: getRequestHeaders(event),
    body: extra.body,
    response: extra.response
  });
}
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const settings = config.mockerServer ?? {};
  const url = getRequestURL(event);
  const path = url.pathname;
  const method = getMethod(event);
  if (path === "/__mocker" || path.startsWith("/__mocker/")) return;
  if (path === "/__mock" || path.startsWith("/__mock/")) return;
  for (const target2 of options.targets ?? []) {
    const base2 = String(target2.mockBasePath || "/__mock").replace(/\/$/, "");
    if (path === base2 || path.startsWith(base2 + "/")) return;
  }
  const base = options.basePath.replace(/\/$/, "");
  if (path !== base && !path.startsWith(base + "/")) return;
  const enabled = isMockingActive(settings.enabled, options.allowProduction);
  const started = Date.now();
  const match = enabled ? registry.resolve(method, path) : null;
  if (match) {
    const body = ["GET", "HEAD"].includes(method) ? void 0 : await readBody(event);
    const request = {
      method,
      path,
      params: match.params,
      query: getQuery(event),
      headers: getRequestHeaders(event),
      body
    };
    try {
      const response = await resolver.execute(match.definition, request);
      recordExchange({
        method,
        path,
        status: response.status,
        latency: Date.now() - started,
        outcome: "mocked",
        strategy: match.definition.strategy,
        detail: observed(event, { body, response: response.body })
      });
      setResponseStatus(event, response.status);
      for (const [name, value] of Object.entries(response.headers ?? {}))
        setResponseHeader(event, name, value);
      setResponseHeader(event, "X-Mock-Server", "true");
      if (method === "HEAD" || response.status === 204 || response.status === 304)
        return null;
      return response.body;
    } catch (error) {
      recordExchange({
        method,
        path,
        status: errorStatus(error, 500),
        latency: Date.now() - started,
        outcome: "error",
        strategy: match.definition.strategy,
        detail: observed(event, { body })
      });
      throw error;
    }
  }
  if (enabled && options.fallback === "error") {
    recordExchange({
      method,
      path,
      status: 404,
      latency: Date.now() - started,
      outcome: "error",
      detail: observed(event)
    });
    throw createError({
      statusCode: 404,
      statusMessage: "No matching mock route"
    });
  }
  if (!settings.target) {
    if (enabled)
      recordExchange({
        method,
        path,
        status: 502,
        latency: Date.now() - started,
        outcome: "error",
        detail: observed(event)
      });
    throw createError({ statusCode: 502, statusMessage: "API target missing" });
  }
  const target = new URL(settings.target);
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password) {
    if (enabled)
      recordExchange({
        method,
        path,
        status: 500,
        latency: Date.now() - started,
        outcome: "error",
        detail: observed(event)
      });
    throw createError({
      statusCode: 500,
      statusMessage: "Unsafe proxy target"
    });
  }
  target.pathname = target.pathname.replace(/\/$/, "") + path;
  target.search = url.search;
  try {
    const result = await proxyRequest(event, target.toString());
    if (enabled)
      recordExchange({
        method,
        path,
        status: getResponseStatus(event) || 200,
        latency: Date.now() - started,
        outcome: "proxied",
        detail: observed(event, { url: target.toString() })
      });
    return result;
  } catch (error) {
    if (enabled)
      recordExchange({
        method,
        path,
        status: errorStatus(error, 502),
        latency: Date.now() - started,
        outcome: "error",
        detail: observed(event, { url: target.toString() })
      });
    throw error;
  }
});
