import type { MockStrategy } from "../../../types.js";
export class StrategyRegistry {
  private strategies = new Map<string, MockStrategy>();
  register(name: string, strategy: MockStrategy) {
    if (this.strategies.has(name)) throw Error(`Duplicate strategy ${name}`);
    this.strategies.set(name, strategy);
    return this;
  }
  get(name: string) {
    const result = this.strategies.get(name);
    if (!result) throw Error(`Unknown or unimplemented strategy: ${name}`);
    return result;
  }
}
