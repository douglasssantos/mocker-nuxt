# Nuxt Mock Server

Módulo experimental para Nuxt 3/4: gateway Nitro que intercepta requisições de `/api/**`, devolve mocks declarados em arquivos `*.mock.ts` ou encaminha para a API real.

> **Estado: protótipo / pré-lançamento (0.1.0).** Os arquivos são fornecidos como base funcional para desenvolvimento e validação. Ainda não houve teste de ponta a ponta com instalação GitHub, Nuxt 3 e Nuxt 4 nesta entrega. Não habilite o mocking publicamente em produção sem completar os requisitos em `docs/PRODUCAO.md`.

## Requisitos

- Node.js >= 22.16
- Nuxt 3 ou 4
- Requisições HTTP passando pelo servidor Nuxt, ex. `$fetch('/api/purchases')`.

## Instalação a partir do GitHub

1. Publique esta pasta como repositório GitHub e confirme o build e os arquivos de `dist`.
2. Crie uma tag `v0.1.0`.
3. No projeto consumidor: `npm install github:USUARIO/mocker-nuxt#v0.1.0`.
4. Registre `mocker-nuxt` em `modules` no `nuxt.config.ts`.

Confira o `package.json` e o build antes de usar a tag: a saída do module-builder pode variar entre versões.

## Exemplo de configuração

```ts
export default defineNuxtConfig({
 modules: ['mocker-nuxt'],
 mockerServer: {
    basePath:'/api',
    directory:'./mocks',
    fallback:'proxy',
    defaultStrategy:'static',
    allowProduction:false
 },
 runtimeConfig: {
    mockerServer: { 
      enabled:false,
      target:''
    }
  }
})
```

`.env`:

```env
NUXT_MOCK_SERVER_ENABLED=true
NUXT_MOCK_SERVER_TARGET=https://api.exemplo.com
NUXT_MOCK_SERVER_SCENARIO=default
```

**Nota:** o formato do override de `runtimeConfig` é o padrão Nuxt. `allowProduction` exige opção explícita no build e deve ser evitada na produção pública.

`mocks/PurchaseData.mock.ts`:

```ts
import { defineMock } from 'mocker-nuxt/utils'
export default [
  defineMock({
    name:'purchase.list',
    route:'/api/purchases',
    method:'GET',
    strategy:'static',
    response: {
      status: 200,
      body: { 
        data: [
          {
            id: 1,
            amount: 4500
          }
        ]
      }
    }
  })
]
```

A aplicação acessa `$fetch('/api/purchases')` sem alteração. O interceptador Nitro só observa requisições que passam pelo servidor Nuxt: URLs absolutas que chamam diretamente outra origem não são capturadas.

## Estratégias

- `static`: resposta fixa ou função.
- `factory`: body gerado por função, com status/headers de `response`.
- `scenario`: escolhe `scenarios[NUXT_MOCK_SERVER_SCENARIO]`, fallback para `scenarios.default`.
- `faker`: reservado, **não implementado**; falha explicitamente.

## Arquitetura

`src/module.ts` descobre arquivos com Node `readdir({recursive:true})`, gera `.nuxt/mock-server/registry.mjs` por `addTemplate`, cria aliases e registra middleware Nitro. `MockRegistry` rejeita duplicações/ambiguidades e `MockResolver` escolhe a estratégia. Ausência de mock encaminha ao proxy (ou 404 se `fallback:'error'` quando o mock está ativado).

## Limitações de pré-lançamento

- Hot reload do conteúdo e reimportação do registry exigem testes de integração com Nuxt 3/4; o watcher regenerará o template para mudanças em nomes de arquivos.
- Proxies de uploads, streaming, headers/cookies e timeout precisam de testes de segurança e fidelidade.
- `faker` não está implementado e `scenario` é simples; não há mocks CRUD stateful.
- Runtime proxy URL não deve ser configurável pelo cliente HTTP. Restrinja env e rede de saída.
- `MockRegistry` é inicializado no carregamento do módulo Nitro; o template regenerado precisa provocar recarga correta em dev.

Veja `docs/ARQUITETURA.md`, `docs/PRODUCAO.md`, `docs/TESTES.md` e `examples/`.
