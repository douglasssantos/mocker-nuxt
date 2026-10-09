import type { MockDefinition, MockRequest, MockResponse, MockStrategy } from "../../../../types.js";
export declare class FakerStrategy implements MockStrategy {
    execute(request: MockRequest, definition: MockDefinition): Promise<MockResponse>;
}
