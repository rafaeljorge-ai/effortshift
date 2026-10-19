# EffortShift

Leia primeiro `docs/planta/STATUS.md`, depois `.specs/001-effortshift-local/SPEC.md`.
Escopo autorizado: um fork local utilizável de HeyCubit/effortless com Claude Code e Codex.
Unidade de entrega: ES-001, branch `feat/effortshift-local-alpha`. Pacotes de trabalho da mesma fatia podem ser paralelos com arquivos disjuntos. Não iniciar outras features nesta branch.
Atualização autorizada em 2026-10-19: instalar plugin EffortShift no Codex local, preservando outros plugins/configurações; preparar publicação em rafaeljorge-ai/effortshift público com documentação, tag e release após ajustes. Sem deploy, bypass de hook trust ou alteração de credenciais. A instalação usa comandos oficiais, com backup das entradas de configuração afetadas. Nenhum segredo/transcript real versionado.
Node >=22, ESM; dependências de runtime novas devem ser evitadas. Usar APIs oficiais do Codex App Server, não simular aplicação de esforço por prompt.
Painel Claude continua nativo do fork; Codex tem cliente próprio com painel terminal e web. Não alegar extensão do CLI oficial.
Gates: testes Node, checagem sintática, testes/validação Claude compatíveis com o CLI local, browser desktop/mobile via agent-browser, smoke real Codex somente leitura e revisão independente.
Não delegar recursivamente. Preservar o trabalho de outros; não fazer commits sem instrução do coordenador.

Continuação da mesma fatia ES-001: entregar o adaptador nativo Codex ausente no alpha, sem misturar outra feature. Pacote nativo em plugins/codex com marketplace próprio .agents/plugins/marketplace.json. Hooks devem distinguir recomendação de esforço aplicado: sem campo oficial de alteração por hook, não alegar auto nativo. A classificação shared é empacotada com integridade validada. Gates adicionais: hook stdin/stdout, instalação isolada, instalação real e smoke CLI nativo, revisão independente. Publicação exige issue/PR/checks verdes e revisão; sem bypass.
