import type { MockStrategy } from "../../../types.js";
export declare class StrategyRegistry {
    private strategies;
    register(name: string, strategy: MockStrategy): this;
    get(name: string): MockStrategy;
}
