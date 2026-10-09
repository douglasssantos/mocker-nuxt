export class StrategyRegistry {
  strategies = /* @__PURE__ */ new Map();
  register(name, strategy) {
    if (this.strategies.has(name)) throw Error(`Duplicate strategy ${name}`);
    this.strategies.set(name, strategy);
    return this;
  }
  get(name) {
    const result = this.strategies.get(name);
    if (!result) throw Error(`Unknown or unimplemented strategy: ${name}`);
    return result;
  }
}
