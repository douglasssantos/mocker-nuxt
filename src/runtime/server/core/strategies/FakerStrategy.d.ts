import type { MockDefinition, MockRequest, MockResponse, MockStrategy } from "../../../../types.js.js";
export declare class FakerStrategy implements MockStrategy {
    execute(request: MockRequest, definition: MockDefinition): Promise<MockResponse>;
}
