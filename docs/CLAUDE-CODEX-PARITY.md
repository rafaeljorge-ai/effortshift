# Estrutura effortless Claude → EffortShift Codex

Estudo de 19/10/2026, fonte Claude do HEAD `8659d21`. Fonte Codex `rust-v0.163.0`, commit `83086188ae0614bd882818ff1aa23f3194962012`. Inspeção estática independente Sol high, complementada pela sessão Claude interativa anterior sem inferência. Não é uma declaração de paridade operacional.

## Fluxo que realmente sustenta o painel

`hooks/hooks.json` carrega `hooks/register.tsx`; `register` registra os eventos. `session.start` restaura preferências, Auto e escolha manual, abre setup e inicia timers. `prompt.submit` reconhece origem, skills, continuidade, esforço explícito e mensagens durante turno; decide esforço. `turn.step` altera o campo **real** `effort` da requisição, e recolhe uso após a resposta. `turn.complete` encerra atividade e libera reduções adiadas.

Átomos de sessão alimentam `snap` → `AbovePrompt` → dashboard/alerta → `effortRows`. Controles alteram átomos e preferências, mas desenhar uma escolha não comprova envio. No Codex, a adaptação precisa atualizar o estado antes de `effective_collaboration_mode()` ser capturado na submissão e enviado como `TurnStartParams.effort`.

## Matriz completa de capacidades

| Parte | Claude: implementação observada | Adaptação Codex / estado da ES-002 |
|---|---|---|
| Painel/composer | `register.tsx:3010,3263,4233`: dashboard nativo e linha esforço | Patch Ratatui acima do composer; preserva conversa/ferramentas/permissões. Implementado localmente; gates em QA. |
| Esforço manual | `pickEffort:2110`, `turn.step:3956`: seleção desliga Auto; alteração nativa também vence | Setters/catálogo oficiais e estados de esforço Plan/Default preservados. Seleção manual desliga Auto. |
| Auto de esforço | `prompt.submit:3793`, `turn.step:4013`: judge e aplicação real | Regras locais existentes, identificadas na interface; sem chamada extra de modelo. Não equivale ao judge Claude. |
| Continuidade/fila | Follow-up mantém escolha; redução durante turno aguarda conclusão (`3645,3883`) | Aplicação na submissão do próximo turno; steering não reduz turno atual. Risco crítico acompanha continuidade entre modos. |
| Cotas/Running hot | `checkHot:1335`: janela 5h/semanal mais cheia, >=80%; fechado reaparece em95% | Snapshots oficiais Codex, com origem, validade e reset; dados ausentes nunca viram percentuais fictícios. Troca de conta invalida o snapshot. |
| Save mode | `toggleSave:1213`, `capped:1384`: cap medium para decisões Auto até reset | Cap Auto sem rebaixar piso de risco; manual continua soberano. Expiração real e invalidação na troca de conta. |
| Contexto | `checkSwamp:1417`: tokens/janela reais, alerta70% configurável | Codex já mantém contexto no rodapé; preservar indicador nativo, não duplicar estimativas. |
| Cache frio | `cacheTouched:1481`, `classic.SessionStart:3620`: TTL inferido, padrão1h | Sem contrato equivalente confirmado no Codex. Não copiar TTL, limiares150k ou promessa de cache quente. Não portado. |
| Judges | `judge:703`, `askJev:720`, `askHaiku:799` | Haiku depende login Claude; Jev de chave externa. Nenhum deles ativado no Codex pela ES-002. |
| Preferências/setup | `session.start:3573`, `SETTING_FIELDS:1794`, `saveDraft:1862` | Controles mínimos por sessão primeiro; persistência global e wizard completo não fazem parte da primeira faixa. |
| Modelo sugerido | `isAutoModel`, `effortRows:3269`: sugere troca com aceite; padrão off | Seletor nativo Codex preservado. Não confundir esse toggle com Auto esforço. |
| Modelo roteado | `config.modelAuto`, `routeWorth:2310`, requisições3891: troca real, padrão off | Nova política de roteamento exigiria eval e entrega própria. Não portado. |
| Handoff | `writeHandoff:1686`, `finishHandoff:1730`: Quick fork/resumo, Full skill/Git/HANDOFF.md | Exige integração própria com recuperação antes de limpar conversa. Não recriar parcialmente com clear automático. Não portado. |
| Compactação | `session.compact:3550`, `haikuCompaction:3511`: substitui resumo por Haiku, fallback nativo | Compactação nativa Codex preservada; não trocar resumidor ou enviar conversa a outro provedor. |
| Progresso | `progress.tsx`: fases/segmentos/sons; só utilitários importados no register atual | Barra completa existe, mas **não está ligada** no Claude atual. Codex recebe `TurnPlanUpdated`; possível adaptação futura sobre evento real. |
| Agentes/mapa | `agent.spawn:4126`, `tool.call:4159`, `agents.tsx:553`: atividade, passos, arquivos/imports | Navegação/agentes nativos preservados. Mapa extra e inferência de waiting não portados. |
| Effort dos helpers | `helperEffort:3412`, `agent.spawn:4126`, `turn.step:4002` | Política além do turno principal; exige escopo/eval próprios. Não alterar definição de agentes automaticamente. |
| Medição | `weighted:1145`, `countPrompt:1179`, `savedText:2077` | Contadores Codex somente quando observáveis. Pesos/preços Claude não equivalem à assinatura Codex; nenhuma economia alegada. |
| Aparência | `theme.ts`, `art.ts`, `brand-mark.ts`, render JSX/SVG | Cores âmbar/texto da referência traduzidas a células Ratatui; layout reduzido em terminal estreito. Sem dependência de SVG/animações. |
| Comandos/debug | `command.run:3670`: setup, stats, bench, debug, demos | Apenas atalhos/controles necessários ao painel inicial; não publicar demos como medição real. |
| Updates/uninstall | Updater upstream desativado (`2661`); uninstall chama CLI | Build separado e fixado por hash. Codex oficial e plugins existentes preservados; atualizações demandam rebase/revisão do patch. |

