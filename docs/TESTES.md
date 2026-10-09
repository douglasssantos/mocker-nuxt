# Plano de testes

## Unitários (Vitest)
- RouteMatcher: /api/a/:id, method, query ignorada no pathname, URI inválida, trailing slash.
- MockRegistry: nomes repetidos, assinatura equivalente, ambiguidades e rota desligada.
- MockResolver: static sync/async, factory status/headers, scenario default, delay limitado, faker ainda não implementado.
- discoverMocks: diretório inexistente e diretórios aninhados.

## Integração (Nuxt test-utils)
- Instalação do pacote via GitHub e build remoto.
- Nuxt 3 e 4; Node 22 LTS e Node 24 LTS.
- `$fetch`, `useFetch` SSR/hidratação e Axios com `/api`.
- Env on/off; fallback proxy/error; endpoint real e simulated.
- POST com JSON; envio de arquivos sem consumir o stream; cookie e bearer headers.
- Status 201/204/304/4xx/5xx, latência, binário, stream e redirects.
- Watcher: criar, editar, remover mocks ao vivo.
- Verificar ausência de dados de mocking no bundle client.

## Segurança
- Mock desativado em produção sem allowProduction.
- Upstream URL não controlável pelo cliente e host allowlist.
- Headers sensíveis não aparecendo em logs.
- Resistência a SSRF, path traversal, DNS rebinding e leaks entre tenants.

## Executar
`npm install && npm run build && npm run test` (a compilação deve ser validada no seu ambiente Nuxt/Node; esta entrega não incluiu execução end-to-end).
