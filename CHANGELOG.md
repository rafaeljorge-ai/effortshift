# Changelog

## 0.2.0-alpha.1

Primeira distribuição EffortShift, derivada de HeyCubit/effortless 1.71.0, commit df5602ef9b49c70f678a3ce9a12518176e09afea.

- Claude: identidade, comando e namespace EffortShift; painel original e avaliador preservados; atualizador upstream direto desativado.
- Codex nativo: plugin autocontido, hooks SessionStart/UserPromptSubmit e skill de ajuda; recomendação consultiva, sem alterar esforço pelo hook.
- Codex próprio: clientes terminal/web via App Server, esforço real por turno, modelos, streaming, limites, interrupção e aprovações.
- Verificação: testes de protocolo, segurança HTTP, empacotamento e browser com fixture; smokes reais locais registrados no QA.
- Distribuição: catálogo por agente, CI e acompanhamento semanal de commits upstream com issue revisável.

Limites: hooks Codex0.163.0 não têm retorno model/effort; não há painel custom igual ao Claude nem economia comprovada. Testes Claude são simulados; o runtime nativo interativo autenticado do fork Claude não foi comprovado.
