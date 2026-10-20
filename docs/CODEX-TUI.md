# Painel na TUI Codex — ES-002

Versão local da ES-002. É um patch do CLI open-source Codex 0.163.0, não uma extensão visual fornecida pelo contrato de plugins. O executável oficial `codex` permanece intacto. A release pública `0.2.0-alpha.1` não contém esse painel; resultados da validação local ficam em [STATUS](planta/STATUS.md).

## Preparar e instalar

Pré-requisitos: Node 22+, Cargo/Rust compatível com o upstream (toolchain declarada 1.95; build local em 1.96.1), Git, curl, tar, patch e ferramentas de compilação do sistema. Primeira compilação pode baixar muitas dependências e consumir vários GB; fonte e target ficam no diretório irmão `effortshift-native-build`, no volume deste checkout.

Para preparar, compilar e instalar a fonte fixada:

```sh
npm run native:prepare
npm run native:build
npm run native:install
codex-effortshift
```

Opcional: `node tools/native-codex.mjs install /caminho/no/ssd/cache` define o cache de build. `prepare` verifica SHA-256 da fonte oficial, aplica um snapshot do patch e confere a impressão digital da árvore inteira contra o manifesto versionado. Fonte alterada/incompleta é recusada. `build` usa `cargo build --locked`. Não remover caches manualmente enquanto houver build em andamento.

O instalador cria somente `~/.local/bin/codex-effortshift` e `~/.local/share/effortshift/native/<hash>/codex`; recusa sobrescrever comando alheio e confere integridade de binário já existente. Não edita config, auth, plugins ou trust. Reutiliza o perfil Codex que o usuário já seleciona, inclusive `CODEX_HOME` quando definido; aprovações e sandbox continuam nativos.

## Controles e estado

O painel mostra indicadores; os textos de esforço, Auto e Save não são botões de mouse. Os controles abaixo são comandos locais digitados no composer, funcionam no macOS sem Alt e não enviam um pedido ao modelo:

- `/effortshift`: ajuda e estado dos controles.
- `/effortshift auto`: liga/desliga Auto nesta sessão; regras locais, sem judge Haiku/Jev ou chamada extra de classificação.
- `/effortshift save`: liga/desliga Save até reset conhecido. Sem cota/reset frescos, informa indisponibilidade; limita trabalho comum a medium e preserva piso high para risco.
- `/model`: seletor nativo de modelo e esforço; seleção manual desliga Auto. Catálogo e modos Plan/Default são respeitados.
- `Next effort` mostra a configuração do próximo turno, sem confirmar esforço interno do provedor. Steering preserva o esforço corrente. Quota usa somente dados Codex válidos; Running hot aparece a partir de 80%.

Saudação no início de um pedido técnico não reduz o esforço: implementação continua em medium; investigação/arquitetura, em high; segurança/permissões/dados preservam high inclusive com Save. Regras locais têm limites e não equivalem a um avaliador semântico. O Auto ajusta esforço; o modelo permanece o selecionado pelo usuário.

Modais, popups e aprovações preservam foco e precedência. A faixa quebra linhas em terminais estreitos; se faltar altura, cede espaço à atividade, imagens e edição. Diálogos centrados a ocultam temporariamente.

Novas sessões começam com Auto ligado e Save desligado. Desligar Auto ou selecionar esforço manual prevalece durante a sessão. As preferências são da sessão nesta primeira fatia. Handoff, judges externos, cache inferido, roteamento de modelo, mapa de agentes e setup completo permanecem fora da ES-002; veja a [matriz de capacidades](CLAUDE-CODEX-PARITY.md).

## Verificação e manutenção

Fonte upstream fixada em `native-codex/upstream.json`; alterações em `native-codex/panel.patch`. O delta do lockfile só normaliza versões dos 160 pacotes locais da tag 0.0.0→0.163.0, sem atualizar dependências externas. Licença upstream Apache-2.0 preservada na fonte baixada; o projeto EffortShift mantém sua licença própria.

Gates e resultados atuais em [STATUS](planta/STATUS.md) e [QA](QA_REPORT.md). Uma atualização do Codex exige reaplicar/revisar o patch e repetir testes/PTY; não executar atualizador do CLI esperando preservar o painel.

Para repetir os testes Rust, use o diretório de fonte mostrado por `native:prepare` e o mesmo target do cache:

