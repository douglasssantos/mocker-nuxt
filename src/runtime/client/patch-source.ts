/** Classic script injected before the app bundle so ofetch captures the wrapper. */
export function browserPatchSource() {
  return `(() => {
  if (window.__mockerExternal) return
  window.__mockerExternal = true
  var originalFetch = window.fetch.bind(window)
  var ready = originalFetch('/__mocker/manifest', { cache: 'no-store' })
    .then(function (response) { return response.ok ? response.json() : { enabled: false, targets: [] } })
    .catch(function () { return { enabled: false, targets: [] } })
  function rewrite(manifest, href) {
    if (!manifest || !manifest.enabled || !manifest.targets) return null
    var url
    try { url = new URL(href, window.location.href) } catch (e) { return null }
    for (var i = 0; i < manifest.targets.length; i++) {
      var target = manifest.targets[i]
      var base = new URL(target.baseURL)
      if (!sameHost(base, url)) continue
      var basePath = base.pathname.replace(/\\/$/, '')
      if (basePath && url.pathname !== basePath && url.pathname.indexOf(basePath + '/') !== 0) continue
      var rest = url.pathname.slice(basePath.length) || '/'
      if (rest.charAt(0) !== '/') rest = '/' + rest
      var prefix = String(target.mockBasePath || '/__mock').replace(/\\/$/, '')
      return prefix + '/' + target.name + rest + url.search
    }
    return null
  }
  function portOf(url) {
    if (url.port) return url.port
    return url.protocol === 'https:' ? '443' : '80'
  }
  function sameHost(base, url) {
    if (base.hostname !== url.hostname) return false
    var left = portOf(base)
    var right = portOf(url)
    if (left === right) return true
    return (left === '80' || left === '443') && (right === '80' || right === '443')
  }
  function hrefOf(input) {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.href
    if (input && typeof input.url === 'string') return input.url
    return ''
  }
  window.fetch = function (input, init) {
    return ready.then(function (manifest) {
      var local = rewrite(manifest, hrefOf(input))
      if (!local) return originalFetch(input, init)
      return sendLocal(input, init, local)
    })
  }
  function sendLocal(input, init, local) {
    if (!(typeof Request !== 'undefined' && input instanceof Request)) return originalFetch(local, init)
    var method = String((init && init.method) || input.method || 'GET').toUpperCase()
    var headers = new Headers(input.headers)
    if (init && init.headers) new Headers(init.headers).forEach(function (value, key) { headers.set(key, value) })
    var opts = {
      method: method,
      headers: headers,
      credentials: 'same-origin',
      signal: (init && init.signal) || input.signal
    }
    if (method === 'GET' || method === 'HEAD') return originalFetch(local, opts)
    var provided = init && init.body != null ? Promise.resolve(init.body) : input.arrayBuffer()
    return provided.then(function (body) {
      if (body && !(body.byteLength === 0)) opts.body = body
      return originalFetch(local, opts)
    })
  }
  var origOpen = XMLHttpRequest.prototype.open
  var origSend = XMLHttpRequest.prototype.send
  var origHeader = XMLHttpRequest.prototype.setRequestHeader
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__mocker = {
      method: method,
      url: url,
      rest: Array.prototype.slice.call(arguments, 2),
      headers: []
    }
  }
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__mocker && this.__mocker.headers) {
      this.__mocker.headers.push([name, value])
      return
    }
    return origHeader.apply(this, arguments)
  }
  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this
    var info = xhr.__mocker
    if (!info) return origSend.apply(xhr, arguments)
    xhr.__mocker = null
    ready.then(function (manifest) {
      var url = info.url
      var local = rewrite(manifest, String(url))
      if (local) url = local
      origOpen.apply(xhr, [info.method, url].concat(info.rest))
      for (var i = 0; i < info.headers.length; i++) origHeader.apply(xhr, info.headers[i])
      origSend.call(xhr, body)
    })
  }
})()`;
}
