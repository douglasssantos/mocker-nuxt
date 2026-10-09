export function normalizeTarget(target) {
  const baseURL = target.baseURL.replace(/\/$/, "");
  const mockBasePath = (target.mockBasePath || "/__mock").replace(/\/$/, "") || "/__mock";
  return { name: target.name, baseURL, mockBasePath };
}
function portOf(url) {
  if (url.port) return url.port;
  return url.protocol === "https:" ? "443" : "80";
}
export function sameTargetHost(baseURL, absolute) {
  const base = new URL(baseURL);
  if (base.hostname !== absolute.hostname) return false;
  const left = portOf(base);
  const right = portOf(absolute);
  if (left === right) return true;
  return (left === "80" || left === "443") && (right === "80" || right === "443");
}
export function relativeToTarget(baseURL, absolute) {
  const base = new URL(baseURL);
  if (!sameTargetHost(baseURL, absolute)) return null;
  const basePath = base.pathname.replace(/\/$/, "");
  if (basePath && absolute.pathname !== basePath && !absolute.pathname.startsWith(basePath + "/"))
    return null;
  const rest = absolute.pathname.slice(basePath.length) || "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}
export function internalMockPath(target, path, search = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${target.mockBasePath}/${target.name}${normalized}${search}`;
}
export function rewriteAbsoluteUrl(href, targets) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  for (const raw of targets) {
    const target = normalizeTarget(raw);
    const path = relativeToTarget(target.baseURL, url);
    if (path == null) continue;
    return internalMockPath(target, path, url.search);
  }
  return null;
}
export function parseInternalPath(pathname, targets) {
  for (const raw of targets) {
    const target = normalizeTarget(raw);
    const prefix = `${target.mockBasePath}/${target.name}`;
    if (pathname !== prefix && !pathname.startsWith(prefix + "/")) continue;
    const rest = pathname.slice(prefix.length) || "/";
    return {
      name: target.name,
      baseURL: target.baseURL,
      path: rest.startsWith("/") ? rest : `/${rest}`
    };
  }
  return null;
}
export function externalUrl(baseURL, path, search = "") {
  const url = new URL(baseURL);
  const basePath = url.pathname.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  url.pathname = `${basePath}${suffix}` || "/";
  url.search = search;
  return url;
}
