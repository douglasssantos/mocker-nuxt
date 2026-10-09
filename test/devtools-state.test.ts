import { beforeEach, describe, expect, it } from "vitest";
import {
  recordExchange,
  resetMockerState,
  snapshot,
  syncRegistry,
} from "../src/runtime/server/core/devtoolsState.js";

beforeEach(() => resetMockerState());

describe("devtools snapshot", () => {
  it("counts mocked routes and lists proxied calls as the real API", () => {
    syncRegistry([
      {
        file: "mocks/a.mock.ts",
        definitions: {
          name: "purchase.list",
          route: "/api/purchases",
          method: "GET",
          strategy: "static",
          response: { status: 200, body: {} },
        },
      },
    ]);
    recordExchange({
      method: "GET",
      path: "/api/purchases",
      status: 200,
      latency: 4,
      outcome: "mocked",
      strategy: "static",
    });
    recordExchange({
      method: "GET",
      path: "/api/reports",
      status: 200,
      latency: 20,
      outcome: "proxied",
    });
    const view = snapshot({ enabled: true, basePath: "/api", fallback: "proxy" });
    expect(view.mapped).toBe(1);
    expect(view.mocked).toBe(1);
    expect(view.proxied).toBe(1);
    expect(view.routes.map((route) => route.strategy)).toEqual(["static", "proxy"]);
    expect(view.routes[1]?.route).toBe("/api/reports");
    expect(view.recent[0]?.path).toBe("/api/reports");
  });

  it("keeps the original URL, headers, query and payload on a request", () => {
    recordExchange({
      method: "POST",
      path: "https://api.exemplo.com/purchases",
      status: 200,
      latency: 3,
      outcome: "mocked",
      strategy: "static",
      detail: {
        url: "https://api.exemplo.com/purchases?page=2",
        query: { page: "2" },
        headers: { accept: "application/json", authorization: "Bearer secret" },
        body: { product: "Notebook", amount: 4500 },
        response: { source: "external-mock" },
      },
    });
    const view = snapshot({ enabled: true, basePath: "/api", fallback: "proxy" });
    expect(view.recent[0]?.detail).toMatchObject({
      url: "https://api.exemplo.com/purchases?page=2",
      query: { page: "2" },
      headers: { accept: "application/json", authorization: "Bearer secret" },
      body: { product: "Notebook", amount: 4500 },
      response: { source: "external-mock" },
    });
  });
});
