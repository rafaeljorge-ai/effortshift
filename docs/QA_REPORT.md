# QA EffortShift — ES-001

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