## Precedência e segurança

Claude alterna uma superfície principal: survey do host → Settings → Compact/Handoff → setup → judge indisponível → Running hot → confirmação → cartão de operação → cache frio → contexto cheio → dashboard. Terminal preserva linha de esforço sob alertas. Não são todos os painéis simultâneos.

No Codex, perguntas/aprovações/modais pertencem ao host e têm prioridade sobre EffortShift. Sem foco em campo adicional nem interceptação de texto comum; controles por atalhos indicados na faixa. Os níveis vêm do catálogo real, inclusive níveis avançados que exigem confirmação própria.

Auto Claude pode executar inferência adicional por prompt e por recomendação de handoff, mesmo com Auto de esforço desligado. Jev recebe prompt e recorte de conversa; Haiku recebe recortes e, em compactação/handoff, até2,4 milhões de caracteres. Instrução de não expor segredo não é sanitização. Não transportar esse fluxo ao Codex silenciosamente.

Claude persiste preferências/Auto/escolha/setup em store e tenta configuração oficial antes do fallback. Há logs locais automáticos de render; proof opcional inclui trechos de prompt/ferramentas. A gravação de chave pelo painel usa `~/.config/jev/.env` em texto. A faixa Codex não precisa ler esses arquivos, armazenar prompts ou acrescentar logs de conversa.

## Achados para evitar copiar defeitos

- A barra completa de progresso/sons não é registrada pelo plugin atual, apesar de existir e ter testes. Lista de passos do dashboard e painel de agentes estão conectados.
- Tipos de estado têm deriva em relação ao código executado; usar fonte/runtime e testes como referência.
- Agente em ferramenta por oito segundos vira “waiting” por heurística; isso não significa espera pelo usuário. “All done” pode incluir falhas entre estados terminais.
- Save no Claude pode limitar crítico a medium; a política Codex mantém piso high para risco, embora isso reduza equivalência literal.
- Falha de clipboard pode substituir rascunho no handoff Claude; clear seguido de falha no reenvio tem recuperação limitada. Não reproduzir essa fragilidade.

## Evidência e limites

Auditoria leu eventos, estado, módulos, manifests, configuração, testes e harness Claude. Suíte Claude usa engine/model/http/store/clock simulados; seus testes são referência comportamental, não prova de operação Codex. Fonte oficial para encaixe: `codex-rs/tui/src/bottom_pane/mod.rs`, `chatwidget/reasoning_shortcuts.rs`, `settings.rs`, `input_submission.rs`, `rate_limits.rs` e `app_server_session.rs`.

ES-002 entrega primeiro o fio painel→esforço→turno real; itens não portados acima permanecem explícitos. Não iniciar outras features na mesma branch. Build, renderização, instalação e smoke devem ser registrados separadamente em STATUS; compilar não comprova inferência nem economia.
