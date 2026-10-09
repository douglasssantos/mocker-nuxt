import {
  createError,
  defineEventHandler,
  getMethod,
  getRequestHeader,
  getRequestHeaders,
  getRequestURL,
  proxyRequest,
  readBody,
  setResponseHeader,
  setResponseStatus
} from "h3";
import { useRuntimeConfig } from "#imports";
import options from "#mock-options";
import { exchangeDetail, isMockingActive, recordExchange } from "../core/devtoolsState.js";
import { externalUrl, parseInternalPath } from "../../shared/externalMatch.js";
import { queryFromEvent, runExternalMock } from "../external/run.js";
function allowBrowser(event) {
  const origin = getRequestHeader(event, "origin");
  if (origin) {
    setResponseHeader(event, "access-control-allow-origin", origin);
    setResponseHeader(event, "access-control-allow-credentials", "true");
    setResponseHeader(event, "vary", "origin");
  } else {
    setResponseHeader(event, "access-control-allow-origin", "*");
  }
  const requested = getRequestHeader(event, "access-control-request-headers");
  setResponseHeader(
    event,
    "access-control-allow-headers",
    requested || "content-type, authorization, accept"
  );
  setResponseHeader(
    event,
    "access-control-allow-methods",
    "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
  );
}
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const parsed = parseInternalPath(url.pathname, options.targets ?? []);
  if (!parsed)
    throw createError({ statusCode: 404, statusMessage: "Unknown mock target" });
  const method = getMethod(event);
  allowBrowser(event);
  if (method === "OPTIONS") {
    setResponseStatus(event, 204);
    return null;
  }
  const config = useRuntimeConfig(event);
  const enabled = isMockingActive(
    config.mockerServer?.enabled,
    options.allowProduction
  );
  const headers = getRequestHeaders(event);
  const body = ["GET", "HEAD"].includes(method) ? void 0 : await readBody(event);
  if (enabled) {
    const response = await runExternalMock({
      targetName: parsed.name,
      baseURL: parsed.baseURL,
      path: parsed.path,
      search: url.search,
      method,
      query: queryFromEvent(event),
      headers,
      body
    });
    if (response) {
      setResponseStatus(event, response.status);
      for (const [name, value] of Object.entries(response.headers ?? {}))
        setResponseHeader(event, name, value);
      setResponseHeader(event, "X-Mock-Server", "true");
      if (method === "HEAD" || response.status === 204 || response.status === 304)
        return null;
      return response.body;
    }
  }
  const target = externalUrl(parsed.baseURL, parsed.path, url.search);
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password)
    throw createError({ statusCode: 500, statusMessage: "Unsafe proxy target" });
  const started = Date.now();
  try {
    const result = await proxyRequest(event, target.toString());
    if (enabled)
      recordExchange({
        method,
        path: target.toString(),
        status: 200,
        latency: Date.now() - started,
        outcome: "proxied",
        detail: exchangeDetail({
          url: target.toString(),
          query: queryFromEvent(event),
          headers,
          body
        })
      });
    return result;
  } catch (error) {
    if (enabled)
      recordExchange({
        method,
        path: target.toString(),
        status: 502,
        latency: Date.now() - started,
        outcome: "error",
        detail: exchangeDetail({
          url: target.toString(),
          query: queryFromEvent(event),
          headers,
          body
        })
      });
    throw error;
  }
});
