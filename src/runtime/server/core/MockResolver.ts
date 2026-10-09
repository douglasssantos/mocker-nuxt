import type { MockDefinition, MockRequest, MockResponse } from '../../../types.js'
import { StrategyRegistry } from './StrategyRegistry.js'
import { FactoryStrategy } from './strategies/FactoryStrategy.js'
import { FakerStrategy } from './strategies/FakerStrategy.js'
import { ScenarioStrategy } from './strategies/ScenarioStrategy.js'
import { StaticStrategy } from './strategies/StaticStrategy.js'

export class MockResolver {
  readonly strategies = new StrategyRegistry()
    .register('static', new StaticStrategy())
    .register('factory', new FactoryStrategy())
    .register('scenario', new ScenarioStrategy())
    .register('faker', new FakerStrategy())

  async execute(
    definition: MockDefinition,
    request: MockRequest,
  ): Promise<MockResponse> {
    if (definition.delay && definition.delay > 0)
      await new Promise((r) =>
        setTimeout(r, Math.min(definition.delay!, 30000)),
      )
    return this.strategies
      .get(definition.strategy)
      .execute(request, definition)
  }
}
