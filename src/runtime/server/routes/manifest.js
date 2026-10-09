import { defineEventHandler, setResponseHeader } from "h3";
import { useRuntimeConfig } from "#imports";
import options from "#mock-options";
import { isMockingActive } from "../core/devtoolsState.js";
import { externalRegistry } from "../external/run.js";
import { normalizeTarget } from "../../shared/externalMatch.js";
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  setResponseHeader(event, "cache-control", "no-store");
  const targets = (options.targets ?? []).map((target) => normalizeTarget(target));
  return {
    enabled: isMockingActive(config.mockerServer?.enabled, options.allowProduction),
    interceptExternal: options.interceptExternal === true,
    targets,
    routes: externalRegistry().list().filter((route) => route.target).map((route) => ({
      name: route.name,
      target: route.target,
      route: route.route,
      method: route.method,
      enabled: route.enabled
    }))
  };
});