```sh
cd /caminho/cache/source-<identidade>/codex-rs
CARGO_TARGET_DIR=/caminho/cache/target RUST_MIN_STACK=16777216 \
  INSTA_WORKSPACE_ROOT="$PWD" INSTA_UPDATE=no INSTA_FORCE_PASS=0 \
  cargo test --locked -p codex-tui --lib -- --test-threads=1
```

Neste macOS, a pilha padrão do runner abortou por stack overflow, reproduzido também em um teste de analytics sem alteração. Defina também `INSTA_WORKSPACE_ROOT` para a raiz `codex-rs` da árvore em teste: o cache deste ambiente pode resolver referências visuais de outra árvore. A calibração de 16MiB é do runner de testes; não altera o esforço do modelo nem a configuração do CLI instalado. O resultado com pilha padrão permanece uma limitação registrada em QA.

O smoke padrão usa `codex-effortshift --no-alt-screen --sandbox read-only`, sem overrides `-c`. Neste perfil, uma sessão anterior em modo embutido não concluiu inicialização em 120s; a causa antiga não foi comprovada. Os dois diagnósticos posteriores de 55s, no fork e no oficial, aguardavam a tela normal de revisão dos hooks Stripe modificados. Após revisão autorizada, o oficial chegou a Ready. O fluxo padrão pelo servidor compartilhado já completou inferência; a aprovação do painel não certifica todos os perfis/plugins.

Na auditoria operacional do perfil `~/.codex`, o Stripe 0.10.3 habilitado usava `command: "node"` com `args`, campo ignorado pelo parser de hooks deste Codex. Isso reproduz saída 1 ao interpretar o JSON como JavaScript. Os sete comandos foram adaptados localmente para incluir o caminho citado dentro de `command`, preservando eventos, matchers e timeouts, com backup privado. Sete testes de transporte com stub e dois eventos sintéticos passaram sem rede ou conta Stripe. Rafael autorizou a nova confiança: somente os quatro handlers suportados foram revisados/aprovados individualmente pela TUI oficial, sem bypass; comparação semântica confirmou apenas quatro hashes Stripe alterados. O claude-mem incompleto já estava desabilitado; não foi usado para atribuir essas duas falhas.

F2 também identificou MCPs Hostinger e Stripe sem login e dois manifestos Habblaud com campo `modules` incompatível. Autenticação externa e adaptação dessas integrações permanecem pendentes; não impedem descrever/validar o esforço enviado, mas impedem chamar todo o ambiente de 100% operacional.

Os caches EffortShift de `~/.codex` e `~/.codex-rafael` receberam somente o módulo de decisão e sua integridade atualizados, com backup; hooks/configuração/trust foram preservados. Essas adaptações locais podem ser sobrescritas por atualização do marketplace público, que ainda contém o alpha anterior. Publicar a correção exige autorização separada.

## Padrão nas novas sessões do terminal

A integração `native-codex/shell.zsh` define uma função zsh que abre o painel ao digitar `codex`, inclusive resume/fork. A função existente `codex-rafael` chama esse mesmo caminho com `CODEX_HOME=~/.codex-rafael`, preservando o perfil e abrindo o painel automaticamente. `exec`, login, plugins, servidor e utilitários seguem pelo executável oficial. `codex-effortshift` continua disponível diretamente. A função não troca modelo, perfil, credenciais, sandbox ou permissões.

Na máquina validada, o arquivo é copiado para `~/.local/share/effortshift/shell.zsh` e carregado pelo `~/.zshrc`, com backup privado da configuração anterior. Uma nova aba do terminal já carrega esse padrão; na aba existente, `source ~/.zshrc` recarrega a função. O instalador do binário não ativa essa preferência sozinho.

Para configurar em outra instalação zsh, copie `native-codex/shell.zsh` para a pasta acima e inclua uma única linha `source ~/.local/share/effortshift/shell.zsh` no `~/.zshrc`, após revisar e salvar a configuração anterior. Essa preferência não modifica o Codex Desktop, a extensão do IDE ou chamadas pelo caminho absoluto.

Para abrir o CLI oficial diretamente no terminal configurado, use `command codex`. A remoção do launcher separado e da pasta nativa é reversível sem mexer no perfil, mas aguarde encerramento de sessões/builds antes de limpar artefatos.
