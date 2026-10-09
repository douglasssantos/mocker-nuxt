import type { MockDefinition } from "../types.js";
export function defineMock<T extends MockDefinition>(definition: T): T {
  return definition;
}
export type {
  MockDefinition,
  MockRequest,
  MockResponse,
  MockMethod,
} from "../types.js";
