# Checklist de produção e segurança

**Este repositório é base de engenharia, não liberação GA.** Antes de usar em produção:

## P0 bloqueantes
- [ ] Instalar o pacote de uma tag GitHub limpa em projetos Nuxt 3 e Nuxt 4.
- [ ] Validar `nuxt prepare`, `nuxt build`, `.output/server/index.mjs` e os exports de `dist`.
- [ ] Garantir que o middleware não sombreie endpoints Nitro existentes sob `/api` sem decisão explícita.
- [ ] Testar requests multipart, streaming, HEAD, 204, 304 e todas as classes HTTP.
- [ ] Auditar headers hop-by-hop, redirecionamento e encaminhamento de Authorization/Cookie/Set-Cookie.
- [ ] Implementar allowlist de hostname/IP do upstream; mitigar SSRF, DNS rebinding, IPs internos, redirecionamentos e acesso a metadata cloud.
- [ ] Validar normalização de path, segmentos codificados, traversal e query.
- [ ] Validar reinicialização do Nitro/HMR ao alterar mocks; remoção e inclusão dinâmica.
- [ ] Aplicar limite de body/tamanho de resposta, timeout e tratamento de exceções.
- [ ] Implementar testes E2E SSR e client para todas as versões suportadas.
- [ ] Desabilitar inspector e debugging em produção, sem logar PII ou credenciais.
- [ ] Revisar `allowProduction`: manter `false` como padrão e exigir aprovação no deploy.
- [ ] Validar gerenciamento de dependências e releases assinadas/tag imutável.

## P1
- [ ] Implementar faker reproduzível com seed sem dependência acidental de estado global.
- [ ] Request matcher por headers, body, query, params.
- [ ] Validar contratos e schemas; fixtures sanitizadas.
- [ ] Middleware de métricas sem dados confidenciais.
- [ ] Suporte a rotas wildcard e constraints sem ambiguidade.
- [ ] Testes de concorrência, SSR e multiusuário.

## P2
- [ ] Nuxt DevTools Inspector autenticado.
- [ ] Record-and-replay com mascaramento e consentimento.
- [ ] CLI e geração de fixtures a partir de OpenAPI.
