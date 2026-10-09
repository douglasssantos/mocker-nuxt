import { defineNitroPlugin } from "#imports";
import { Dispatcher, MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { useRuntimeConfig } from "#imports";
import options from "#mock-options";
import { RouteMatcher } from "../core/RouteMatcher.js";
import { isMockingActive } from "../core/devtoolsState.js";
import { normalizeTarget, relativeToTarget } from "../../shared/externalMatch.js";
import { externalRegistry, runExternalMock } from "../external/run.js";
const HOLDER = "__nuxtMockerUndici__";
function requestOrigin(origin) {
  if (origin instanceof URL) return origin.origin;
  const value = String(origin ?? "");
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}
function headerRecord(headers) {
  if (!headers) return {};
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const record = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  return headers;
}
function readBody(body) {
  if (body == null || body === "") return void 0;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  if (body instanceof Uint8Array) {
    try {
      return JSON.parse(new TextDecoder().decode(body));
    } catch {
      return void 0;
    }
  }
  return void 0;
}
function install() {
  if (options.interceptExternal !== true) return;
  const config = useRuntimeConfig();
  if (!isMockingActive(config.mockerServer?.enabled, options.allowProduction)) return;
  const targets = (options.targets ?? []).map((target) => normalizeTarget(target));
  if (!targets.length) return;
  const scope = globalThis;
  if (!scope[HOLDER]) {
    const agent = new MockAgent();
    agent.disableNetConnect();
    const original = getGlobalDispatcher();
    const holder2 = {
      agent,
      origins: /* @__PURE__ */ new Set(),
      matches: (_origin, _method, _path) => false
    };
    class SplitDispatcher extends Dispatcher {
      dispatch(opts, handler) {
        const origin = requestOrigin(opts.origin);
        const method = String(opts.method || "GET").toUpperCase();
        const path = String(opts.path || "/");
        const matched = holder2.matches(origin, method, path);
        return (matched ? agent : original).dispatch(opts, handler);
      }
    }
    setGlobalDispatcher(new SplitDispatcher());
    scope[HOLDER] = holder2;
  }
  const holder = scope[HOLDER];
  const registry = externalRegistry();
  holder.matches = (origin, method, path) => {
    try {
      const url = new URL(path, origin);
      return targets.some((target) => {
        const relative = relativeToTarget(target.baseURL, url);
        if (relative == null) return false;
        return registry.list().some(
          (route) => route.enabled && route.target === target.name && route.method === method && RouteMatcher.match(route.route, relative) != null
        );
      });
    } catch {
      return false;
    }
  };
  for (const origin of holder.origins) holder.agent.get(origin).cleanMocks();
  holder.origins.clear();
  for (const target of targets) {
    const configured = new URL(target.baseURL);
    const origins = [configured.origin];
    const port = configured.port || (configured.protocol === "https:" ? "443" : "80");
    if (port === "80" || port === "443") {
      const other = configured.protocol === "https:" ? "http:" : "https:";
      origins.push(`${other}//${configured.hostname}`);
    }
    for (const origin of origins) {
      const pool = holder.agent.get(origin);
      for (const route of registry.list()) {
        if (route.target !== target.name || !route.enabled) continue;
        pool.intercept({
          method: route.method,
          path: (path) => {
            const url = new URL(path, origin);
            const relative = relativeToTarget(target.baseURL, url);
            return relative != null && RouteMatcher.match(route.route, relative) != null;
          }
        }).reply(async (opts) => {
          const url = new URL(opts.path, origin);
          const relative = relativeToTarget(target.baseURL, url) ?? "/";
          const query = Object.fromEntries(url.searchParams.entries());
          const response = await runExternalMock({
            targetName: target.name,
            baseURL: target.baseURL,
            path: relative,
            search: url.search,
            method: opts.method,
            query,
            headers: headerRecord(opts.headers),
            body: readBody(opts.body)
          });
          return {
            statusCode: response?.status ?? 404,
            data: JSON.stringify(response?.body ?? null),
            responseOptions: {
              headers: {
                "content-type": "application/json; charset=utf-8",
                "x-mock-server": "true",
                ...response?.headers ?? {}
              }
            }
          };
        }).persist();
      }
      holder.origins.add(origin);
    }
  }
}
export default defineNitroPlugin(() => {
  install();
});
