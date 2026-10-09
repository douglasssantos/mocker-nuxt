# Arquitetura técnica

## Fluxo
1. O cliente chama um caminho relativo (`/api/...`) dentro do mesmo domínio do Nuxt.
2. O middleware Nitro verifica se pertence ao `basePath`.
3. Se `NUXT_MOCK_SERVER_ENABLED=true` e mocking for permitido no ambiente, consulta o registry por método + path.
4. Havendo match: prepara `MockRequest` com params/query/headers/body; `MockResolver` executa a Strategy.
5. Se não houver match: encaminha para `NUXT_MOCK_SERVER_TARGET` com `proxyRequest`, ou retorna 404 no fallback error.
6. Se mocking está desligado: sempre realiza proxy para as rotas do gateway.

## Núcleos
- `discoverMocks`: Node FS nativo; arquivos `**/*.mock.ts`.
- `module.ts`: template de registry gerado; aliases para Nitro; watcher.
- `MockRegistry`: validação de nomes, rotas e ambiguidades.
- `RouteMatcher`: match por segmentos e parâmetros `:id`.
- `StrategyRegistry`: dispatch de estratégias.
- `MockResolver`: Static, Factory, Scenario; Faker ainda pendente.
- `interceptor`: HTTP e proxy.

## Decisões
- Dados de mocking pertencem ao app consumidor; motor pertence ao pacote.
- Mock não faz chamadas à API real; erro de execução do mock NÃO aciona fallback automático.
- Somente requisições roteadas pelo Nitro são interceptadas. SDKs externos, chamadas no browser à URL absoluta, WebSockets e GraphQL fora do basePath precisam de estratégia separada.
- Os mocks são confiáveis apenas quando escritos por desenvolvedores autorizados: funções TypeScript têm capacidade de executar código no servidor.

## Contrato de definição
`name`, `route`, `method`, `strategy`; opcionais `enabled`, `delay`, `response`, `factory`, `scenarios`.

## Produção e SSR
Configurações `basePath`, `directory`, `fallback` e `allowProduction` são build-time; `runtimeConfig.mockerServer.enabled` e `target` são runtime. O env `NUXT_MOCK_SERVER_ENABLED` controla runtime; `allowProduction` determina se o build permite mocks em produção.
