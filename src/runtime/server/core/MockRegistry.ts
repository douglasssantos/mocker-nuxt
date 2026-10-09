import type { MockDefinition, MockRegistryEntry } from "../../../types.js";
import { RouteMatcher } from "./RouteMatcher.js";

export interface MockRouteInfo {
  file: string;
  name: string;
  route: string;
  method: MockDefinition["method"];
  strategy: MockDefinition["strategy"];
  target?: string;
  enabled: boolean;
  delay?: number;
}

export class MockRegistry {
  private mocks: MockDefinition[] = [];
  private records: { file: string; definition: MockDefinition }[] = [];
  register(entries: MockRegistryEntry[]) {

    const keys = new Map<string, string>();
    const names = new Set<string>();
    const mocks: MockDefinition[] = [];
    const records: { file: string; definition: MockDefinition }[] = [];

    for (const entry of entries)
      for (const mock of Array.isArray(entry.definitions)
        ? entry.definitions
        : [entry.definitions]) {
        if (
          !mock ||
          !mock.name ||
          !mock.route?.startsWith("/") ||
          !["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(
            mock.method,
          )
        )
          throw new Error(`[mocker-nuxt] Invalid mock in ${entry.file}`);

        if (!["static", "factory", "faker", "scenario"].includes(mock.strategy)){
          // throw Error(`[mocker-nuxt] Unknown strategy: ${mock.strategy}`);
          mock.strategy = "static"
        }

        const key = `${mock.target ?? ""}:${mock.method}:${RouteMatcher.signature(mock.route)}`;

        if (keys.has(key)){
          throw new Error(
            `[mocker-nuxt] Duplicate ${key}: ${keys.get(key)} and ${entry.file}`
          );
        }

        if (names.has(mock.name)){
          throw new Error(`[mocker-nuxt] Duplicate mock name: ${mock.name}`);
        }

        keys.set(key, entry.file);
        names.add(mock.name);
        const definition = { ...mock, route: RouteMatcher.normalize(mock.route) };
        mocks.push(definition);
        records.push({ file: entry.file, definition });
      }
    // Distinct route patterns may still overlap. Reject rather than rely on import order.
    for (let i = 0; i < mocks.length; i++)
      for (let j = i + 1; j < mocks.length; j++) {

        if ((mocks[i].target ?? "") !== (mocks[j].target ?? "")) continue;
        if (mocks[i].method !== mocks[j].method) continue;

        const a = mocks[i].route.split("/").filter(Boolean), b = mocks[j].route.split("/").filter(Boolean);

        if (
          a.length === b.length &&
          a.every(
            (s, k) => s.startsWith(":") || b[k].startsWith(":") || s === b[k],
          )
        ){
          throw new Error(
            `[mocker-nuxt] Ambiguous routes: ${mocks[i].route} / ${mocks[j].route}`,
          );
        }
      }

    this.mocks = mocks;
    this.records = records;
  }
  list(): MockRouteInfo[] {
    return this.records.map(({ file, definition }) => ({
      file,
      name: definition.name,
      route: definition.route,
      method: definition.method,
      strategy: definition.strategy,
      target: definition.target,
      enabled: definition.enabled !== false,
      delay: definition.delay,
    }));
  }
  resolve(method: string, path: string, target = "") {
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
