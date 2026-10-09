import type { MockDefinition, MockRegistryEntry } from "../../../types.js";
export interface MockRouteInfo {
    file: string;
    name: string;
    route: string;
    method: MockDefinition["method"];
    strategy: MockDefinition["strategy"];
    target?: string;
    enabled: boolean;
    delay?: number;
}
export declare class MockRegistry {
    private mocks;
    private records;
    register(entries: MockRegistryEntry[]): void;
    list(): MockRouteInfo[];
    resolve(method: string, path: string, target?: string): {
        definition: MockDefinition;
        params: Record<string, string>;
    } | null;
}
