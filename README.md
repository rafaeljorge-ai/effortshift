# EffortShift

Controle de esforço para **Claude Code e Codex**, em um único repositório. Fork MIT de [HeyCubit/effortless](https://github.com/HeyCubit/effortless), baseado na versão upstream **1.71.0**. Versão EffortShift: **0.2.0-alpha.1**.

> **Alpha:** o plugin nativo Codex recomenda esforço; não o altera. Os clientes próprios Codex aplicam esforço real via App Server. Não há promessa de economia.

| Recurso | Claude Code | Plugin nativo Codex | Clientes próprios Codex |
|---|---|---|---|
| Instalação como plugin | Sim | Sim | Executados com Node |
| Esforço automático aplicado | Runtime original do Effortless | Não; recomendação consultiva | Sim, por `turn/start` |
| Visual | Painel nativo original | Faixa visual Unicode por tarefa | Painel terminal e web |
| Classificação | Avaliador Haiku/Jev do upstream | Regras locais | Regras locais |
| Modelos/esforços suportados | Runtime Claude | Catálogo indisponível no hook | Catálogo real do App Server |

## Instalar no Codex

**Painel fixo como no Claude:** a versão local usa um fork da TUI, com executável separado `codex-effortshift`, Auto aplicado por turno e indicadores acima do composer. Os controles locais são `/effortshift auto`, `/effortshift save` e `/model`, sem Alt. A integração zsh torna esse painel padrão ao digitar `codex` ou `codex-rafael`, com Auto ligado nas novas sessões e o perfil preservado. Veja [instalação do painel nativo](docs/CODEX-TUI.md) e [estudo completo Claude → Codex](docs/CLAUDE-CODEX-PARITY.md). A release pública `0.2.0-alpha.1` e os comandos de plugin abaixo instalam apenas a faixa consultiva por prompt.

Requisitos: Node.js 22+ e Codex CLI com plugins/hooks, validado localmente na versão **0.163.0**.

```sh
codex plugin marketplace add rafaeljorge-ai/effortshift
codex plugin add effortshift@effortshift
codex
```

Na primeira abertura, revise **somente os hooks do EffortShift** em `/hooks` e confie nos que deseja executar. Instalação não concede confiança automaticamente; definições alteradas podem exigir nova revisão. Não use bypass de trust para instalar.

Depois de enviar um prompt, o CLI mostra algo como:

```text
╭─ EffortShift · perfil balanced
│ LOW  MEDIUM  [HIGH]  XHIGH  MAX
│ Recomendado: high · não aplicado pelo hook
╰─ Consultivo · catálogo nativo desconhecido
```

A recomendação do plugin não conhece o catálogo nem o esforço atual do modelo. Ajuste no menu nativo de esforço e confirme o valor na interface do Codex. `$effortshift` abre a ajuda da skill. Para a faixa persistente com controle real de esforço, use o executável local separado `codex-effortshift`; o plugin não estende a TUI oficial.

Para instalar a cópia local, troque o primeiro comando por `codex plugin marketplace add "$PWD"`. O catálogo Codex fica em `.agents/plugins/marketplace.json`; seu pacote autocontido fica em `plugins/codex/`. Se o marketplace `effortshift` já existir com outra origem, confira `codex plugin marketplace list` e remova apenas essa origem antes de registrá-la novamente.

Remover:

```sh
codex plugin remove effortshift@effortshift
codex plugin marketplace remove effortshift
```

Opcionalmente, `EFFORTSHIFT_PROFILE=economy codex` ou `EFFORTSHIFT_PROFILE=quality codex` muda o perfil consultivo. O padrão é `balanced`; riscos críticos reconhecidos mantêm recomendação mínima `high`. A heurística é lexical, sem garantia de detectar todo risco semântico.

## Instalar no Claude Code

Requer Claude Code com function hooks; validação/testes locais na versão **2.1.292**.

```sh
claude plugin marketplace add rafaeljorge-ai/effortshift
claude plugin install effortshift@effortshift
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude
```

Evite carregar Effortless e EffortShift simultaneamente, pois ambos ajustariam esforço. Para testar este fork isolado da raiz, sem editar a configuração global:

```sh
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude \
  --settings '{"enabledPlugins":{"effortless@effortless":false}}' \
  --plugin-dir "$PWD"
```

Use o ID real do original se estiver registrado sob outro marketplace. Abra `/effortshift settings` ou `/effortshift setup` para os controles do painel nativo. O fork preserva juiz Haiku/Jev, cache e handoff do upstream; seus custos e permissões continuam sujeitos ao Claude. Se você habilitar o juiz Jev e fornecer uma chave TypeSafe, ele envia o prompt e contexto recente para `api.typesafe.ai`, um serviço de terceiros. A suíte do plugin simula o runtime, sem comprovar uma sessão interativa autenticada.

## Clientes visuais Codex com esforço aplicado

```sh
git clone https://github.com/rafaeljorge-ai/effortshift.git
cd effortshift
npm start                         # painel web local
node bin/effortshift.mjs codex     # cliente visual de terminal
```

Os clientes usam Codex App Server oficial via stdio: modelo, esforço por turno, streaming, interrupção e aprovações. São clientes próprios do EffortShift. Não modificam a interface oficial. `/auto balanced`, `/manual high`, `/models`, `/status`, `/stop` e `/quit` são comandos do cliente próprio.

Modo padrão somente leitura. `--workspace-write` permite escrita explicitamente. Configurações de modelo/esforço valem para os próximos turnos. Conversas dos provedores são separadas. “Aceito pelo servidor” é aceite protocolar, sem inspeção do raciocínio interno.

O servidor escuta em `127.0.0.1`; abra a URL autenticada exibida no terminal. O token temporário sai da barra e fica em memória/sessionStorage, enviado no header Bearer. Não compartilhe essa URL. Dados ausentes aparecem como Indisponível, sem estimativas financeiras.

## Desenvolvimento e verificação

```sh
npm run build:codex
npm test
npm run check
npm run check:distribution
npm run test:claude
```

O build copia o motor compartilhado para o pacote Codex; `check` detecta divergências. Os testes verificam stdin/stdout dos hooks, pacote isolado, esforço/RPC/concorrência/HTTP e permissões. O runner Claude cria uma árvore temporária exclusiva do plugin e a remove ao terminar. Não são necessários tokens de API nos testes simulados.

Com agent-browser **0.38.1** instalado e seu Chromium disponível, execute `npm run test:browser`. Esse teste usa RPC explicitamente simulada, sem autenticação/inferência, cobrindo desktop/mobile, controles e interrupção. Smokes autenticados reais são registrados separadamente em [QA](docs/QA_REPORT.md).

## Atualizações e distribuição

O remoto `upstream` acompanha HeyCubit/effortless; `origin` aponta para este fork. O atualizador original que instalaria Effortless sobre o fork foi desativado. O workflow semanal detecta commits novos e abre uma issue de revisão; não instala nem integra alterações automaticamente. Veja [sincronização upstream](docs/UPSTREAM-SYNC.md).

O mesmo repositório contém os dois catálogos: `.claude-plugin/` para Claude e `.agents/plugins/` para Codex. Versões EffortShift seguem SemVer e não representam a versão upstream. Consulte [CHANGELOG](CHANGELOG.md), [limites nativos](docs/CODEX-NATIVE.md) e [LICENSE](LICENSE).

Atribuição e documentação original: [HeyCubit/effortless](https://github.com/HeyCubit/effortless) e [README upstream preservado](docs/UPSTREAM-README.md). `textless/`, site e material histórico herdados não integram os novos clientes ou o pacote nativo Codex.

Nos clientes Codex próprios, tarefas reconhecidas como críticas mantêm piso `high`, inclusive no modo manual; a interface explica quando esse piso altera sua escolha. Regras lexicais podem não reconhecer todo risco.
