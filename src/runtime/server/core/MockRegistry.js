import { RouteMatcher } from "./RouteMatcher.js";
export class MockRegistry {
  mocks = [];
  records = [];
  register(entries) {
    const keys = /* @__PURE__ */ new Map();
    const names = /* @__PURE__ */ new Set();
    const mocks = [];
    const records = [];
    for (const entry of entries)
      for (const mock of Array.isArray(entry.definitions) ? entry.definitions : [entry.definitions]) {
        if (!mock || !mock.name || !mock.route?.startsWith("/") || !["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(
          mock.method
        ))
          throw new Error(`[mocker-nuxt] Invalid mock in ${entry.file}`);
        if (!["static", "factory", "faker", "scenario"].includes(mock.strategy)) {
          mock.strategy = "static";
        }
        const key = `${mock.target ?? ""}:${mock.method}:${RouteMatcher.signature(mock.route)}`;
        if (keys.has(key)) {
          throw new Error(
            `[mocker-nuxt] Duplicate ${key}: ${keys.get(key)} and ${entry.file}`
          );
        }
        if (names.has(mock.name)) {
          throw new Error(`[mocker-nuxt] Duplicate mock name: ${mock.name}`);
        }
        keys.set(key, entry.file);
        names.add(mock.name);
        const definition = { ...mock, route: RouteMatcher.normalize(mock.route) };
        mocks.push(definition);
        records.push({ file: entry.file, definition });
      }
    for (let i = 0; i < mocks.length; i++)
      for (let j = i + 1; j < mocks.length; j++) {
        if ((mocks[i].target ?? "") !== (mocks[j].target ?? "")) continue;
        if (mocks[i].method !== mocks[j].method) continue;
        const a = mocks[i].route.split("/").filter(Boolean), b = mocks[j].route.split("/").filter(Boolean);
        if (a.length === b.length && a.every(
          (s, k) => s.startsWith(":") || b[k].startsWith(":") || s === b[k]
        )) {
          throw new Error(
            `[mocker-nuxt] Ambiguous routes: ${mocks[i].route} / ${mocks[j].route}`
          );
        }
      }
    this.mocks = mocks;
    this.records = records;
  }
  list() {
    return this.records.map(({ file, definition }) => ({
      file,
      name: definition.name,
      route: definition.route,
      method: definition.method,
      strategy: definition.strategy,
      target: definition.target,
      enabled: definition.enabled !== false,
      delay: definition.delay
    }));
  }
  resolve(method, path, target = "") {
    for (const definition of this.mocks) {
      if (definition.enabled === false || definition.method !== method)
        continue;
      if ((definition.target ?? "") !== target) continue;
      const params = RouteMatcher.match(definition.route, path);
      if (params) return { definition, params };
    }
    return null;
  }
}
