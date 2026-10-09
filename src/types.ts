import type { FakerGeneratorMethods } from "./runtime/server/core/fakerMock/FakerMock.ts";

export type MockMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, unknown>;
  headers: Record<string, string | undefined>;
  body?: unknown;
}
export interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}
export interface MockStrategy {
  execute(
    request: MockRequest,
    definition: MockDefinition,
  ): Promise<MockResponse>;
}
export interface MockTarget {
  name: string;
  baseURL: string;
  mockBasePath?: string;
}
export interface MockDefinition {
  name: string;
  route: string;
  method: MockMethod;
  /** External API registered in `targets`. Absolute calls to that API use this mock. */
  target?: string;
  enabled?: boolean;
  delay?: number;
  strategy: "static" | "factory" | "faker" | "scenario";
  response?:
    | MockResponse
    | ((request: MockRequest, fakerGenerators: FakerGeneratorMethods) => MockResponse | Promise<MockResponse>);
  factory?: (request: MockRequest, fakerGenerators: FakerGeneratorMethods) => unknown | Promise<unknown>;
  count?: number;
  seed?: number;
  scenarios?: Record<string, MockResponse>;
}
export interface MockRegistryEntry {
  file: string;
  definitions: MockDefinition | MockDefinition[];
}
export interface MockOptions {
  basePath: string;
  directory: string;
  fallback: "proxy" | "error";
  defaultStrategy: MockDefinition["strategy"];
  allowProduction: boolean;
  /** Rewrite absolute calls to `targets` onto the mock server. */
  interceptExternal: boolean;
  targets: MockTarget[];
}
