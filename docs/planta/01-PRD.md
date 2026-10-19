# EffortShift — produto

Confirmado pelo usuário: nome EffortShift, fork do Effortless, suporte Claude Code + Codex, painel visual no terminal, entrega local para testar já, execução por subagentes, frontend verificado com agent-browser. Desenvolvimento e decisões reversíveis autorizados sem nova confirmação.

Usuário: Rafael, alternando entre dois agentes autenticados e querendo controlar esforço com visibilidade. Jornada: iniciar EffortShift, conectar Codex, enviar tarefa, entender esforço escolhido e ver a resposta real. Claude é iniciado com o plugin local do fork e mantém seu painel nativo.

Aceite ES-001:
1. `npm start` abre servidor local e imprime endereço com token; painel funcional sem números inventados. `node bin/effortshift.mjs codex` abre cliente interativo com cabeçalho visual.
2. Codex conecta ao app-server via stdio, descobre modelos/esforços e limites reais, mantém conversa e aplica esforço em turn/start. Envio, resposta, cancelamento e falhas são visíveis. Aprovações explícitas ou recusa segura; sem bypass.
3. Auto/manual e perfil econômico/equilibrado/qualidade afetam pedidos posteriores; alteração durante execução não muda retroativamente a decisão daquele turno. Sem diminuir piso de tarefas críticas para economizar.
4. Plugin Claude local é identificado como EffortShift, conserva painel e automação testados do upstream, com avisos MIT e atualizador do upstream desativado no fork.
5. Testes unitários/protocolo/HTTP, verificação visual desktop/mobile, smoke real somente leitura e revisão independente com evidências.

Fora de escopo: publicar fork GitHub/npm, deploy, mexer no app oficial Codex, sincronizar conversas entre provedores, prometer economia, modelo avaliador adicional, billing, login próprio, troca automática de modelos, handoff entre agentes. Esta entrega é uma fatia vertical única, não uma onda de features independentes.
