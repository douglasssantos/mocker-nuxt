import type { MockDefinition, MockRequest, MockResponse } from '../../../types.js.js';
import { StrategyRegistry } from './StrategyRegistry.js.js';
export declare class MockResolver {
    readonly strategies: StrategyRegistry;
    execute(definition: MockDefinition, request: MockRequest): Promise<MockResponse>;
}
