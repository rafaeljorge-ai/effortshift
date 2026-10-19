# Plugin nativo Codex

O pacote plugins/codex é instalado como effortshift@effortshift e roda dentro do CLI oficial. Não inicia o cliente web/terminal próprio nem depende dos demais arquivos do repositório. Node22+ deve estar disponível no ambiente do CLI.

SessionStart apresenta o plugin; UserPromptSubmit classifica o texto em memória e retorna continue:true e systemMessage. Não há additionalContext, subprocesso, rede, leitura de transcript/credenciais ou armazenamento de prompt. Entrada inválida/excessiva falha permitindo continuidade e explica que nenhuma recomendação foi aplicada.

O schema embutido do Codex CLI0.163.0 restringe output de UserPromptSubmit com additionalProperties:false; não aceita model/effort. Por isso, a recomendação é consultiva. O hook também não recebe catálogo nem esforço atual. Usar instrução de prompt para fingir aplicação seria incorreto.

Há suporte a mensagem de hook; não foi encontrado contrato de statusline com script arbitrário equivalente ao painel Claude. A statusline nativa permite itens predefinidos, incluindo model-with-reasoning. O plugin não altera preferências visuais globais do usuário.

Instalação e hooks são controles distintos. /hooks permite revisar origem/comando e confiar somente no EffortShift. Cada definição alterada volta à revisão; não editar o banco de confiança nem usar flags de bypass. No teste local, os dois hooks EffortShift foram revisados individualmente pela interface oficial depois da revisão independente do código; outros hooks permaneceram intactos.

Para desenvolvimento: node tools/build-codex-plugin.mjs copia src/decision.mjs para plugins/codex/lib/decision.mjs. O check compara integridade para impedir que regras diferentes sejam distribuídas inadvertidamente. Faça o build e os testes antes de reinstalar uma versão.

Fontes oficiais consultadas em19/10/2026: [empacotamento](https://developers.openai.com/plugins/build/plugins) e [hooks](https://learn.chatgpt.com/docs/hooks). A compatibilidade observada é específica do CLI instalado; capacidades futuras exigem novos testes.
