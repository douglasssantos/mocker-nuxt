import type { H3Event } from "h3";
import type { MockResponse } from "../../../types.js";
export declare function externalRegistry(): import("../core/MockRegistry.js").MockRegistry;
export declare function runExternalMock(input: {
    targetName: string;
    baseURL: string;
    path: string;
    search?: string;
    method: string;
    query: Record<string, unknown>;
    headers: Record<string, string | undefined>;
    body?: unknown;
}): Promise<MockResponse | null>;
export declare function queryFromEvent(event: H3Event): Record<string, unknown>;
