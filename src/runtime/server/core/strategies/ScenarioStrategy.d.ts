import type { MockDefinition, MockRequest, MockResponse, MockStrategy } from "../../../../types.js";
export declare class ScenarioStrategy implements MockStrategy {
    execute(_request: MockRequest, definition: MockDefinition): Promise<MockResponse>;
}
