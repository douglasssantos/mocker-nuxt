import type {
  MockDefinition,
  MockRequest,
  MockResponse,
  MockStrategy,
} from "../../../../types.js";
import { applyFaker, fakerGeneratorsVariables } from "../fakerMock/FakerMock.js";

export class StaticStrategy implements MockStrategy {
  async execute(
    request: MockRequest,
    definition: MockDefinition,
  ): Promise<MockResponse> {
    const response =
      typeof definition.response === "function"
        ? await definition.response(request, fakerGeneratorsVariables)
        : definition.response;
    if (!response) throw Error(`Missing static response: ${definition.name}`);
    return applyFaker(response, definition.seed);
  }
}
