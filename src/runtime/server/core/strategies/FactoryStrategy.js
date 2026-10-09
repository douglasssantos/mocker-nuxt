import { applyFaker, fakerGeneratorsVariables } from "../fakerMock/FakerMock.js";
import { expandFactory } from "../factoryExpand.js";
export class FactoryStrategy {
  async execute(request, definition) {
    let metadata = void 0;
    if (definition?.response) {
      metadata = typeof definition.response === "function" ? definition.response(request, fakerGeneratorsVariables) : definition.response;
    }
    const source = definition.factory ? await definition.factory(request, fakerGeneratorsVariables) : metadata && "body" in metadata ? metadata.body : void 0;
    if (source === void 0) throw new Error(`Missing factory: ${definition.name}`);
    return applyFaker(
      {
        status: metadata?.status ?? 200,
        headers: metadata?.headers,
        body: expandFactory(source, definition.count)
      },
      definition.seed
    );
  }
}
