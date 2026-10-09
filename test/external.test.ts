import { describe, expect, it } from "vitest";
import {
  externalUrl,
  parseInternalPath,
  rewriteAbsoluteUrl,
} from "../src/runtime/shared/externalMatch.js";

const target = {
  name: "purchase-api",
  baseURL: "https://api.exemplo.com",
  mockBasePath: "/__mock",
};

describe("external URL rewriting", () => {
  it("rewrites a matching absolute URL to the internal mock path", () => {
    expect(rewriteAbsoluteUrl("https://api.exemplo.com/purchases?page=2", [target])).toBe(
      "/__mock/purchase-api/purchases?page=2",
    );
  });

  it("rewrites https when the target is registered as http on the same host", () => {
    expect(
      rewriteAbsoluteUrl("https://api.exemplo.com/purchases", [
        { name: "purchase-api", baseURL: "http://api.exemplo.com" },
      ]),
    ).toBe("/__mock/purchase-api/purchases");
  });

  it("leaves unrelated origins untouched", () => {
    expect(rewriteAbsoluteUrl("https://other.example/purchases", [target])).toBeNull();
    expect(rewriteAbsoluteUrl("/api/purchases", [target])).toBeNull();
  });

  it("round-trips the internal path back to the real URL", () => {
    expect(parseInternalPath("/__mock/purchase-api/purchases", [target])).toEqual({
      name: "purchase-api",
      baseURL: "https://api.exemplo.com",
      path: "/purchases",
    });
    expect(externalUrl("https://api.exemplo.com", "/purchases", "?page=2").href).toBe(
      "https://api.exemplo.com/purchases?page=2",
    );
  });
});
