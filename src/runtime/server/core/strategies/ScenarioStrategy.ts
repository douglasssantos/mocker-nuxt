import type {
  MockDefinition,
  MockRequest,
  MockResponse,
  MockStrategy,
} from "../../../../types.js";
import { applyFaker } from "../fakerMock/FakerMock.js";

export class ScenarioStrategy implements MockStrategy {
  async execute(
    _request: MockRequest,
    definition: MockDefinition,
  ): Promise<MockResponse> {
    const name = process.env.NUXT_MOCK_SERVER_SCENARIO || "default";
    const response =
      definition.scenarios?.[name] ?? definition.scenarios?.default;
    if (!response)
      throw Error(`Scenario ${name} missing for ${definition.name}`);
    return applyFaker(response, definition.seed);
  }
}
