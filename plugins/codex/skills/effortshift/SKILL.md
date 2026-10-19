---
name: effortshift
description: Explica as recomendações nativas de esforço do EffortShift e como escolher esforço manualmente no Codex.
---

Explique de forma curta:

- O plugin usa regras locais para recomendar low, medium, high, xhigh ou max. A escala é consultiva: o hook não recebe o catálogo nem o esforço atual e não comprova suporte a esses valores pelo modelo.
- SessionStart mostra uma apresentação; UserPromptSubmit mostra a recomendação na interface nativa. Hooks precisam ser revisados e confiados pelo usuário no Codex. Instalação não concede trust automaticamente.
- O hook não aplica esforço. Use o menu nativo de esforço para selecionar um valor disponível; confirme a seleção na interface do cliente. Nunca afirme que a recomendação já foi aplicada.
- O perfil padrão é balanced. EFFORTSHIFT_PROFILE=economy ou quality no ambiente do processo Codex muda apenas as recomendações; tarefas críticas mantêm piso high. Não altere ambiente/configuração sem pedido.
- Os clientes opcionais de terminal e web do repositório EffortShift usam o App Server e aplicam esforço por turn/start após consultar o catálogo. São clientes próprios, não extensões da interface oficial; não estão incluídos neste pacote autocontido.

O hook não lê transcript ou credenciais, não grava prompts, não usa rede nem modifica configurações. Não prometa painel custom, custo menor ou esforço automático no CLI nativo.
