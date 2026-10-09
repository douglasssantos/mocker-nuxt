import { getQuery } from "h3";
import type { H3Event } from "h3";
import entries from "#mock-registry";
import { MockResolver } from "../core/MockResolver.js";
import { exchangeDetail, recordExchange, syncRegistry } from "../core/devtoolsState.js";
import type { MockRequest, MockResponse } from "../../../types.js";
import { externalUrl } from "../../shared/externalMatch.js";

const registry = syncRegistry(entries);
const resolver = new MockResolver();

export function externalRegistry() {
  return registry;
}

export async function runExternalMock(input: {
  targetName: string;
  baseURL: string;
  path: string;
  search?: string;
  method: string;
  query: Record<string, unknown>;
  headers: Record<string, string | undefined>;
  body?: unknown;
}): Promise<MockResponse | null> {
  const match = registry.resolve(input.method, input.path, input.targetName);
  if (!match) return null;
  const started = Date.now();
  const request: MockRequest = {
    method: input.method,
    path: input.path,
    params: match.params,
    query: input.query,
    headers: input.headers,
    body: input.body,
  };
  const url = externalUrl(input.baseURL, input.path, input.search).toString();
  try {
    const response = await resolver.execute(match.definition, request);
    recordExchange({
      method: input.method,
      path: url,
      status: response.status,
      latency: Date.now() - started,
      outcome: "mocked",
      strategy: match.definition.strategy,
      detail: exchangeDetail({
        url,
        query: input.query,
        headers: input.headers,
        body: input.body,
        response: response.body,
      }),
    });
    return response;
  } catch (error) {
    recordExchange({
      method: input.method,
      path: url,
      status: 500,
      latency: Date.now() - started,
      outcome: "error",
      strategy: match.definition.strategy,
      detail: exchangeDetail({
        url,
        query: input.query,
        headers: input.headers,
        body: input.body,
      }),
    });
    throw error;
  }
}

export function queryFromEvent(event: H3Event) {
  return getQuery(event) as Record<string, unknown>;
}
