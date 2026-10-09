import { applyFaker, fakerGeneratorsVariables } from "../fakerMock/FakerMock.js";
export class StaticStrategy {
  async execute(request, definition) {
    const response = typeof definition.response === "function" ? await definition.response(request, fakerGeneratorsVariables) : definition.response;
    if (!response) throw Error(`Missing static response: ${definition.name}`);
    return applyFaker(response, definition.seed);
  }
}
