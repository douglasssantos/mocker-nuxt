const NUMBERED = /^\(\*\.\{(\d+)\}\)$|^\(\*\.(\d+)\)$/;
const FROM_COUNT = /^\(\*\.\{count\}\)$/;
const MAX_COPIES = 1000;

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {

    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function copiesOf(template: unknown, count: number, shared: Record<string, unknown>) {
  if (!Number.isInteger(count) || count < 0 || count > MAX_COPIES)
    throw Error(`Factory replication count must be between 0 and ${MAX_COPIES}`);
  return Array.from({ length: count }, () => {
    const item = clone(template);
    if (!Object.keys(shared).length) return item;
    if (item && typeof item === "object" && !Array.isArray(item))
      return { ...clone(shared), ...item };
    return item;
  });
}

/** Turns `{ "(*.{3})": item }` into an array of 3 copies of `item`. */
export function expandFactory(value: unknown, count?: number): unknown {
  if (Array.isArray(value)) return value.map((item) => expandFactory(item, count));
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value as Record<string, unknown>);
  const replica = entries.filter(([key]) => NUMBERED.test(key) || FROM_COUNT.test(key));
  if (!replica.length)
    return Object.fromEntries(
      entries.map(([key, item]) => [key, expandFactory(item, count)]),
    );
  if (replica.length > 1)
    throw Error("Only one (*.{count}) key is allowed in the same object");
  const [key, template] = replica[0];
  const numbered = NUMBERED.exec(key);
  const copies = numbered ? Number(numbered[1] ?? numbered[2]) : count;
  if (copies == null) throw Error(`Missing count for factory key ${key}`);
  const shared = Object.fromEntries(
    entries
      .filter(([name]) => name !== key)
      .map(([name, item]) => [name, expandFactory(item, count)]),
  );
  return copiesOf(expandFactory(template, count), copies, shared);
}
