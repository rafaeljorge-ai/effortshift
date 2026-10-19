# Construção

Fase 1 = esqueleto que anda: uma única entrega ES-001: usuário inicia cliente -> conecta Codex -> envia -> esforço aceito no protocolo -> resposta real no painel. O mesmo fork inicia Claude com painel nativo. Plano técnico: `../superpowers/plans/2026-10-19-effortshift-local.md`.

Pacote A (Sol medium): src/, bin/, test/ e package.json — motor, cliente RPC, servidor, terminal, testes.
Pacote B (Sol medium): web/, hooks/, types/, commands/, tests/, .claude-plugin/ e README — painel web, identidade Claude e atualizador seguro.
Coordenador: contratos/documentação, integração, gates e browser. Revisão independente Sol high após pacotes. Não há branches/PRs paralelos de tasks independentes.

Entrega local autorizada; nenhum fork remoto/issue/PR será publicado em nome do usuário. ES-001 fica registrada na SPEC. Nenhum merge declarado. Git upstream preservado. Não instalar globalmente.
