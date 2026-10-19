# Arquitetura

Fork local com upstream preservado no histórico. Node 22+ ESM sem novas dependências de runtime. Diretórios `src/` (core, RPC, sessão, HTTP, terminal), `web/` (HTML/CSS/JS), `bin/` (comando), `test/` (testes Node). Hooks e testes Claude seguem o runtime original. Nenhuma dependência entre frontend e hooks.

Core `decideEffort({prompt,profile,mode,manualEffort,supportedEfforts,previousEffort})` retorna `{effort,reason,risk}`. Perfil balanced é padrão. `low`, `medium`, `high`, `xhigh`, `max` somente quando o catálogo permitir. Se nenhum esforço suportado, não inventar um. Pisos e intenção explícita têm precedência sobre economia. Regras locais evitam chamada avaliadora extra; esclarecer essa diferença do Claude no produto.

Codex é subprocesso `codex app-server --listen stdio://`. Handshake initialize/initialized; model/list; account/read sem tokens; account/rateLimits/read; thread/start e turn/start; acompanhar itens, deltas, erro, usage e turn/completed. Configuração padrão sandbox read-only e approvalPolicy on-request; permitir workspace-write apenas por escolha explícita no processo local. Recusar métodos de aprovação desconhecidos com erro RPC. Shutdown rejeita requests pendentes e termina filho. Nunca ler/exibir auth.json.

HTTP em 127.0.0.1, porta 4783 por padrão, token aleatório por processo no fragmento da URL. Frontend lê o fragmento, limpa da barra e mantém somente em memória/sessionStorage; manda Authorization Bearer para `/api/*`. Não registrar URL autenticada em artefatos compartilhados. Bloquear Origin externo, Host inválido, corpo excessivo e mutação sem token. Sem CORS aberto, sem shell arbitrário, sem dependência remota/fontes/CDN.

Contrato comum dos pacotes:
```
GET /api/state -> State
POST /api/connect {} -> State (Codex)
POST /api/settings {mode?,profile?,manualEffort?,model?} -> State
POST /api/prompt {prompt:string} -> State (retorno ao aceitar, stream por polling)
POST /api/interrupt {} -> State
POST /api/approval {id:string,decision:'accept'|'decline'} -> State
GET /api/health -> {ok:true} sem informações sensíveis
```
Erros JSON `{error:string}`, status 400/401/403/409/413/500. Polling state 1s; UI não deve sobrepor rascunhos a cada atualização. Configuração no processo, sem persistência global.

```
State = {
 provider:'codex', status:'idle'|'connecting'|'ready'|'running'|'error',
 connected:boolean, sessionId:string|null, cwd:string, error:string|null,
 settings:{mode:'auto'|'manual',profile:'economy'|'balanced'|'quality',manualEffort:string,model:string|null},
 models:[{id:string,label:string,supportedEfforts:string[]}],
 decision:null|{effort:string|null,reason:string,risk:string,status:'recommended'|'submitted'|'confirmed'},
 usage:{input:number|null,cachedInput:number|null,output:number|null,total:number|null,contextPercent:number|null},
 limits:null|{primary:null|{usedPercent:number,resetsAt:number,windowDurationMins:number},secondary:null|{usedPercent:number,resetsAt:number,windowDurationMins:number}},
 messages:[{id:string,role:'user'|'assistant'|'system',text:string}],
 events:[{id:string,at:string,type:string,message:string}],
 approvals:[{id:string,kind:string,description:string}],
 capabilities:{nativeCodexPanel:false,claudePlugin:true}
}
```
Estados monetários/quota não disponíveis permanecem null. Confirmação significa aceite protocolar de turn/start, não prova de toda inferência interna do provedor; nomear isso na UI. Resposta streaming preserva message id e finalização não duplica texto. UI inclui instrução `claude --plugin-dir <raiz>`; não finge controlar sessões Claude externas.
