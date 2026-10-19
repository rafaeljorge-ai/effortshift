# EffortShift Local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Os pacotes paralelos abaixo pertencem à mesma task ES-001, com propriedade disjunta.

**Goal:** entregar um fork local utilizável com painel Claude nativo, cliente Codex visual e painel web.
**Architecture:** núcleo Node ESM e Codex App Server via stdio. Web sem framework, polling HTTP autenticado. Plugin Claude mantém o runtime upstream.
**Tech Stack:** Node >=22, node:test, HTTP nativo, HTML/CSS/JS, runtime Claude Code, agent-browser.
**Spec:** `.specs/001-effortshift-local/SPEC.md` e Planta vinculada.

## Global Constraints

- Node >=22, ESM; nenhuma nova dependência de runtime por padrão.
- API vinculante em docs/planta/02-TRD.md; backend e frontend não alteram contrato unilateralmente.
- Sem publicação, instalação global, mudança de credenciais/configurações reais ou alegação de economia.
- Somente leitura por padrão; autorizações de ferramenta explícitas, desconhecidos recusados.
- Nunca representar esforço recomendado como efetivamente enviado ou aceito.

## Review Focus

- Corrida entre dois prompts: reservar estado antes do primeiro await e responder 409 ao segundo.
- Cancelamento/desconexão: fechar subprocesso e rejeitar promises, sem UI presa nem confirmação falsa.
- Modelo sem esforço suportado: manter null em tarefa normal; recusar tarefa crítica sem piso high comprovado. Não inventar opções.
- HTTP host/origin/token e saída HTML/ANSI: negar acesso externo e renderizar somente texto.
- Atualizador Claude do upstream: não sobrescrever fork nem chamar remotos automaticamente.

### Task 1: ES-001 — fatia local completa

**Files pacote A:** create src/decision.mjs, src/codex-rpc.mjs, src/session.mjs, src/server.mjs, src/terminal.mjs, bin/effortshift.mjs, package.json, test/*.test.mjs e fixtures de protocolo sem dados reais.
**Files pacote B:** create web/index.html, web/app.js, web/styles.css; modify hooks/, types/, commands/, .claude-plugin/, tests/ e README.md somente conforme identidade/segurança do fork. Não editar ferramentas/site/textless ou dados históricos sem necessidade.
**Interfaces:** pacote A produz contrato HTTP/State integral da TRD. B consome exatamente essas rotas, mostra dados ausentes como indisponíveis e desabilita ação impossível. B pode criar documentação CLAUDE.md de uso, mas não alterar a Planta.

- [x] **Step 1: testes de regressão do motor/protocolo antes da implementação.** Em test/decision.test.mjs:
```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decideEffort} from '../src/decision.mjs';
test('não reduz risco crítico no econômico',()=>{
 const d=decideEffort({prompt:'Corrija RLS e permissões de tenant',profile:'economy',mode:'auto',supportedEfforts:['low','medium','high']});
 assert.equal(d.effort,'high');
});
```
Run `node --test test/decision.test.mjs`; esperado falhar por módulo ausente. Acrescentar testes de continuidade, esforço manual inválido, sem suporte, timeout RPC, aprovação desconhecida, resposta duplicada e corrida de prompts.
- [x] **Step 2: backend e CLI.** Implementar decideEffort e transporte com spawn sem shell, framing NDJSON, deadlines, correlação de ids, notificações e callbacks de aprovação. Sessão faz initialize/initialized e consulta catálogo antes de aceitar prompts. Turn/start recebe modelo e esforço suportados. Estado é reservado antes de awaits. `POST /api/prompt` retorna ao iniciar o turno e state polling acompanha. Aceite de RPC marca confirmed com explicação correta. Terminal usa readline e cabeçalho visual, comandos e saída sanitizada. Servidor imprime URL com fragmento de token somente no console local. CLI suporta `serve`, `codex`, `doctor`, `--port`, `--cwd`; sem flags de acesso irrestrito. `npm start` inicia serve; `npm test` roda apenas testes próprios.
- [x] **Step 3: frontend e Claude em paralelo.** Criar painel conforme DESIGN: carregamento, vazio, erro, conexão, modelos suportados, mensagem, aprovação, stop e responsive. Bearer vem do fragmento, removido da barra; texto do agente via textContent. Reusar e reidentificar plugin Claude para effortshift, incluindo commands e namespace; avisos originais MIT preservados. Nunca mudar URLs de terceiros de modo a inventar um repositório nosso; desabilitar update automático/manual que carregaria o upstream e explicar atualização local. Testes Claude ajustados e testes específicos para update desativado. README com comandos exatos para ambos, limitações e segurança.
- [x] **Step 4: verificar integração.** Run `npm test`, `npm run check`; validar/testar plugin local com claude plugin validate/test em árvore só do plugin (sem textless). HTTP tests de Authorization, Origin, Host, limite de body, settings inválidos e conflito. Smoke real via app-server somente leitura, modelo catálogo e resposta simples, com esforço submetido e aceite registrados sem conteúdo privado.
- [x] **Step 5: browser + revisão.** Iniciar `npm start`; agent-browser abre URL local autenticada, conecta, envia tarefa simples e valida resposta. Capturar desktop e 390px, verificar overflow, teclado, erro e cancelamento. Não capturar token. Revisor Sol high avalia diff, contrato, permissões e evidências; correções voltam ao implementador e recebem re-review focado. Atualizar QA_REPORT e STATUS. Entregar endereço/comandos locais sem alegar publicação ou merge.

## Autorrevisão

Todos os critérios PRD mapeados aos passos 1–5; interfaces únicas na TRD; ownership A/B sem interseção. Plano de execução escolhido pelo usuário: subagent-driven, paralelo quando seguro. Aprovação adicional dispensada pelo pedido explícito de criar/testar imediatamente. Não há requisito de abrir serviço externo.

## Evidência final

Todos os passos concluídos para a entrega local. 22/22 Node, sintaxe e 183/183 Claude verdes; agent-browser desktop/mobile com resposta e interrupção reais Codex. Revisão independente encontrou dois bugs de runtime, corrigidos com regressões e re-review sem impeditivos. Ver docs/QA_REPORT.md e docs/planta/STATUS.md. Sem publicação/commit/merge; teste nativo Claude interativo não comprovado, conforme limite registrado.
