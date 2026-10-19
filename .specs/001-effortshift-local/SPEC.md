# ES-001 — EffortShift local utilizável

Contrato: `docs/planta/01-PRD.md`; arquitetura/interface vinculante: `docs/planta/02-TRD.md`; UI e permissões: demais documentos da Planta. Uma entrega vertical integrada na branch feat/effortshift-local-alpha. O pedido atual autoriza execução local completa e testes; publicação remota não está incluída.

Pronto: Node tests + sintaxe verdes; plugin Claude validado/testado; browser desktop/mobile e fluxo real via UI; smoke de um turno Codex real somente leitura; revisão independente sem impeditivos. Se autenticação/cota impedir o smoke, registrar falha e não alegar validação real. Configurações dos agentes e credenciais permanecem intocadas.

Pacotes A e B têm ownership disjunto definido no plano. Paralelismo dentro desta fatia única; sem outra task antes de sua entrega. Nenhum commit/push/PR/deploy requerido no escopo local; não declarar merge.

## Delta autorizado — plugin Codex nativo e distribuição

Pedido de 19/10/2026: instalar localmente no Codex para experimentar e, após ajustes, publicar em repositório público rafaeljorge-ai/effortshift com descrição, tags/releases. Complementa a mesma entrega vertical ES-001 originalmente pedida para ambos os agentes. Reutilizar decisão e layout; não redescobrir produto.

Aceite adicional: marketplace Codex instala pacote autocontido, sem remover outros plugins; SessionStart/UserPromptSubmit mostram feedback nativo da recomendação e deixam explícito que esforço não foi aplicado pelo hook; não injetar prompt fingindo mudança de effort. Skill de ajuda acionável. Sem ler transcript/credenciais, gravar prompt ou acessar rede. Revisar e confiar somente nos hooks EffortShift pela interface oficial /hooks, sem bypass ou edição direta de trust. Regras do núcleo compartilhadas por build determinístico. Catálogo nativo desconhecido implica recomendação consultiva, nunca confirmação de parâmetro. Gate local e instalação em CODEX_HOME temporário antes da real; backup e rollback de instalação documentados. Revisão e smoke nativo com CLI0.163.0, sem bypass de trust.

O contrato oficial de hooks consultado não oferece saída model/effort nem painel custom equivalente a function hooks Claude. Auto real permanece nos clientes App Server existentes. Diferenças precisam constar no produto, README e release alpha. Upstream permanece HeyCubit/effortless; sincronização futura por PR revisado, sem instalar upstream sobre o fork.
