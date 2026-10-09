import {
  defineNuxtModule,
  addServerHandler,
  addServerPlugin,
  addTemplate,
  createResolver,
  updateTemplates,
} from "@nuxt/kit";
import { addCustomTab } from "@nuxt/devtools-kit";
import { resolve, relative, sep, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { discoverMocks } from "./discover.js";
import { browserPatchSource } from "./runtime/client/patch-source.js";
import type { MockOptions } from "./types.js";
export default defineNuxtModule<MockOptions>({
  meta: {
    name: "mocker-nuxt",
    configKey: "mockerServer",
    compatibility: { nuxt: "^3.0.0 || ^4.0.0" },
  },
  defaults: {
    basePath: "/api",
    directory: "./mocks",
    fallback: "proxy",
    defaultStrategy: "static",
    allowProduction: false,
    interceptExternal: false,
    targets: [],
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const root = isAbsolute(options.directory)
      ? options.directory
      : resolve(nuxt.options.rootDir, options.directory);
    const registry = addTemplate({
      filename: "mock-server/registry.mjs",
      write: true,
      async getContents() {
        const files = await discoverMocks(root);
        const imports = files
          .map(
            (f, i) =>
              `import m${i} from ${JSON.stringify(pathToFileURL(f).href)}`,
          )
          .join("\n");
        const entries = files
          .map(
            (f, i) =>
              `{file:${JSON.stringify(relative(nuxt.options.rootDir, f))},definitions:m${i}}`,
          )
          .join(",\n");
        return `${imports}\nexport default [${entries}]\n`;
      },
    });
    const opts = addTemplate({
      filename: "mock-server/options.mjs",
      write: true,
      getContents: () =>
        `export default ${JSON.stringify({
          basePath: options.basePath,
          fallback: options.fallback,
          allowProduction: options.allowProduction,
          interceptExternal: options.interceptExternal,
          targets: options.targets,
        })}\n`,
    });
    nuxt.options.alias["#mock-registry"] = registry.dst;
    nuxt.options.alias["#mock-options"] = opts.dst;
    nuxt.hook("nitro:config", (nitro) => {
      nitro.alias ||= {};
      nitro.alias["#mock-registry"] = registry.dst;
      nitro.alias["#mock-options"] = opts.dst;
    });
    if (options.interceptExternal) {
      for (const target of options.targets) {
        let url: URL;
        try {
          url = new URL(target.baseURL);
        } catch {
          throw new Error(
            `[mocker-nuxt] Invalid target baseURL for ${target.name || "(unnamed)"}`,
          );
        }
        if (!target.name || !["http:", "https:"].includes(url.protocol))
          throw new Error(
            `[mocker-nuxt] Target ${target.name || target.baseURL} needs a name and an http(s) baseURL`,
          );
      }
      const bases = new Set(
        options.targets.map(
          (target) => (target.mockBasePath || "/__mock").replace(/\/$/, "") || "/__mock",
        ),
      );
      const external = resolver.resolve("./runtime/server/routes/external");
      for (const base of bases)
        addServerHandler({ route: `${base}/**`, handler: external });
      addServerHandler({
        route: "/__mocker/manifest",
        handler: resolver.resolve("./runtime/server/routes/manifest"),
      });
      addServerPlugin(resolver.resolve("./runtime/server/plugins/external-fetch"));
      nuxt.options.app.head.script ??= [];
      nuxt.options.app.head.script.unshift({
        key: "mocker-external-intercept",
        type: "text/javascript",
        tagPriority: -20,
        innerHTML: browserPatchSource(),
      });
    }
    addServerHandler({
      middleware: true,
      handler: resolver.resolve("./runtime/server/middleware/interceptor"),
    });
    if (nuxt.options.dev) {
      const devtools = resolver.resolve("./runtime/server/routes/devtools");
      addServerHandler({ route: "/__mocker", handler: devtools });
      addServerHandler({ route: "/__mocker/state", handler: devtools });
      addCustomTab({
        name: "inspector-mocker",
        title: "Inspector - Mocker Server",
        icon: "carbon:api",
        category: "server",
        view: { type: "iframe", src: "/__mocker" },
      });
    }
    // Affects build-time file membership, not runtime environment overrides.
    nuxt.hook("builder:watch", async (_event, path) => {
      const absolute = isAbsolute(path)
        ? resolve(path)
        : resolve(nuxt.options.srcDir, path);
      const rel = relative(root, absolute);
      if (
        rel === ".." ||
        rel.startsWith(".." + sep) ||
        isAbsolute(rel) ||
        !rel.endsWith(".mock.ts")
      )
        return;
      await updateTemplates({
        filter: (t) => t.filename === "mock-server/registry.mjs",
      });
    });
  },
});
