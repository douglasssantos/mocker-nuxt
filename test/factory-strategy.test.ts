import { describe, expect, it } from "vitest";
import { expandFactory } from "../src/runtime/server/core/factoryExpand.js";
import { MockResolver } from "../src/runtime/server/core/MockResolver.js";
import type { MockRequest } from "../src/types.js";

const request: MockRequest = {
  method: "GET",
  path: "/api/catalog",
  params: {},
  query: {},
  headers: {},
};

describe("factory replication", () => {
  it("replaces a (*.{count}) key with that many copies", () => {
    expect(
      expandFactory({
        data: { "(*.{3})": { id: 1, product: "Notebook" } },
      }),
    ).toEqual({
      data: [
        { id: 1, product: "Notebook" },
        { id: 1, product: "Notebook" },
        { id: 1, product: "Notebook" },
      ],
    });
  });

  it("uses definition.count when the key is (*.{count})", () => {
    expect(expandFactory({ "(*.{count})": { id: 1 } }, 2)).toEqual([
      { id: 1 },
      { id: 1 },
    ]);
  });

  it("replicates nested templates and keeps sibling fields on each item", () => {
    expect(
      expandFactory({
        "(*.{2})": { id: 1, tags: { "(*.2)": { name: "sale" } } },
        kind: "purchase",
      }),
    ).toEqual([
      { kind: "purchase", id: 1, tags: [{ name: "sale" }, { name: "sale" }] },
      { kind: "purchase", id: 1, tags: [{ name: "sale" }, { name: "sale" }] },
    ]);
  });

  it("expands a factory response body through the strategy", async () => {
    const body = await new MockResolver().execute(
      {
        name: "catalog",
        route: "/api/catalog",
        method: "GET",
        strategy: "factory",
        response: {
          status: 200,
          body: { data: { "(*.{2})": { product: "Notebook" } } },
        },
      },
      request,
    );
    expect(body).toEqual({
      status: 200,
      headers: undefined,
      body: { data: [{ product: "Notebook" }, { product: "Notebook" }] },
    });
  });
});
