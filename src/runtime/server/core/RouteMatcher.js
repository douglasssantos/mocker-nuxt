export class RouteMatcher {
  static normalize(path) {
    const x = "/" + path.replace(/^\/+|\/+$/g, "");
    return x.replace(/\/{2,}/g, "/");
  }
  static signature(path) {
    return this.normalize(path).replace(/:[A-Za-z_]\w*/g, ":param");
  }
  static match(pattern, path) {
    const expected = this.normalize(pattern).split("/").filter(Boolean);
    const actual = this.normalize(path).split("/").filter(Boolean);
    if (expected.length !== actual.length) return null;
    const params = {};
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
