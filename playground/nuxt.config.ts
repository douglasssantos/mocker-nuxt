import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  modules: [fileURLToPath(new URL("../src/module.ts", import.meta.url))],
  devtools: { enabled: true },
  ...(process.env.MOCKER_BUILD_DIR
    ? { buildDir: fileURLToPath(new URL(process.env.MOCKER_BUILD_DIR, import.meta.url)) }
    : {}),
  vite: {
    cacheDir: fileURLToPath(
      new URL(process.env.MOCKER_VITE_CACHE || "./.cache/vite", import.meta.url),
    ),
  },
  compatibilityDate: "latest",
  mockerServer: {
    basePath: "/api",
    directory: "./mocks",
    fallback: "proxy",
    defaultStrategy: "static",
    allowProduction: false,
    interceptExternal: true,
    targets: [
      {
        name: "purchase-api",
        baseURL:  "https://api.exemplo.com",
        mockBasePath: "/__mock",
      },
    ],
  },
  runtimeConfig: {
    mockerServer: {
      enabled: true,
      target: "https://api.exemplo.com",
    },
  },
});
