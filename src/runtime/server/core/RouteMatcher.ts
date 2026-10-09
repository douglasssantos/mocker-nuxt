export class RouteMatcher {
  static normalize(path: string) {
    const x = "/" + path.replace(/^\/+|\/+$/g, "");
    return x.replace(/\/{2,}/g, "/");
  }
  static signature(path: string) {
    return this.normalize(path).replace(/:[A-Za-z_]\w*/g, ":param");
  }
  static match(pattern: string, path: string): Record<string, string> | null {
    const expected = this.normalize(pattern).split("/").filter(Boolean);
    const actual = this.normalize(path).split("/").filter(Boolean);
    if (expected.length !== actual.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < expected.length; i++) {
      if (expected[i].startsWith(":")) {
        try {
          params[expected[i].slice(1)] = decodeURIComponent(actual[i]);
        } catch {
          return null;
        }
      } else if (expected[i] !== actual[i]) return null;
    }
    return params;
  }
}
