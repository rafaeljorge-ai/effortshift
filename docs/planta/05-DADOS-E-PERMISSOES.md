# Dados e permissões

Estado de sessão em memória; Codex pode manter seu próprio histórico local conforme configurações existentes. Sem banco próprio e sem analytics. Prompts vão somente ao agente escolhido pelo usuário. Não copiar credenciais nem armazenar conteúdo de sessão nos testes versionados. Tokens do painel não entram em screenshots, docs ou logs de evidência.

Token local protege API; Origin/Host validados; escopo de bind 127.0.0.1. Padrão somente leitura. Pedidos de permissão não são aprovados silenciosamente. Ferramentas desconhecidas ou solicitações de escopo não implementadas falham fechadas. Não há endpoint de shell genérico.

Shutdown e desconexão cancelam RPCs pendentes. Um pedido de cada vez; corrida de duas submissões retorna conflito. Limite de corpo e de histórico em memória. Claude mantém armazenamento original do plugin em namespace próprio EffortShift; atualizador upstream fica inativo e não executa cópias/downloads.
