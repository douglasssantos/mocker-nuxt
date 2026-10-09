const NUMBERED = /^\(\*\.\{(\d+)\}\)$|^\(\*\.(\d+)\)$/;
const FROM_COUNT = /^\(\*\.\{count\}\)$/;
const MAX_COPIES = 1e3;
function clone(value) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
    }
  }
  return JSON.parse(JSON.stringify(value));
}
function copiesOf(template, count, shared) {
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
export function expandFactory(value, count) {
  if (Array.isArray(value)) return value.map((item) => expandFactory(item, count));
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value);
  const replica = entries.filter(([key2]) => NUMBERED.test(key2) || FROM_COUNT.test(key2));
  if (!replica.length)
    return Object.fromEntries(
      entries.map(([key2, item]) => [key2, expandFactory(item, count)])
    );
  if (replica.length > 1)
    throw Error("Only one (*.{count}) key is allowed in the same object");
  const [key, template] = replica[0];
  const numbered = NUMBERED.exec(key);
  const copies = numbered ? Number(numbered[1] ?? numbered[2]) : count;
  if (copies == null) throw Error(`Missing count for factory key ${key}`);
  const shared = Object.fromEntries(
    entries.filter(([name]) => name !== key).map(([name, item]) => [name, expandFactory(item, count)])
  );
  return copiesOf(expandFactory(template, count), copies, shared);
}
