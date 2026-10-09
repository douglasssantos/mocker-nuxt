import { defineEventHandler, getRequestURL, setResponseHeader } from "h3";
import { useRuntimeConfig } from "#imports";
import entries from "#mock-registry";
import options from "#mock-options";
import { isMockingActive, snapshot, syncRegistry } from "../core/devtoolsState.js";

syncRegistry(entries);

function safeJson(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function currentSnapshot() {
  const config = useRuntimeConfig() as {
    mockerServer?: { enabled?: boolean };
  };
  const fallback = options.fallback === "error" ? "error" : "proxy";
  return snapshot({
    enabled: isMockingActive(config.mockerServer?.enabled, options.allowProduction),
    basePath: options.basePath,
    fallback,
    targets: (options.targets ?? []).map((target: { name: string; baseURL: string }) => ({
      name: target.name,
      baseURL: target.baseURL,
    })),
  });
}

const page = (payload: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mock Server</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #050505;
      color: #f3f3f3;
      font: 14px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      padding: 20px;
    }
    .card {
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 18px 20px 10px;
      background: #050505;
    }
    header { display: flex; align-items: center; gap: 10px; }
    .icon {
      width: 28px; height: 28px; flex: none;
      border: 1px solid #3a3a3a; border-radius: 7px;
      display: grid; place-items: center;
    }
    h1 { margin: 0; flex: 1; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
    .status { color: #8d8d8d; font-size: 13px; font-weight: 600; }
    .status.on { color: #3dd68c; }
    .stats {
      display: grid; grid-template-columns: repeat(3, 1fr);
      text-align: center; padding: 22px 0 6px;
    }
    .stats strong {
      display: block; font-size: 32px; font-weight: 600;
      letter-spacing: -0.04em; font-variant-numeric: tabular-nums;
    }
    .stats span { color: #8d8d8d; font-size: 13px; }
    .tabs { display: flex; gap: 18px; margin-top: 18px; border-bottom: 1px solid #1c1c1c; }
    .tab {
      appearance: none; background: none; border: 0; border-bottom: 2px solid transparent;
      color: #8d8d8d; padding: 8px 0; margin-bottom: -1px; cursor: pointer; font: inherit;
    }
    .tab.active { color: #f3f3f3; border-bottom-color: #3dd68c; }
    .panel { margin-top: 6px; }
    .panel[hidden] { display: none; }
    .row {
      display: flex; align-items: center; gap: 14px;
      padding: 11px 0; border-bottom: 1px solid #1c1c1c;
    }
    .row.off { opacity: 0.45; }
    .method { width: 58px; flex: none; font-size: 13px; font-weight: 700; color: #9a9a9a; }
    .method.get { color: #3dd68c; }
    .method.post { color: #6ea8fe; }
    .method.put { color: #e6b35a; }
    .method.patch { color: #c084fc; }
    .method.delete { color: #f07178; }
    .path { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .path-stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .row.request { align-items: flex-start; }
    .row.request .method, .row.request .meta, .row.request .tag { margin-top: 1px; }
    .intercept {
      color: #8d8d8d; font-size: 12px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .arrow { margin-right: 6px; }
    .row[role="button"] { cursor: pointer; }
    .row.selected { background: #111; margin: 0 -8px; padding-left: 8px; padding-right: 8px; border-radius: 8px; }
    .detail { margin: 8px 0 14px; padding: 4px 2px 8px; }
    .detail[hidden] { display: none; }
    .detail-label { margin: 12px 0 6px; color: #8d8d8d; font-size: 12px; font-weight: 600; }
    .detail-pre {
      margin: 0; white-space: pre-wrap; overflow-wrap: anywhere;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      background: #101010; border: 1px solid #1c1c1c; border-radius: 8px; padding: 10px;
    }
    .tag {
      flex: none; border: 1px solid rgba(61, 214, 140, 0.55); color: #3dd68c;
      border-radius: 999px; padding: 2px 10px; font-size: 12px; line-height: 1.5;
    }
    .tag.real, .tag.error { border-color: #4a4a4a; color: #b5b5b5; }
    .tag.error { border-color: rgba(240, 113, 120, 0.5); color: #f07178; }
    .meta { flex: none; color: #8d8d8d; font-size: 12px; font-variant-numeric: tabular-nums; }
    .empty { color: #8d8d8d; margin: 12px 0; }
  </style>
</head>
<body>
  <div class="card">
    <header>
      <div class="icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="#e8e8e8"/>
          <path d="M1.5 6h13M6 6v7.5" stroke="#e8e8e8"/>
        </svg>
      </div>
      <h1>Mock Server</h1>
      <span id="status" class="status">…</span>
    </header>
    <div class="stats">
      <div><strong id="mapped">0</strong><span>Mapped routes</span></div>
      <div><strong id="mocked">0</strong><span>Mocked requests</span></div>
      <div><strong id="proxied">0</strong><span>Proxied requests</span></div>
    </div>
    <div class="tabs" role="tablist">
      <button type="button" class="tab active" id="tab-routes" role="tab" aria-selected="true" aria-controls="routes-panel">Mapped routes</button>
      <button type="button" class="tab" id="tab-history" role="tab" aria-selected="false" aria-controls="history-panel">Request history</button>
    </div>
    <div id="routes-panel" class="panel" role="tabpanel">
      <div id="routes"></div>
    </div>
    <div id="history-panel" class="panel" role="tabpanel" hidden>
      <div id="recent"></div>
      <div id="detail" class="detail" hidden></div>
    </div>
  </div>
  <script>window.__MOCKER__ = ${payload}</script>
  <script>
    const labels = { static: "Static", factory: "Factory", faker: "Faker", scenario: "Scenario", proxy: "Real API" }
    const outcomes = { mocked: "Mocked", proxied: "Real API", error: "Error" }
    function el(tag, className, text) {
      const node = document.createElement(tag)
      if (className) node.className = className
      if (text != null) node.textContent = text
      return node
    }
    function requestRoute(event) {
      const absolute = event.detail && event.detail.url
      if (!absolute) return String(event.path || "").split("?")[0]
      try { return new URL(absolute).pathname || "/" } catch (error) { return event.path }
    }
    function mappedRoute(route) {
      if (/^https?:\\/\\//.test(route.route)) {
        try { return new URL(route.route).pathname || "/" } catch (error) { return route.route }
      }
      return route.route
    }
    function mappedAbsolute(route, targets) {
      if (/^https?:\\/\\//.test(route.route)) return route.route
      const target = route.target && (targets || []).find((item) => item.name === route.target)
      if (target) return String(target.baseURL).replace(/\\/$/, "") + route.route
      return window.location.origin + route.route
    }
    let lastData = null
    let selectedId = null
    let activeTab = "routes"
    function selectTab(name) {
      activeTab = name
      document.querySelector("#tab-routes").classList.toggle("active", name === "routes")
      document.querySelector("#tab-history").classList.toggle("active", name === "history")
      document.querySelector("#tab-routes").setAttribute("aria-selected", name === "routes" ? "true" : "false")
      document.querySelector("#tab-history").setAttribute("aria-selected", name === "history" ? "true" : "false")
      document.querySelector("#routes-panel").hidden = name !== "routes"
      document.querySelector("#history-panel").hidden = name !== "history"
    }
    function formatValue(value) {
      if (value == null || value === "") return "—"
      if (typeof value === "string") return value
      if (typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) return "—"
      try { return JSON.stringify(value, null, 2) } catch (error) { return String(value) }
    }
    function headerText(headers) {
      const lines = Object.entries(headers || {}).map((entry) => entry[0] + ": " + entry[1])
      return lines.length ? lines.join("\\n") : null
    }
    function showDetail(event) {
      const box = document.querySelector("#detail")
      box.replaceChildren()
      if (!event || !event.detail) {
        box.hidden = true
        return
      }
      box.hidden = false
      const blocks = [
        ["URL", event.detail.url],
        ["Query", event.detail.query],
        ["Headers", headerText(event.detail.headers)],
        ["Payload", event.detail.body],
        ["Response", event.detail.response],
      ]
      for (const block of blocks) {
        box.append(el("div", "detail-label", block[0]), el("pre", "detail-pre", formatValue(block[1])))
      }
    }
    function render(data) {
      lastData = data
      const status = document.querySelector("#status")
      status.textContent = data.enabled ? "Enabled" : "Disabled"
      status.className = data.enabled ? "status on" : "status"
      document.querySelector("#mapped").textContent = String(data.mapped)
      document.querySelector("#mocked").textContent = String(data.mocked)
      document.querySelector("#proxied").textContent = String(data.proxied)
      const routes = document.querySelector("#routes")
      routes.replaceChildren()
      if (!data.routes.length) {
        routes.append(el("p", "empty", "No mapped routes yet."))
      } else {
        for (const route of data.routes) {
          const row = el("div", route.enabled ? "row request" : "row request off")
          const detail = [route.name, route.file].filter(Boolean).join(" · ")
          if (detail) row.title = detail
          const stack = el("span", "path-stack")
          const mapped = el("span", "intercept")
          mapped.append(el("span", "arrow", "→"), document.createTextNode(" " + mappedAbsolute(route, data.targets)))
          stack.append(el("span", "path", mappedRoute(route)), mapped)
          row.append(
            el("span", "method " + String(route.method).toLowerCase(), route.method),
            stack,
            el("span", route.strategy === "proxy" ? "tag real" : "tag", labels[route.strategy] || route.strategy),
          )
          routes.append(row)
        }
      }
      const recent = document.querySelector("#recent")
      recent.replaceChildren()
      if (!data.recent.length) {
        recent.append(el("p", "empty", "No requests yet."))
        showDetail(null)
        return
      }
      for (const event of data.recent) {
        const row = el("div", event.id === selectedId ? "row request selected" : "row request")
        const outcome = outcomes[event.outcome] || event.outcome
        const tagClass = event.outcome === "proxied" ? "tag real" : event.outcome === "error" ? "tag error" : "tag"
        const stack = el("span", "path-stack")
        stack.append(el("span", "path", requestRoute(event)))
        if (event.detail && event.detail.url) {
          const intercepted = el("span", "intercept")
          intercepted.append(el("span", "arrow", "→"), document.createTextNode(" " + event.detail.url))
          stack.append(intercepted)
        }
        row.role = "button"
        row.tabIndex = 0
        row.setAttribute("aria-expanded", event.id === selectedId ? "true" : "false")
        row.append(
          el("span", "method " + String(event.method).toLowerCase(), event.method),
          stack,
          el("span", "meta", event.status + " · " + event.latency + " ms"),
          el("span", tagClass, outcome),
        )
        const toggle = () => {
          selectedId = selectedId === event.id ? null : event.id
          render(lastData)
        }
        row.addEventListener("click", toggle)
        row.addEventListener("keydown", (keyEvent) => {
          if (keyEvent.key === "Enter" || keyEvent.key === " ") {
            keyEvent.preventDefault()
            toggle()
          }
        })
        recent.append(row)
      }
      showDetail(data.recent.find((event) => event.id === selectedId))
    }
    async function refresh() {
      const response = await fetch("/__mocker/state", { cache: "no-store" })
      if (!response.ok) throw new Error(String(response.status))
      render(await response.json())
    }
    document.querySelector("#tab-routes").addEventListener("click", () => selectTab("routes"))
    document.querySelector("#tab-history").addEventListener("click", () => selectTab("history"))
    render(window.__MOCKER__)
    setInterval(() => { refresh().catch(() => {}) }, 1000)
  </script>
</body>
</html>`;

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;
  setResponseHeader(event, "cache-control", "no-store");
  if (path === "/__mocker/state") return currentSnapshot();
  setResponseHeader(event, "content-type", "text/html; charset=utf-8");
  return page(safeJson(currentSnapshot()));
});
