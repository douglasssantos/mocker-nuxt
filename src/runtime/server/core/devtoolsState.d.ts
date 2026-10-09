import type { MockRegistryEntry } from "../../../types.js.js";
import { MockRegistry, type MockRouteInfo } from "./MockRegistry.js.js";
export type PanelStrategy = MockRouteInfo["strategy"] | "proxy";
export interface PanelRoute extends Omit<MockRouteInfo, "strategy"> {
    strategy: PanelStrategy;
}
export interface ExchangeDetail {
    url: string;
    query: Record<string, unknown>;
    headers: Record<string, string>;
    body?: unknown;
    response?: unknown;
}
export interface MockerExchange {
    id: number;
    at: number;
    method: string;
    path: string;
    status: number;
    latency: number;
    outcome: "mocked" | "proxied" | "error";
    strategy?: string;
    detail?: ExchangeDetail;
}
export interface MockerSnapshot {
    enabled: boolean;
    basePath: string;
    fallback: "proxy" | "error";
    targets: {
        name: string;
        baseURL: string;
    }[];
    mapped: number;
    mocked: number;
    proxied: number;
    routes: PanelRoute[];
    recent: MockerExchange[];
}
export declare function exchangeDetail(input: {
    url: string;
    query?: Record<string, unknown>;
    headers?: Record<string, string | undefined>;
    body?: unknown;
    response?: unknown;
}): ExchangeDetail;
export declare function resetMockerState(): void;
export declare function syncRegistry(entries: MockRegistryEntry[]): MockRegistry;
export declare function isMockingActive(enabled: boolean | undefined, allowProduction: boolean): boolean;
export declare function recordExchange(exchange: Omit<MockerExchange, "id" | "at">): void;
export declare function snapshot(input: {
    enabled: boolean;
    basePath: string;
    fallback: "proxy" | "error";
    targets?: {
        name: string;
        baseURL: string;
    }[];
}): MockerSnapshot;
