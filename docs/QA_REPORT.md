# QA EffortShift

## ES-002 — candidato instalado; inferência medium/high pendente por quota

Contrato local: abrir o painel por `codex` e `codex-rafael`, Auto ligado por padrão, controles digitáveis sem Alt e esforço aplicado pelo caminho nativo. Branch `feat/effortshift-native-panel`, HEAD `8659d214d17c21d27860c3454fa7b2dc4e4235f5` com alterações locais. Na retomada, Rafael autorizou finalizar, atualizar localmente e enviar esta ES-002 ao repositório (commit/push/PR); merge/release/deploy não autorizados. Issue [#3](https://github.com/rafaeljorge-ai/effortshift/issues/3).

| Gate atual | Evidência definitiva |
|---|---|
| Node | 35/35, zero falhas; sintaxe, integridade e distribuição verdes |
| TUI completa | **5788 passaram, zero falhas, quatro ignorados**, exit 0, 1020,78s; uma thread, stack16MiB, `INSTA_UPDATE=no INSTA_FORCE_PASS=0`, workspace absoluto |
| Fonte reaplicada | `native:prepare` normal: arquivo upstream verificado, patch aplicado, hash integral conferido |
| Revisão independente Sol high | 9177 entradas byte idênticas entre fonte testada e fresh, excluindo somente stamps; 1414 goldens correspondentes à baseline e aos quatro manifestos de aceite; zero candidatos pendentes |
| Build locked | Passou em 3m24s na fonte definitiva; instalação real e isolada registradas |
| Instalação local | Binário `3f343a05d062`; CLI oficial e quatro arquivos de perfil preservados na instalação |
| zsh real | Integração ativa com backup; `codex` e `codex-rafael` abrem painel/Auto ON, perfil preservado |
| Retomada: Node e browser | Node35/35, sintaxe/integridade/distribuição verdes; browser desktop1280/mobile390, RPC simulada, sem inferência |
| Inferência no candidato instalado | Low respondeu `ES002_MAC_LOW_OK`; medium mostrou esforço medium mas falhou por quota; resposta medium/high pendente |

Fonte definitiva `9b5f67f3c0f5`; SHA-256 `9c52ee29c82d1a21ccb368eda7a7ac45965cab20681fd83b37a323c129e16256`. Patch SHA-256 `d523287daa91bdfb764040ba4066604008724d1fccb8ebbeb636c82c6e98b3c9`, 204 caminhos (38 fontes/lock e 166 snapshots). As referências visuais foram revisadas individualmente antes do full final, que não atualiza nem suprime divergências. Coletas anteriores com `INSTA_FORCE_PASS=1` foram somente inventário e não são gates. Timers nativos foram preservados; execução serial evita concorrência neste host, sem atribuir causa comprovada às falhas intermitentes anteriores.

Evidências privadas no diretório irmão `effortshift-native-build`: `es002-macos-controls-full-final-serial-no-update.log`, `es002-macos-node-final.log`, `es002-macos-check-final.log`, `es002-macos-final-frozen-prepare.log`. Não versionar logs reais, configuração ou credenciais. A pilha padrão do runner continua não homologada; a calibração de 16MiB não altera o CLI instalado.

A instalação e a ativação do shell foram concluídas pela sessão indicada antes da retomada, apesar do checkpoint antigo ainda dizer “em andamento”. Evidências privadas: `es002-macos-final-frozen-build.log`, `es002-macos-final-frozen-install.log`, `es002-macos-installed-binary.json`, `es002-zsh-default.json`, `es002-install-preservation.json`, `pty-macos-rafael-result.json`, `pty-macos-low-panel.txt` e `pty-macos-medium-inference.txt`. O último registra a recusa explícita por limite de uso; a execução `pty-macos-medium-high-final.py` falhou esperando a resposta medium e não chegou a high. Não contabilizar esse harness como gate verde. As capturas de 120×35,80×24,50×20 anteriores ao bloqueio preservam painel e rascunho.

Revisão final independente Sol high: sem impeditivos de código/distribuição; launcher, argumentos literais, integridade, política antes da captura do turno, manual/steering e invalidação de quota verificados. Checagem atual confirmou hashes de fonte, executável instalado, launcher e shell exatamente iguais aos artefatos registrados.

PTY de controles da retomada: seis critérios passaram, sem inferência: abertura por `codex`/Auto ON, painel e rascunho em 120×35,80×24,50×20, ajuda/Auto/Save digitados e precedência do seletor nativo `/model`. Evidências `es002-resume-controls.log` e `pty-resume-controls-smoke-result.json`. A primeira asserção de popup confundiu a palavra EffortShift da ajuda no histórico com o rodapé; captura mostrou o seletor aberto, e a repetição verificou a ausência do rodapé específico sem remover o histórico. Nenhuma alteração de produto foi necessária.

A primeira repetição Claude nesta retomada teve 178 pass/5 fail, todos por timeout nativo de 5000ms. A repetição isolada passou em 182/183 e manteve um timeout de 5000ms no contador de cache (5241ms); sem alterar fixtures/timers. Ambos os logs são diagnósticos, não gates verdes. Essa repetição não substitui o gate Rust já aprovado nem a inferência medium/high bloqueada.

### Bloqueio de envio na retomada

A terceira execução integral manteve **182 pass/1 fail**, 39,03s: `cache countdown > nothing before the first response; then it counts down with no further response, turns amber, goes cold`, timeout5000ms (5005,91ms observado). CLI2.1.292, idêntico ao CI; `hooks/` e `tests/` seguem idênticos ao HEAD base. Resultado atual não é verde, apesar do183/183 histórico.

Diagnóstico independente em cópia privada: todos os asserts/timeout originais preservados. O avanço simulado de30min15s levou3,3–4,3s; startup e callbacks esgotaram o prazo antes da verificação seguinte. Amostras do host mostraram CPU quase saturada, load24–27 em10CPUs e swap intenso; a execução integral posterior voltou a39s, mas manteve esse timeout. Não há prova de causa exclusivamente ambiental. Stub de janela e `mock.clock.set` foram experimentados somente fora do Git e também falharam; nenhuma dessas mudanças foi aplicada.

Não aumentar timeout, apagar asserts, alterar hooks ou usar histórico verde para contornar o gate. Evidências privadas: `es002-resume-claude.log`, `es002-resume-claude-serial.log`, `es002-resume-claude-definitive.log`, `claude-countdown-diagnostic-{1,2,4-set}.log`. Na solicitação seguinte, Rafael informou finalizar até este ponto e ordenou commit/push após receber o bloqueio182/183. Autorizado enviar o checkpoint com essa pendência explícita, sem classificar o gate como aprovado nem autorizar merge. A issue#3 registra a entrega; instalação local permanece íntegra. Sem alegação de conclusão integral, CI remoto, merge ou economia de consumo.

## Histórico de diagnóstico ES-002 — superado pelo gate canônico final

Mesmo escopo/branch/HEAD da entrega local abaixo, sem commit/push/release. Rafael confirmou Auto ligado nas novas sessões e autorizou corrigir impedimentos operacionais. Os resultados do candidato anterior permanecem históricos até nova validação do patch e do binário.

| Gate atual | Evidência |
|---|---|
| Node/pacote | 35/35; sintaxe, integridade e distribuição verdes; revisão Sol high sem bloqueios |
| Regressão da política | RED reproduziu saudação rebaixando implementação/investigação; fix Node verde; seis casos low/medium/high nos dois caches instalados passaram |
| Shell zsh | Stub valida UI, resume/fork, argumentos literais e roteamento de utilitários oficiais; ativação global aguarda binário novo |
| Hooks Stripe | Sete comandos adaptados com backup e revisão; sete transportes com caminho contendo espaço e dois eventos sintéticos verdes, sem conta/rede. Após autorização específica, quatro handlers suportados confiados individualmente pela TUI oficial |
| TUI Rust | RED: 18 passaram/seis falharam; GREEN final focado: 25/25 e fixture de permissões 1/1. Consumo do comando, Auto ON e packing revisados; full/snapshots/instalação/PTY ainda pendentes |

Full canônico de inventário concluído: **5646 passaram, 142 falharam e quatro foram ignorados**, 480,39s, com atualização apenas de candidatos (`INSTA_UPDATE=new`, raiz explícita e `INSTA_OUTPUT=summary`). Não é gate verde. Os 25 testes focados passaram; regressões comparativas de fila, resposta em 80×7 e duas imagens passaram nos asserts. A revisão encontrou perda material de `Done`/dica em telas baixas, ainda bloqueante; candidatos só serão aceitos após correção e revisão independente. Classificação integral: 141 divergências de snapshot e uma fixture de geometria do cursor. Revisão independente aprovou 139 payloads nos hashes do manifesto privado `es002-macos-controls-canonical-candidates-final.json` (`ffa699e8bf4ed1e5246fab4a55ba2118a8a3dcc53984b00f7b19da5e80a56025`). Dois candidatos não aprovados: `turn_tip_placements` por perda de resposta/dica e `questions_cleared_by_follow_up` por recorte da fixture capturar quota em vez do prompt. Novos deltas exigem revisão; o full sem atualização permanece pendente.

Auditoria das referências visuais: a resolução automática do workspace Insta leu goldens de `effortshift-native-build/source`, diferentes da árvore candidata em 172 arquivos (163 conteúdos e nove metadados). O primeiro full pós-packing foi interrompido e permanece inconcluso. O full canônico usa `INSTA_WORKSPACE_ROOT` absoluto para `codex-rs` da fonte atual; candidatos foram comprovados dentro dessa árvore. Não copiar goldens antigos indiscriminadamente: recortes de histórico, fila/rascunho e imagens exigem correção/revisão antes do gate final. A evidência visual da suíte histórica abaixo não é autocontida e será substituída pelo gate canônico.

Candidato intermediário, anterior aos 23 goldens adicionais e à fixture manual de Plan; requer regeneração: `a41b3563e20e`, source SHA-256 `2502c6cc858a8d23ffadcba187b504d7c3cd0926eb415287c8782b1bacac9311`, patch SHA-256 `d455dd22b29dffa171e63dc9bb915e9dc5c810c6bdf773c93e68367ee454774e`. Patch com 194 caminhos (37 fontes/lock, 157 snapshots). Revisão independente confirmou 9.177 entradas idênticas à árvore testada, exceto o stamp, e 1.414 goldens correspondentes exatamente à baseline com os 143 aceites registrados. Zero candidatos pendentes. Aprovação da correspondência é condicional ao full final sem atualização, ainda em execução; binário novo ainda não instalado.

Falha Stripe: `args` não faz parte do formato de comando do Codex fixado; `node` sem caminho interpreta o JSON de stdin como JavaScript, saída 1. Atribuição aos dois avisos anteriores é sustentada pela configuração habilitada anterior e reprodução, mas o log histórico não reteve o nome/stderr de cada handler. Caches EffortShift receberam apenas `decision.mjs` e integridade atualizados. Backups privados fora do Git; atualizações do marketplace podem sobrescrever essas adaptações locais.

Revisão de trust: a TUI oficial mostrou os quatro handlers Stripe modificados (SessionStart, dois PostToolUse e UserPromptSubmit). Cada comando foi conferido e aprovado com `t` na página individual; não houve trust geral. Comparação TOML com backup confirmou somente quatro campos `hooks.state.<stripe...>.trusted_hash` diferentes, sem outros ajustes semânticos. Log privado `pty-trust-stripe.raw` e evidência `stripe-trust-approved.json`. Configuração global GSD permaneceu desabilitada.

Diagnóstico de startup com overrides `-c`: o candidato anterior não iniciou em 120s e o recorte de 15s não isola a causa antiga. Os dois recortes de 55s, no fork e no executável oficial, aguardavam a tela normal de revisão após mudar Stripe; não eram timeout de MCP. Depois da revisão autorizada, o oficial chegou a Ready. Falha de download de plugin remoto e Vercel duplicado não comprovam causa de espera. Caminho padrão compartilhado ainda precisa de novo smoke com o binário corrigido.

Pendências de integração vistas em F2 no oficial: MCPs `hostinger` e `stripe` sem login; exigem autenticação própria (`codex mcp login hostinger` / `codex mcp login stripe`), não iniciada nesta entrega. Os plugins `habblaud` e `habblaud-mensagens` 0.8.0 declaram campo `modules` incompatível com o parser nativo de hooks e não são carregados por esse caminho; hook Habblaud separado em `~/.codex/hooks.json` continua listado. Há avisos informativos de quota, modo embutido, feature experimental chronicle e timeout SessionEnd limitado a 3s. Não desabilitar integrações, mudar timeouts ou esconder avisos para declarar 100% operacional. O comando `mavikctl` também não foi resolvido no zsh interativo (`whence -w mavikctl`); a instrução de retomada por esse nome exige ajustar o PATH/instalação separadamente. Isso não prova falha dos hooks MAVIK internos e não foi modificado nesta ES-002.

## Histórico ES-002 — candidato anterior ao ajuste macOS

Branch `feat/effortshift-native-panel`, HEAD `8659d214d17c21d27860c3454fa7b2dc4e4235f5` com alterações locais, sem novo commit/push/release. A ES-001 já foi integrada/publicada; a release pública não contém este painel. Fonte upstream: Codex `rust-v0.163.0`, commit `83086188ae0614bd882818ff1aa23f3194962012`.

Identidade da fonte preparada: `3bda69510de5`; SHA-256 completo `1e7b04b72db67faf970dd667cceaae8759b514bca1020bfc1e7c6dcca5d06b99`. Patch: 104 caminhos, sendo 30 fontes/lockfile e 74 snapshots. Revisão independente Sol high aprovou código, fixtures, snapshots e correspondência integral entre a árvore testada e a nova árvore reaplicada do arquivo oficial verificado.

| Gate | Resultado final |
|---|---|
| `npm test` | 33 passaram, zero falhas |
| `npm run check` e `npm run check:distribution` | Sintaxe, integridade e higiene verdes |
| `npm run test:claude` | Manifesto válido, 183 passaram; simulação sem inferência Claude |
| Rust focado | 19 passaram, zero falhas |
| Biblioteca TUI completa | 5782 passaram, zero falhas, quatro ignorados; 252,48s; `INSTA_UPDATE=no`, stack 16MiB, quatro threads |
| `npm run native:prepare` | Arquivo oficial verificado, patch aplicado e hash da árvore inteira conferido |
| `npm run native:build` | `cargo build --locked -p codex-cli --bin codex`, 1m09s, fonte nova |
| Instalação isolada do binário real | Launcher executou `--version`: codex-cli 0.163.0 |
| `npm run native:install` | Comando separado instalado, binário `bf31af1c16c5`; `--version` passou |
| Preservação da instalação | Link/alvo/hash do Codex oficial e quatro arquivos config/auth idênticos imediatamente após instalar |
| PTY e inferência finais | Sete critérios verdes, harness final exit 0: três tamanhos, resposta real `ES002_FINAL_OK` com Auto, manual desliga Auto, Save e precedência do menu `/model` |

Comando da suíte TUI, a partir de `source-3bda69510de5/codex-rs`: `CARGO_TARGET_DIR=<cache>/target RUST_MIN_STACK=16777216 INSTA_UPDATE=no cargo test --locked -p codex-tui --lib -- --test-threads=4`. O binário libtest produzido pelo Cargo foi executado diretamente no gate final, a partir de `codex-rs/tui`, com os mesmos parâmetros. O runner com stack padrão abortou por stack overflow, reproduzido também em analytics sem alteração; não está aprovado com stack padrão. Quatro timeouts anteriores passaram isolados sem aumentar timers e a suíte definitiva passou integralmente.

Os testes exercitam política manual/Auto/Plan, catálogo, risco/continuidade, steering, troca de conta, hidratação, teclado Vim, layout compacto, cursor/voz/imagens, atividade e precedência de modais. A atualização controlada de snapshots foi seguida por revisão e execução completa sem atualização. Quatro snapshots Daybreak foram preservados; duas respostas curtas conservaram prompt, resposta e Working. Não foram aceitas mudanças que escondessem conteúdo nativo para deixar o painel caber.

Smoke: `codex-effortshift --no-alt-screen --sandbox read-only`, perfil existente e servidor compartilhado padrão, sem `-c`, sem edição de trust/config. Preservou painel e rascunho em 120×35, 80×24 e 50×20. Auto foi habilitado antes de enviar pedido literal sem ferramentas; assistente respondeu `ES002_FINAL_OK`, painel mostrou esforço low. Isso comprova o fluxo real e a configuração enviada, sem inspecionar esforço interno do provedor. Atalho manual mudou para medium e desligou Auto; Save ativou com janela real; `/model` abriu seletor nativo sem painel sobreposto.

Limites operacionais: ocorreram duas mensagens `Hook failed`/código 1 em hooks do perfil, enquanto as mensagens consultivas EffortShift e a resposta real chegaram. Não foram alterados outros plugins/trust. Um smoke anterior com overrides `-c` forçou servidor embutido e ficou antes de SessionConfigured por 120s; causa interna não comprovada. A validação final cobre o caminho padrão compartilhado. O harness foi corrigido para aguardar startup, capturar a abertura do popup antes do redraw e tolerar somente EIO ao encerrar um PTY cujo filho já terminou; esses ajustes não alteram o produto.

Evidências privadas ficam no diretório irmão `effortshift-native-build`: `es002-tui-full-definitive-no-update.log`, `es002-node-final.log`, `claude-tests-final.log`, `es002-final-prepare.log`, `es002-final-build.log`, `es002-final-install.log`, `es002-install-preservation.json`, `es002-pty-final.log`, `pty-final-smoke-result.json`, `pty-final-smoke.raw` e capturas por tamanho. Nenhum transcript, token ou configuração real foi versionado. A revisão Sol high não substitui revisão Claude exigida para eventual merge do roteamento; publicação e CI remoto da ES-002 permanecem fora desta entrega local. Sem medição completa de consumo de todos os agentes e sem alegação de economia.

## ES-001 — evidência histórica

## Continuação nativa e distribuição — 19/10/2026

Esta seção atualiza a entrega local inicial descrita abaixo. Issue pública: [ES-001 #1](https://github.com/rafaeljorge-ai/effortshift/issues/1). Versão candidata: 0.2.0-alpha.1; Git/CI do PR identificam o HEAD exato.

| Gate atual | Resultado |
|---|---|
| `npm test` | 30/30 passaram, incluindo oito testes de hook/pacote nativo |
| `npm run check` e `npm run check:distribution` | Sintaxe, motor compartilhado, versões e higiene verdes |
| `npm run test:claude` | Manifesto válido, 183/183 passaram; simulação sem inferência |
| `npm run test:browser` | RPC simulada, manual high, resposta/interrupção, desktop1280/mobile390; verde em Node22 e Node24 |
| Instalação nativa atual | Perfil ~/.codex-rafael: instalado/habilitado; seis arquivos iguais ao pacote atual |
| Revisão Sol high | Sem impeditivos; link de suporte e Node24 do browser corrigidos e re-revisados |
| Nova inferência Codex | Bloqueada por limite de uso; não repetir como sucesso os smokes anteriores |
| Revisão independente Claude | Sem impeditivos de código; condições de release: hooks isolados sem falha e CI remoto verde |

Na sessão retomada, a instalação isolada e real pelo CLI oficial, trust individual pela interface /hooks e os smokes EFFORTSHIFT_NATIVE_OK e EFFORTSHIFT_VISUAL_OK foram registrados como concluídos. O hook instalado continua idêntico ao candidato atual. A tentativa inicial somente leitura não completou inferência por quota e mostrou dois eventos de hook Failed. Na repetição, a configuração oficial de processo desativou apenas os outros hooks, preservando a confiança existente do EffortShift e sem editar configurações globais: SessionStart Completed e UserPromptSubmit Completed, sem hook Failed; depois a inferência parou por quota. hooks/list confirmou somente os dois hooks EffortShift ativos e trusted. Isso separa sucesso dos hooks de inferência. Não há prova de runtime Claude interativo autenticado. Não alegar 100% operacional.

Comando do smoke atual: `CODEX_HOME=~/.codex-rafael codex exec --ephemeral --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort='"low"'` com pedido de resposta literal sem ferramentas. Nenhuma flag de bypass de trust foi usada. Logs locais, configurações, backup e capturas reais permanecem fora do Git.

Revisão Claude independente concluída com ferramentas somente leitura, sem rede, edição ou delegação: SEM IMPEDITIVOS de código para merge. Condições antes da tag: identificar os hooks Failed ou repetir com só EffortShift, e obter CI remoto verde. A condição dos hooks foi comprovada acima. A primeira chamada --bare desativa OAuth e foi corrigida usando autenticação normal, mantendo hooks/MCP desativados para o revisor. Sol high também re-revisou os ajustes de CI. Não há mensuração completa de uso de todos os agentes nem alegação de economia. CI verde atual continua necessário.

Primeiro CI remoto no HEAD `517d91e` falhou na instalação do runtime Claude: `--ignore-scripts` impediu o binário nativo. Correção remove essa opção da instalação fixada; instalação limpa local da versão 2.1.292 confirmou binário funcional. Não foi alterada lógica para contornar teste. O segundo CI passou pelo runtime Claude e chegou ao navegador, que falhou ao iniciar no Linux. O filtro do teste removia CI; reprodução com binário Linux oficial 0.38.1 e usuário não-root comprovou que essa variável controla os argumentos de inicialização para CI. Correção mínima preserva CI, mantendo credenciais/perfis externos filtrados; browser local com CI=true e Node24 passou. Sol high revisou o delta sem impeditivos. Reprodução com navegador real em Docker local parou no instalador de dependências (sudo ausente); não é evidência de Chrome aprovado no Linux. O novo run remoto deve passar antes do merge.

## Entrega local inicial — evidência histórica

Ambiente: macOS local, Node v22.22.3, Codex CLI 0.163.0, Claude Code 2.1.292, agent-browser 0.38.1. Base upstream df5602e; candidato em alterações locais na branch feat/effortshift-local-alpha. Entrega local: sem deploy, publicação, PR ou merge.

## Gates da entrega

| Gate | Resultado observado |
|---|---|
| Testes Node: esforço/RPC/sessão/HTTP/permissões | 22/22 passaram no candidato final, incluindo regressões da revisão |
| Checagem sintática | Verde, incluindo src/bin, web/app.js e runner Claude |
| Claude manifesto e testes do fork | Validação aceita; 183/183 testes passaram |
| Browser desktop/mobile | Passou no candidato final: 1280×900 e 390×844, teclado e interrupção real |
| Codex real somente leitura | EFFORTSHIFT_OK (manual low) e EFFORTSHIFT_FINAL_OK (auto low) recebidos pela UI |
| Revisão independente | Dois bugs corrigidos; re-review Sol high sem impeditivos |

Comandos reproduzíveis: `npm test`, `npm run check`, `npm run test:claude`, `node bin/effortshift.mjs doctor`. O runner Claude cria árvore temporária exclusiva do plugin, sem os testes textless, e a remove ao terminar. O manifesto é aceito com aviso de metadados de autor ausentes, herdado do upstream. Os 183 testes simulam o runtime Claude; não comprovam sessão nativa interativa autenticada.

## Integração e interface observadas

Codex App Server respondeu a initialize/initialized, model/list e account/rateLimits/read; sete modelos disponíveis no ambiente, padrão gpt-6.1-sol. O fluxo web conectou à conta previamente autenticada, alterou perfil/modo/esforço e enviou tarefa com esforço manual low. A mensagem final do assistente foi exatamente EFFORTSHIFT_OK; decisão exibiu ACEITO PELO SERVIDOR e nenhum erro. O smoke pediu explicitamente para não usar ferramentas, ler arquivos ou delegar.

agent-browser (sessão effortshift-qa): desktop e celular 390×844 capturados e inspecionados. No celular, documentWidth = viewportWidth = 390; sem overflow horizontal. Token removido da barra. Sem erros de console registrados. Após encerrar o servidor, a UI mostrou Servidor indisponível, desabilitou envio e substituiu métricas por Indisponível. Capturas locais em artifacts/private/ ficam fora do Git porque exibem telemetria real da conta.

No candidato final, Ctrl+Enter enviou o prompt; o assistente respondeu EFFORTSHIFT_FINAL_OK e o painel exibiu low, perfil balanced, ACEITO PELO SERVIDOR e sessão ativa. Desktop 1280 px e celular 390 px mantiveram documentWidth igual à largura da viewport, sem erro de console e sem token na barra. Um terceiro turno de teste foi interrompido pelo botão Parar: evento real completed · Turno interrupted, retorno a Codex conectado, erro vazio e botão de interrupção oculto. Nenhuma ferramenta foi usada nos smokes.

Cliente terminal conectado ao Codex real: faixa de esforço, modelo, estado ready e limites reais exibidos; comandos /status e /help respondem. Nenhuma inferência pelo terminal foi necessária.

## Revisão independente

Sol high revisou src/, bin/, test/, web/, manifests, README e mudanças Claude contra df5602e. Reproduziu dois impeditivos que a suíte anterior não cobria:

1. Catálogo sem esforços permitia tarefa crítica sem assegurar piso high. Correção deve recusar antes de turn/start e preservar caso não crítico sem esforço.
2. Ack antigo de turn/start podia confirmar a decisão e atribuir ID ao turno seguinte quando completed chegava antes do ack. Correção deve isolar operação/conexão e impedir cancelamento do turno antigo.

A revisão não encontrou outros impeditivos concretos em Host/Origin/Bearer/CSP, saída por textContent, aprovações desconhecidas ou remoção do atualizador upstream. Ambos encerrados após correção e regressões. O re-review Sol high executou 11/11 testes focados e check verdes, mais reprodução adicional com ack/rejeição e started/completed/error antigos antes do started do segundo turno. Identidade de operação/conexão protege estado atual; fechamento normal passa a idle sem erro.

## Limites explícitos

Painel Codex é cliente próprio do EffortShift; não injeta UI no CLI oficial. Aceite protocolar de turn/start confirma o parâmetro enviado, sem inspecionar raciocínio interno. Auto Codex usa regras lexicais locais: não garante identificação semântica de todo risco; Auto Claude conserva o avaliador original. Dados ausentes ficam indisponíveis. Aprovações, falhas e corridas têm testes de protocolo simulado; não houve execução real de ferramenta que exigisse aprovação. Interrupção também foi testada com Codex real pelo navegador. Configurações globais e credenciais não foram alteradas.

Não há treinamento/fine-tuning nem sincronização de conversas entre provedores nesta entrega. A arquitetura compartilha o produto e usa adaptadores distintos.

## Uso e decisões

Coordenador, dois implementadores Sol medium em contexto novo e um revisor Sol high, no máximo dois filhos simultâneos, sem recursão. Tokens de entrada/cache/saída, custo e quota de todos os agentes não são expostos pelas ferramentas: não mensurados. Nenhuma alegação de economia. Início observado: 2026-10-19T03:09:12Z; fechamento técnico em 2026-10-19T03:20:11Z, aproximadamente 11 minutos de trabalho observado até os gates locais; aceite de uso pelo usuário ainda não observado.

Decisões materiais: entrega local autorizada, sem publicar remoto; regras locais no Codex preservando juiz Claude; cliente visual próprio do Codex em vez de modificar o CLI oficial. Custos possíveis: publicação futura separada, calibração da heurística e comando adicional para abrir o cliente.

## Fontes técnicas

- [Codex App Server](https://learn.chatgpt.com/docs/app-server), consultado em 19/10/2026; esquemas gerados pelo CLI instalado conferem a versão.
- [HeyCubit/effortless](https://github.com/HeyCubit/effortless), código e licença MIT preservados no fork.

## Repetir o smoke visual

Inicie `npm start`, abra a URL completa exibida no terminal com agent-browser, clique Conectar Codex e espere o catálogo habilitar. Envie uma tarefa curta sem ferramentas usando Ctrl+Enter, confira a mensagem do assistente, esforço e aceite. Mude o viewport para 390×844; confira `document.documentElement.scrollWidth === innerWidth`, erro vazio e hash removido. Para interrupção, envie uma tarefa textual longa e clique Parar enquanto estiver em execução; confira o evento Turno interrupted e retorno a conectado. Não publique capturas com URL autenticada ou telemetria da conta.
