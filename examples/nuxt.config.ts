export default defineNuxtConfig({
  modules: ["mocker-nuxt"],
  mockerServer: {
    basePath: "/api",
    directory: "./mocks",
    fallback: "proxy",
    defaultStrategy: "static",
    allowProduction: false,
  },
  runtimeConfig: { mockerServer: { enabled: false, target: "" } },
});
