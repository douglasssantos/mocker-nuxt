import { applyFaker } from "../fakerMock/FakerMock.js";
export class ScenarioStrategy {
  async execute(_request, definition) {
    const name = process.env.NUXT_MOCK_SERVER_SCENARIO || "default";
    const response = definition.scenarios?.[name] ?? definition.scenarios?.default;
    if (!response)
      throw Error(`Scenario ${name} missing for ${definition.name}`);
    return applyFaker(response, definition.seed);
  }
}
