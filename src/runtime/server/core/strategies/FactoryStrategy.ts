import type {
  MockDefinition,
  MockRequest,
  MockResponse,
  MockStrategy,
} from "../../../../types.js";
import { applyFaker, fakerGeneratorsVariables } from "../fakerMock/FakerMock.js";
import { expandFactory } from "../factoryExpand.js";

export class FactoryStrategy implements MockStrategy {
  async execute(
    request: MockRequest,
    definition: MockDefinition,
  ): Promise<MockResponse> {

    let metadata: any = undefined;

    if(definition?.response){
        metadata = typeof definition.response === "function"
        ? definition.response(request, fakerGeneratorsVariables)
        : definition.response;
    }

    const source = definition.factory
      ? await definition.factory(request, fakerGeneratorsVariables)
      : metadata && "body" in metadata
        ? metadata.body
        : undefined;

    if (source === undefined) throw new Error(`Missing factory: ${definition.name}`);

    return applyFaker(
      {
        status: metadata?.status ?? 200,
        headers: metadata?.headers,
        body: expandFactory(source, definition.count),
      },
      definition.seed,
    );
  }
}
