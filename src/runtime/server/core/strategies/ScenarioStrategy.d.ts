import type { MockDefinition, MockRequest, MockResponse, MockStrategy } from "../../../../types.js.js";
export declare class ScenarioStrategy implements MockStrategy {
    execute(_request: MockRequest, definition: MockDefinition): Promise<MockResponse>;
}
