# ES-002 — Painel EffortShift na TUI Codex

Autorização: Rafael pediu criar o painel igual ao Claude e estudar toda a estrutura do effortless para adaptar ao Codex. Trabalho local reversível; sem commit, push, release ou alteração do executável oficial. Branch `feat/effortshift-native-panel`, independente da ES-001 já integrada em `8659d21`.

## Contrato e fio vertical

Referência aprovada: screenshots do usuário e implementação Claude em `hooks/register.tsx`, `agents.tsx`, `progress.tsx`, `theme.ts`, `art.ts` e `types/index.d.ts`. Estudar o conjunto e registrar a matriz de capacidades antes de declarar equivalência. A referência não autoriza novos provedores, custos ou credenciais.

Fio: composer nativo → política de esforço → parâmetro real do turno → painel acima do composer. Distribuir como patch da fonte oficial OpenAI Codex rust-v0.163.0, commit `83086188ae0614bd882818ff1aa23f3194962012`, com build e comando separados. Preservar sandbox, permissões, autenticação, ferramentas e configuração oficial.

## Aceite

- Faixa persistente acima do composer, esforço limitado ao catálogo; seleção manual prevalece sobre Auto, incluindo seletor nativo e modo Plan. Controles acessíveis sem capturar texto nem foco de modais.
- Auto explícito por regras locais do núcleo existente, sem fingir avaliador Haiku/Jev. Resolver antes de capturar o esforço do turno; não rebaixar turno em execução ao receber steering. Sem esforço compatível não confirmar aplicação.
- Cota/reset reais do Codex e aviso âmbar a partir de 80%; ausência de dados fica explícita. Save mode limita Auto sem eliminar piso de risco, expira com a janela. Nunca copiar números do Claude nem alegar economia.
- Layout em 120×35, 80×24 e 50×20; composer, popups, perguntas e aprovações preservados. Cores seguem a referência com informação textual; sem depender de animações ou SVG.
- Estudo completo com matriz Claude→Codex: painel/estado, julgador, cache/contexto, handoff/compact, progresso/agentes, configurações, medição, atualização. Lacunas ficam registradas, sem equivalência inventada.

## Ajuste de uso macOS — mesmo painel

Rafael pediu painel padrão nas novas sessões do terminal, indicadores sem aparência de botões inativos e controles sem Alt. Autorização local reversível inclui configuração shell do usuário com backup; executável oficial e perfis/trust preservados, sem commit/push/release.

Rafael confirmou Auto ligado por padrão nas novas sessões. Desligar explicitamente ou escolher esforço manual deve continuar soberano durante a sessão. A verificação operacional inclui o esforço efetivamente enviado; saudação não pode rebaixar uma implementação ou investigação reconhecida.

Na auditoria, Rafael autorizou explicitamente revisar e aprovar somente os hooks Stripe corrigidos pela interface oficial. Quatro handlers suportados receberam novo hash de confiança individualmente no perfil `~/.codex`; os demais estados/configurações foram preservados, com backup e comparação semântica. Sem bypass ou confiança geral.

- `codex` e `codex-rafael` interativos no zsh abrem o painel automaticamente; o segundo preserva seu `CODEX_HOME`; exec, plugins, autenticação, servidor e utilitários seguem pelo CLI oficial. Caminhos absolutos, IDE e Desktop não são interceptados.
- Painel informativo: próximo esforço, estados Auto/Save e quota, sem falsos botões ou níveis clicáveis.
- `/effortshift auto` e `/effortshift save` controlam os estados localmente, sem enviar prompt ao modelo; `/effortshift` explica o uso. `/model` permanece seletor nativo de esforço. Nenhum atalho Alt necessário.
- Preservar rascunho, permissões e foco; testar dispatch/argumentos inválidos, render e PTY com comandos digitados; atualizar instalação e revisão independente.

## Gates

Testes/evals da política e integração de envio (manual/Auto/Plan, catálogo ausente, segurança/financeiro, continuidade e steering), renderização Ratatui em tamanhos reduzidos; build Rust locked, testes Node/sintaxe do pacote e instalação isolada. Smoke PTY do executável separado e evidência visual real. Revisão independente; inferência bloqueada por quota deve permanecer pendente.

## Ownership

Coordenador: esta cápsula, STATUS, matriz de estudo, patch versionado, scripts de build/instalação e gates Node. Executor Sol medium: somente fonte Rust externa em `/Volumes/mavikai-ssd512/effortshift-native-build/source-<identidade>/codex-rs/tui`, incluindo testes. Revisão Sol high separada. Sem recursão ou edição concorrente de arquivos.

## Retomada e envio autorizado — 19/10/2026

Rafael indicou a sessão `01a1549f-9799-7480-bfc5-b5ccec2cdffb` e pediu finalizar o trabalho existente, enviar ao repositório e atualizar a instalação aqui. Esta autorização substitui o limite anterior de commit/push somente para a ES-002: permite commit, push da branch e PR revisável no origin `rafaeljorge-ai/effortshift`, issue #3. Não autoriza merge, release ou deploy. O smoke real medium/high foi bloqueado pela quota da conta, permanecendo pendente; testes locais verdes não substituem essa inferência.
